import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { FormEventHandler, useMemo } from 'react';
import { route } from 'ziggy-js';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type LogUser = { id: number; first_name: string; last_name: string; email: string } | null;

type AiCallLogRow = {
    id: number;
    created_at: string;
    user_id: number | null;
    tenant_id: string | null;
    tenant_name?: string | null;
    tenant_slug?: string | null;
    invocation_kind: string;
    source: string;
    route_name: string | null;
    provider: string;
    api_family: string | null;
    model: string | null;
    prompt_tokens: number | null;
    completion_tokens: number | null;
    total_tokens: number | null;
    duration_ms: number | null;
    success: boolean;
    user?: LogUser;
};

interface Paginator<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

type TenantOption = { id: string; name: string; slug: string };

interface Filters {
    tenant_id: string;
    provider: string;
    model: string;
    source: string;
    invocation_kind: string;
    success: string;
    date_from: string;
    date_to: string;
}

interface Props {
    logs: Paginator<AiCallLogRow>;
    filters: Filters;
    tenantOptions: TenantOption[];
    providerOptions: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'AI API usage', href: '/admin/ai-usage' },
];

function formatTokens(n: number | null | undefined): string {
    if (n === null || n === undefined) return '—';
    return n.toLocaleString();
}

function formatUserDisplay(user: LogUser): string {
    if (!user) return '—';
    const n = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();
    return n || user.email;
}

export default function AdminAiUsageIndex({ logs, filters, tenantOptions, providerOptions }: Props) {
    const applyFilters: FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const params: Record<string, string> = {};
        fd.forEach((value, key) => {
            if (typeof value === 'string' && value.trim() !== '') {
                params[key] = value.trim();
            }
        });
        router.get(route('admin.ai-usage'), params, { preserveState: true, preserveScroll: true });
    };

    const clearFilters = () => {
        router.get(route('admin.ai-usage'), {}, { preserveState: true, preserveScroll: true });
    };

    const defaults = useMemo(
        () => ({
            tenant_id: filters.tenant_id || '',
            provider: filters.provider || '',
            model: filters.model || '',
            source: filters.source || '',
            invocation_kind: filters.invocation_kind || '',
            success: filters.success || '',
            date_from: filters.date_from || '',
            date_to: filters.date_to || '',
        }),
        [filters],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="AI API usage (admin)" />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">AI API usage</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        All OpenAI calls across every organization. Filter by tenant, route/source (agents), provider, model, and outcome.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Filters</CardTitle>
                        <CardDescription>Query parameters are reflected in the URL for sharing.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={applyFilters} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="f_tenant">Organization (tenant)</Label>
                                <select
                                    id="f_tenant"
                                    name="tenant_id"
                                    defaultValue={defaults.tenant_id}
                                    className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                                >
                                    <option value="">All organizations</option>
                                    {tenantOptions.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name} ({t.slug})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="f_provider">Provider</Label>
                                <select
                                    id="f_provider"
                                    name="provider"
                                    defaultValue={defaults.provider}
                                    className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                                >
                                    <option value="">All</option>
                                    {providerOptions.map((p) => (
                                        <option key={p} value={p}>
                                            {p}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="f_kind">Invocation</Label>
                                <select
                                    id="f_kind"
                                    name="invocation_kind"
                                    defaultValue={defaults.invocation_kind}
                                    className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                                >
                                    <option value="">All</option>
                                    <option value="http">HTTP (web)</option>
                                    <option value="cli">CLI / queue</option>
                                </select>
                            </div>

                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="f_source">Source / agent (route name substring)</Label>
                                <Input
                                    id="f_source"
                                    name="source"
                                    placeholder="e.g. cortex.agents.bait, script.generate"
                                    defaultValue={defaults.source}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="f_model">Model (contains)</Label>
                                <Input id="f_model" name="model" placeholder="gpt-4o-mini" defaultValue={defaults.model} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="f_success">Outcome</Label>
                                <select
                                    id="f_success"
                                    name="success"
                                    defaultValue={defaults.success}
                                    className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                                >
                                    <option value="">All</option>
                                    <option value="1">Success</option>
                                    <option value="0">Failed</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="f_from">From date</Label>
                                <Input id="f_from" name="date_from" type="date" defaultValue={defaults.date_from} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="f_to">To date</Label>
                                <Input id="f_to" name="date_to" type="date" defaultValue={defaults.date_to} />
                            </div>

                            <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-4">
                                <Button type="submit">Apply filters</Button>
                                <Button type="button" variant="outline" onClick={clearFilters}>
                                    Clear
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <div className="overflow-hidden rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="whitespace-nowrap">When</TableHead>
                                <TableHead>Organization</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Source</TableHead>
                                <TableHead>Provider</TableHead>
                                <TableHead>API</TableHead>
                                <TableHead>Model</TableHead>
                                <TableHead className="text-right">Tokens</TableHead>
                                <TableHead className="text-right">ms</TableHead>
                                <TableHead className="text-center">OK</TableHead>
                                <TableHead className="text-center">Kind</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={11} className="text-muted-foreground py-10 text-center text-sm">
                                        No API calls match these filters.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.data.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                                            {new Date(row.created_at).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="max-w-[160px]">
                                            <div className="truncate text-sm font-medium" title={row.tenant_id ?? ''}>
                                                {row.tenant_name ?? row.tenant_id ?? '—'}
                                            </div>
                                            {row.tenant_slug ? (
                                                <div className="text-muted-foreground truncate text-[11px]">{row.tenant_slug}</div>
                                            ) : null}
                                        </TableCell>
                                        <TableCell className="max-w-[120px] truncate text-sm">
                                            {row.user ? formatUserDisplay(row.user) : row.user_id === null ? '—' : `#${row.user_id}`}
                                        </TableCell>
                                        <TableCell className="max-w-[240px]">
                                            <div className="truncate font-mono text-xs" title={row.source}>
                                                {row.source}
                                            </div>
                                            {row.route_name && row.route_name !== row.source ? (
                                                <div className="text-muted-foreground truncate text-[11px]">{row.route_name}</div>
                                            ) : null}
                                        </TableCell>
                                        <TableCell className="text-sm">{row.provider}</TableCell>
                                        <TableCell className="font-mono text-xs">{row.api_family ?? '—'}</TableCell>
                                        <TableCell className="max-w-[120px] truncate font-mono text-xs">{row.model ?? '—'}</TableCell>
                                        <TableCell className="text-right font-mono text-xs">{formatTokens(row.total_tokens)}</TableCell>
                                        <TableCell className="text-right font-mono text-xs">{row.duration_ms ?? '—'}</TableCell>
                                        <TableCell className="text-center">
                                            {row.success ? (
                                                <Badge variant="secondary" className="text-xs">
                                                    OK
                                                </Badge>
                                            ) : (
                                                <Badge variant="destructive" className="text-xs">
                                                    Err
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center text-xs">{row.invocation_kind}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {logs.last_page > 1 && (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-muted-foreground text-sm">
                            Page {logs.current_page} of {logs.last_page} ({logs.total} calls)
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {logs.links.map((link, i) => (
                                <Button
                                    key={i}
                                    variant={link.active ? 'secondary' : 'outline'}
                                    size="sm"
                                    disabled={!link.url}
                                    asChild={!!link.url && !link.active}
                                >
                                    {link.url && !link.active ? (
                                        <Link href={link.url} preserveScroll only={['logs', 'filters', 'tenantOptions', 'providerOptions']}>
                                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                        </Link>
                                    ) : (
                                        <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                    )}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
