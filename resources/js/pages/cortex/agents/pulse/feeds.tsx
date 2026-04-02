import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import axios from 'axios';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';

import { Loader2, Rss, RefreshCw, Trash2, Plus, Settings, Download, Upload, ArrowLeft } from 'lucide-react';

import { CortexAgentSettingsMenu } from '@/components/cortex/cortex-agent-settings-menu';
import { type PulseFeedRow } from './types';

interface Props {
    openAiConfigured: boolean;
    feeds: PulseFeedRow[];
    max_items_per_feed: number;
}

function formatShortDate(iso: string | null): string {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
        return iso;
    }
}

export default function PulseFeedsPage({ openAiConfigured, feeds: initialFeeds, max_items_per_feed: initialMaxItems }: Props) {
    const tenantRouter = useTenantRouter();

    const breadcrumbs: BreadcrumbItem[] = useMemo(
        () => [
            { title: 'Cortex', href: tenantRouter.route('cortex.index') },
            { title: 'Pulse', href: tenantRouter.route('cortex.agents.pulse') },
            { title: 'Feeds', href: '' },
        ],
        [tenantRouter],
    );

    const [feeds, setFeeds] = useState<PulseFeedRow[]>(initialFeeds);
    const [maxItemsPerFeed, setMaxItemsPerFeed] = useState(initialMaxItems);
    useEffect(() => {
        setFeeds(initialFeeds);
    }, [initialFeeds]);
    useEffect(() => {
        setMaxItemsPerFeed(initialMaxItems);
    }, [initialMaxItems]);

    const importInputRef = useRef<HTMLInputElement>(null);
    const [importReplace, setImportReplace] = useState(false);
    const [applySettingsFromImport, setApplySettingsFromImport] = useState(false);

    const [newName, setNewName] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [savingFeed, setSavingFeed] = useState(false);
    const [feedToDelete, setFeedToDelete] = useState<{ id: number; name: string } | null>(null);
    const [removingFeed, setRemovingFeed] = useState(false);

    const csrf = () => document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

    const addFeed = async () => {
        if (!newName.trim() || !newUrl.trim()) {
            toast.error('Name and feed URL are required.');
            return;
        }
        setSavingFeed(true);
        try {
            const { data } = await axios.post<{ feed: PulseFeedRow }>(
                tenantRouter.route('cortex.agents.pulse.feeds.store'),
                { name: newName.trim(), feed_url: newUrl.trim() },
                {
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrf(),
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                },
            );
            setFeeds((prev) => [...prev, data.feed].sort((a, b) => a.name.localeCompare(b.name)));
            setNewName('');
            setNewUrl('');
            toast.success('Feed saved and refreshed.');
        } catch (e) {
            if (axios.isAxiosError(e)) {
                toast.error((e.response?.data as { message?: string })?.message ?? 'Could not save feed.');
            } else {
                toast.error('Could not save feed.');
            }
        } finally {
            setSavingFeed(false);
        }
    };

    const patchFeed = async (id: number, body: { name?: string; enabled?: boolean }) => {
        try {
            const { data } = await axios.patch<{ feed: PulseFeedRow }>(
                tenantRouter.route('cortex.agents.pulse.feeds.update', { pulseFeed: id }),
                body,
                {
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrf(),
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                },
            );
            setFeeds((prev) => prev.map((f) => (f.id === id ? data.feed : f)).sort((a, b) => a.name.localeCompare(b.name)));
        } catch {
            toast.error('Could not update feed.');
        }
    };

    const removeFeed = async (id: number): Promise<boolean> => {
        try {
            await axios.delete(tenantRouter.route('cortex.agents.pulse.feeds.destroy', { pulseFeed: id }), {
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrf(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            setFeeds((prev) => prev.filter((f) => f.id !== id));
            toast.success('Feed removed.');
            return true;
        } catch {
            toast.error('Could not remove feed.');
            return false;
        }
    };

    const confirmRemoveFeed = async () => {
        if (!feedToDelete) return;
        setRemovingFeed(true);
        try {
            const ok = await removeFeed(feedToDelete.id);
            if (ok) setFeedToDelete(null);
        } finally {
            setRemovingFeed(false);
        }
    };

    const refreshOne = async (id: number) => {
        try {
            const { data } = await axios.post<{ feed: PulseFeedRow }>(
                tenantRouter.route('cortex.agents.pulse.feeds.refresh', { pulseFeed: id }),
                {},
                {
                    headers: {
                        Accept: 'application/json',
                        'X-CSRF-TOKEN': csrf(),
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                },
            );
            setFeeds((prev) => prev.map((f) => (f.id === id ? data.feed : f)));
            toast.success('Feed refreshed.');
        } catch {
            toast.error('Refresh failed.');
        }
    };

    const refreshAll = async () => {
        setSavingFeed(true);
        try {
            const { data } = await axios.post<{ feeds: PulseFeedRow[] }>(
                tenantRouter.route('cortex.agents.pulse.feeds.refresh_all'),
                {},
                {
                    // Server fetches each feed (up to ~22s each); scale client wait with feed count (cap 20 min).
                    timeout: Math.min(20 * 60_000, Math.max(120_000, feeds.length * 30_000)),
                    headers: {
                        Accept: 'application/json',
                        'X-CSRF-TOKEN': csrf(),
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                },
            );
            setFeeds(data.feeds);
            toast.success('All feeds refreshed.');
        } catch {
            toast.error('Bulk refresh failed.');
        } finally {
            setSavingFeed(false);
        }
    };

    const exportFeedList = async () => {
        try {
            const res = await axios.get(tenantRouter.route('cortex.agents.pulse.feeds.export'), {
                responseType: 'blob',
            });
            const blob = new Blob([res.data], { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pulse-feeds-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            toast.success('Exported feed list.');
        } catch {
            toast.error('Export failed.');
        }
    };

    const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) {
            return;
        }
        const fd = new FormData();
        fd.append('file', file);
        fd.append('replace', importReplace ? '1' : '0');
        fd.append('apply_settings', applySettingsFromImport ? '1' : '0');
        setSavingFeed(true);
        try {
            const { data } = await axios.post<{
                feeds: PulseFeedRow[];
                max_items_per_feed?: number;
                created: number;
                skipped: number;
                errors: string[];
            }>(tenantRouter.route('cortex.agents.pulse.feeds.import'), fd, {
                timeout: 120_000,
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrf(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            setFeeds(data.feeds);
            if (typeof data.max_items_per_feed === 'number') {
                setMaxItemsPerFeed(data.max_items_per_feed);
            }
            const errCount = data.errors?.length ?? 0;
            const base = `Imported ${data.created} feed(s).${data.skipped ? ` Skipped ${data.skipped} duplicate(s).` : ''}${errCount ? ` ${errCount} row warning(s).` : ''}`;
            toast.success(
                data.created > 0 ? `${base} Use Refresh all to cache headlines.` : base,
            );
        } catch (err) {
            if (axios.isAxiosError(err)) {
                toast.error((err.response?.data as { message?: string })?.message ?? 'Import failed.');
            } else {
                toast.error('Import failed.');
            }
        } finally {
            setSavingFeed(false);
        }
    };

    const canUseAgent = openAiConfigured;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pulse feeds - Cortex" />
            <div className="relative min-h-[calc(100vh-8rem)]">
                <div className="pointer-events-none absolute inset-x-0 -top-px h-40 bg-gradient-to-b from-primary/15 via-primary/5 to-transparent" />
                <div className="relative mx-auto max-w-7xl space-y-6 p-4 md:p-6 lg:gap-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex items-start gap-3">
                            <Button variant="ghost" size="icon" className="mt-0.5 shrink-0" asChild>
                                <Link href={tenantRouter.route('cortex.agents.pulse')} aria-label="Back to Pulse chat">
                                    <ArrowLeft className="size-5" />
                                </Link>
                            </Button>
                            <div>
                                <h1 className="text-3xl font-semibold tracking-tight">Pulse feeds</h1>
                                <p className="text-muted-foreground mt-1 max-w-xl text-sm leading-relaxed">
                                    Add RSS or Atom sources, refresh to cache headlines, and enable which feeds Pulse can use. Ideation chat lives on the main Pulse page.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 md:items-end">
                            <div className="flex flex-wrap items-center justify-end gap-2">
                                <CortexAgentSettingsMenu agentKey="pulse" />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5"
                                    disabled={savingFeed}
                                    onClick={() => void exportFeedList()}
                                >
                                    <Download className="size-3.5" />
                                    Export
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5"
                                    disabled={savingFeed}
                                    onClick={() => importInputRef.current?.click()}
                                >
                                    <Upload className="size-3.5" />
                                    Import
                                </Button>
                                <input
                                    ref={importInputRef}
                                    type="file"
                                    accept=".json,application/json"
                                    className="hidden"
                                    onChange={(ev) => void onImportFile(ev)}
                                />
                                <Button type="button" variant="secondary" size="sm" className="gap-1.5" asChild>
                                    <Link href={tenantRouter.route('cortex.agents.pulse.settings')}>
                                        <Settings className="size-3.5" />
                                        Settings
                                    </Link>
                                </Button>
                            </div>
                            <div className="flex max-w-md flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                                <label className="text-muted-foreground flex cursor-pointer items-center gap-2 text-xs">
                                    <Checkbox checked={importReplace} onCheckedChange={(v) => setImportReplace(Boolean(v))} />
                                    Replace all feeds on import
                                </label>
                                <label className="text-muted-foreground flex cursor-pointer items-center gap-2 text-xs">
                                    <Checkbox checked={applySettingsFromImport} onCheckedChange={(v) => setApplySettingsFromImport(Boolean(v))} />
                                    Apply max items from file
                                </label>
                            </div>
                        </div>
                    </div>

                    {!canUseAgent && (
                        <Alert variant="destructive">
                            <AlertTitle>AI not configured for Pulse</AlertTitle>
                            <AlertDescription>
                                Open <strong>Settings → Agent settings</strong> and configure your provider and API keys.
                            </AlertDescription>
                        </Alert>
                    )}

                    <Card className="overflow-hidden border-border/80 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                        <CardHeader className="border-b bg-muted/30 pb-4">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Rss className="size-5 text-primary" />
                                        Signal feeds
                                    </CardTitle>
                                    <CardDescription className="mt-1.5">
                                        Stored per workspace; cached on refresh. Max{' '}
                                        <strong>{maxItemsPerFeed}</strong> items per feed per refresh (
                                        <Link
                                            href={tenantRouter.route('cortex.agents.pulse.settings')}
                                            className="text-primary font-medium underline-offset-4 hover:underline"
                                        >
                                            change
                                        </Link>
                                        ).
                                    </CardDescription>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="shrink-0 gap-1.5"
                                    disabled={!canUseAgent || savingFeed || feeds.length === 0}
                                    onClick={() => void refreshAll()}
                                >
                                    <RefreshCw className="size-3.5" />
                                    Refresh all
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                            <div className="space-y-2 rounded-xl border bg-card/50 p-3">
                                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Add feed</Label>
                                <Input
                                    placeholder="Label e.g. Techmeme"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    disabled={!canUseAgent || savingFeed}
                                />
                                <Input
                                    placeholder="https://example.com/feed.xml"
                                    value={newUrl}
                                    onChange={(e) => setNewUrl(e.target.value)}
                                    disabled={!canUseAgent || savingFeed}
                                    className="font-mono text-xs"
                                />
                                <Button type="button" className="w-full gap-2" disabled={!canUseAgent || savingFeed} onClick={() => void addFeed()}>
                                    {savingFeed ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                                    Save & pull feed
                                </Button>
                            </div>

                            {feeds.length === 0 ? (
                                <div className="text-muted-foreground rounded-xl border border-dashed py-10 text-center text-sm">
                                    No feeds yet. Add a public RSS or Atom URL above.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                                    {feeds.map((f) => (
                                        <div
                                            key={f.id}
                                            className="group flex h-full min-h-[11rem] flex-col rounded-lg border bg-card/80 p-3 shadow-sm transition-colors hover:bg-card"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <span className="line-clamp-2 min-w-0 flex-1 text-sm font-semibold leading-snug" title={f.name}>
                                                    {f.name}
                                                </span>
                                                <div className="flex shrink-0 items-center gap-1.5">
                                                    <span className="text-muted-foreground hidden text-[9px] uppercase sm:inline">On</span>
                                                    <Switch
                                                        checked={f.enabled}
                                                        onCheckedChange={(c) => void patchFeed(f.id, { enabled: c })}
                                                        disabled={!canUseAgent}
                                                        className="scale-90"
                                                    />
                                                </div>
                                            </div>
                                            <p
                                                className="text-muted-foreground mt-1 line-clamp-2 break-all font-mono text-[10px] leading-snug"
                                                title={f.feed_url}
                                            >
                                                {f.feed_url}
                                            </p>
                                            <div className="text-muted-foreground mt-2 flex min-h-[2.25rem] flex-wrap items-start gap-x-1.5 gap-y-0.5 text-[11px] leading-tight">
                                                <span>
                                                    {f.item_count} items · {formatShortDate(f.last_fetched_at)}
                                                </span>
                                                {f.fetch_error && (
                                                    <span className="text-amber-600 dark:text-amber-400" title={f.fetch_error}>
                                                        Issue
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-auto flex items-center justify-end gap-0.5 border-t border-border/60 pt-2 opacity-90 group-hover:opacity-100">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8"
                                                    title="Refresh feed"
                                                    onClick={() => void refreshOne(f.id)}
                                                    disabled={!canUseAgent}
                                                >
                                                    <RefreshCw className="size-3.5" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 text-destructive hover:text-destructive"
                                                    title="Remove feed"
                                                    onClick={() => setFeedToDelete({ id: f.id, name: f.name })}
                                                    disabled={!canUseAgent}
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <AlertDialog
                open={feedToDelete !== null}
                onOpenChange={(open) => {
                    if (!open && !removingFeed) setFeedToDelete(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove this feed?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {feedToDelete ? (
                                <>
                                    <span className="font-medium text-foreground">{feedToDelete.name}</span> will be removed from Pulse. This
                                    cannot be undone.
                                </>
                            ) : null}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={removingFeed}>Cancel</AlertDialogCancel>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={removingFeed}
                            onClick={() => void confirmRemoveFeed()}
                        >
                            {removingFeed ? (
                                <>
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                    Removing…
                                </>
                            ) : (
                                'Remove feed'
                            )}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
