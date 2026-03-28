import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Cloud, Database, Download, FolderArchive, HardDrive, Info, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: route('admin.dashboard') },
    { title: 'Backups', href: route('admin.backup') },
];

interface BackupSettingsProps {
    google_drive_connected: boolean;
    google_drive_folder_id: string | null;
    schedule_enabled: boolean;
    schedule_frequency: string;
    schedule_time: string;
    schedule_weekday: number | null;
    schedule_include_storage: boolean;
    last_scheduled_run_at: string | null;
    last_scheduled_error: string | null;
}

interface Props {
    settings: BackupSettingsProps;
    database: {
        connection: string;
        driver: string;
        backup_method_label: string;
        cli_tool: string;
        server_requirement: string;
    };
    tenant_count: number;
    backup_oauth_callback_url: string;
    success?: string;
    error?: string;
}

function parseFilenameFromContentDisposition(header: string | null): string | undefined {
    if (!header) return undefined;
    const utf8 = /filename\*=UTF-8''([^;\s]+)/i.exec(header);
    if (utf8?.[1]) {
        try {
            return decodeURIComponent(utf8[1].replace(/"/g, ''));
        } catch {
            return utf8[1];
        }
    }
    const quoted = /filename="([^"]+)"/i.exec(header);
    if (quoted?.[1]) return quoted[1];
    const plain = /filename=([^;\s]+)/i.exec(header);
    return plain?.[1];
}

const weekdays = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
];

export default function AdminBackup({ settings, database, tenant_count, backup_oauth_callback_url, success, error }: Props) {
    const { flash } = usePage().props as { flash?: { success?: string; error?: string } };
    const message = success ?? flash?.success;
    const errMsg = error ?? flash?.error;

    const [activeDownload, setActiveDownload] = useState<string | null>(null);

    const runBackupDownload = async (url: string, defaultFilename: string, loadingMessage: string, key: string) => {
        const toastId = toast.loading(loadingMessage);
        setActiveDownload(key);
        try {
            const res = await fetch(url, {
                credentials: 'same-origin',
                headers: {
                    'X-Backup-Download': '1',
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: '*/*',
                },
            });
            if (!res.ok) {
                let errText = `Request failed (${res.status})`;
                const ct = res.headers.get('Content-Type') ?? '';
                if (ct.includes('application/json')) {
                    try {
                        const body = (await res.json()) as { message?: string };
                        if (body.message) errText = body.message;
                    } catch {
                        /* ignore */
                    }
                }
                toast.error('Backup failed', { id: toastId, description: errText });
                return;
            }
            const blob = await res.blob();
            const name = parseFilenameFromContentDisposition(res.headers.get('Content-Disposition')) ?? defaultFilename;
            const href = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = href;
            a.download = name;
            a.rel = 'noopener';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(href);
            toast.success('Download started', { id: toastId, description: name });
        } catch (e) {
            toast.error('Backup failed', {
                id: toastId,
                description: e instanceof Error ? e.message : 'Unknown error',
            });
        } finally {
            setActiveDownload(null);
        }
    };

    const form = useForm({
        schedule_enabled: settings.schedule_enabled,
        schedule_frequency: settings.schedule_frequency,
        schedule_time: settings.schedule_time,
        schedule_weekday: settings.schedule_weekday ?? 0,
        schedule_include_storage: settings.schedule_include_storage,
        google_drive_folder_id: settings.google_drive_folder_id ?? '',
    });

    const disconnectForm = useForm({});

    const submitSettings = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(route('admin.backup.settings'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Backups - Admin" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex flex-wrap items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={route('admin.dashboard')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to dashboard
                        </Link>
                    </Button>
                </div>

                {message && (
                    <div className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-950/30 dark:text-green-200">
                        {message}
                    </div>
                )}
                {errMsg && (
                    <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200">
                        {errMsg}
                    </div>
                )}

                <Alert>
                    <Info className="size-4" />
                    <AlertTitle>Which database engine is used?</AlertTitle>
                    <AlertDescription className="space-y-3">
                        <p>
                            This page does <strong>not</strong> lock you to SQLite. Backups follow Laravel&apos;s{' '}
                            <strong>default connection</strong> for <em>this</em> environment (from{' '}
                            <code className="rounded bg-muted px-1 text-xs">config/database.php</code> and{' '}
                            <code className="rounded bg-muted px-1 text-xs">DB_CONNECTION</code> in{' '}
                            <code className="rounded bg-muted px-1 text-xs">.env</code>). Local development often uses{' '}
                            <span className="font-medium">sqlite</span>; production can use{' '}
                            <span className="font-medium">pgsql</span> or <span className="font-medium">mysql</span> — each
                            server picks the matching tool automatically.
                        </p>
                        <div className="overflow-x-auto rounded-md border border-border">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-muted/50 font-medium">
                                    <tr>
                                        <th className="px-3 py-2">Driver</th>
                                        <th className="px-3 py-2">Backup tool</th>
                                        <th className="px-3 py-2">Archive entry</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    <tr>
                                        <td className="px-3 py-2 font-mono">sqlite</td>
                                        <td className="px-3 py-2">sqlite3 / PHP SQLite3</td>
                                        <td className="px-3 py-2"><code className="rounded bg-muted px-1">.sqlite</code></td>
                                    </tr>
                                    <tr>
                                        <td className="px-3 py-2 font-mono">pgsql</td>
                                        <td className="px-3 py-2">pg_dump</td>
                                        <td className="px-3 py-2"><code className="rounded bg-muted px-1">.sql</code></td>
                                    </tr>
                                    <tr>
                                        <td className="px-3 py-2 font-mono">mysql / mariadb</td>
                                        <td className="px-3 py-2">mysqldump</td>
                                        <td className="px-3 py-2"><code className="rounded bg-muted px-1">.sql</code></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </AlertDescription>
                </Alert>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Database className="h-5 w-5" />
                                Database
                            </CardTitle>
                            <CardDescription>
                                <span className="font-medium text-foreground">This environment:</span> connection{' '}
                                <code className="rounded bg-muted px-1 text-xs">{database.connection}</code>, driver{' '}
                                <code className="rounded bg-muted px-1 text-xs">{database.driver}</code> —{' '}
                                {database.backup_method_label}
                                {database.cli_tool ? (
                                    <>
                                        {' '}
                                        (<span className="font-medium">{database.cli_tool}</span>)
                                    </>
                                ) : null}
                                . {tenant_count > 0 ? 'Includes each tenant database when you choose “all databases”.' : ''}{' '}
                                Large archives can take a while; a toast shows status while the file is prepared.
                            </CardDescription>
                            <p className="text-xs text-muted-foreground">{database.server_requirement}</p>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3">
                            <Button
                                type="button"
                                variant="secondary"
                                disabled={activeDownload !== null}
                                onClick={() =>
                                    runBackupDownload(
                                        `${route('admin.backup.database')}?scope=central`,
                                        'laravel-databases.zip',
                                        'Preparing central database backup…',
                                        'db-central'
                                    )
                                }
                            >
                                {activeDownload === 'db-central' ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Download className="mr-2 h-4 w-4" />
                                )}
                                Download central database
                            </Button>
                            {tenant_count > 0 ? (
                                <Button
                                    type="button"
                                    disabled={activeDownload !== null}
                                    onClick={() =>
                                        runBackupDownload(
                                            `${route('admin.backup.database')}?scope=all`,
                                            'laravel-databases.zip',
                                            'Preparing full database ZIP (all orgs)…',
                                            'db-all'
                                        )
                                    }
                                >
                                    {activeDownload === 'db-all' ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Download className="mr-2 h-4 w-4" />
                                    )}
                                    Download all databases (ZIP)
                                </Button>
                            ) : (
                                <p className="text-sm text-muted-foreground">No tenant databases yet; only central is available.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FolderArchive className="h-5 w-5" />
                                Storage
                            </CardTitle>
                            <CardDescription>
                                ZIP of <code className="rounded bg-muted px-1 text-xs">storage/app</code> excluding framework
                                cache, sessions, and compiled views. Can be large; the browser may use noticeable memory for huge
                                folders.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                type="button"
                                disabled={activeDownload !== null}
                                onClick={() =>
                                    runBackupDownload(
                                        route('admin.backup.storage'),
                                        'laravel-storage-app.zip',
                                        'Preparing storage archive…',
                                        'storage'
                                    )
                                }
                            >
                                {activeDownload === 'storage' ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Download className="mr-2 h-4 w-4" />
                                )}
                                Download storage archive
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Cloud className="h-5 w-5" />
                            Google Drive
                        </CardTitle>
                        <CardDescription>
                            Connect Google to upload scheduled backups. Add this exact redirect URI in Google Cloud Console for
                            your OAuth client:{' '}
                            <code className="rounded bg-muted px-1 text-xs break-all">{backup_oauth_callback_url}</code>. Override
                            with <code className="rounded bg-muted px-1 text-xs">BACKUP_GOOGLE_REDIRECT</code> if needed.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <div className="flex flex-wrap items-center gap-3">
                            {settings.google_drive_connected ? (
                                <>
                                    <span className="text-sm text-muted-foreground">Connected</span>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={disconnectForm.processing}
                                        onClick={() => disconnectForm.post(route('admin.backup.google-drive.disconnect'))}
                                    >
                                        Disconnect
                                    </Button>
                                </>
                            ) : (
                                <Button type="button" asChild>
                                    <a href={route('admin.backup.google-drive.connect')}>
                                        <HardDrive className="mr-2 h-4 w-4" />
                                        Connect Google Drive
                                    </a>
                                </Button>
                            )}
                        </div>
                        {settings.last_scheduled_run_at && (
                            <p className="text-sm text-muted-foreground">
                                Last scheduled upload: {new Date(settings.last_scheduled_run_at).toLocaleString()}
                            </p>
                        )}
                        {settings.last_scheduled_error && (
                            <p className="text-sm text-destructive">Last error: {settings.last_scheduled_error}</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Scheduled backups</CardTitle>
                        <CardDescription>
                            When enabled, the app uploads a database ZIP at the chosen time if Google Drive is connected. Requires
                            the scheduler (<code className="rounded bg-muted px-1 text-xs">php artisan schedule:work</code> or a
                            system cron hitting <code className="rounded bg-muted px-1 text-xs">schedule:run</code>).
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submitSettings} className="flex max-w-xl flex-col gap-6">
                            <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
                                <div>
                                    <Label htmlFor="schedule_enabled">Enable scheduled uploads</Label>
                                    <p className="text-xs text-muted-foreground">Uploads all tenant DBs plus central.</p>
                                </div>
                                <Switch
                                    id="schedule_enabled"
                                    checked={form.data.schedule_enabled}
                                    onCheckedChange={(v) => form.setData('schedule_enabled', v)}
                                />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Frequency</Label>
                                    <Select
                                        value={form.data.schedule_frequency}
                                        onValueChange={(v) => form.setData('schedule_frequency', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="daily">Daily</SelectItem>
                                            <SelectItem value="weekly">Weekly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {form.data.schedule_frequency === 'weekly' && (
                                    <div className="space-y-2">
                                        <Label>Day of week</Label>
                                        <Select
                                            value={String(form.data.schedule_weekday)}
                                            onValueChange={(v) => form.setData('schedule_weekday', parseInt(v, 10))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {weekdays.map((d) => (
                                                    <SelectItem key={d.value} value={String(d.value)}>
                                                        {d.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="schedule_time">Time (server timezone)</Label>
                                    <Input
                                        id="schedule_time"
                                        type="time"
                                        value={form.data.schedule_time}
                                        onChange={(e) => form.setData('schedule_time', e.target.value)}
                                    />
                                    {form.errors.schedule_time && (
                                        <p className="text-sm text-destructive">{form.errors.schedule_time}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
                                <div>
                                    <Label htmlFor="schedule_include_storage">Include storage archive</Label>
                                    <p className="text-xs text-muted-foreground">Also uploads a storage ZIP (second file).</p>
                                </div>
                                <Switch
                                    id="schedule_include_storage"
                                    checked={form.data.schedule_include_storage}
                                    onCheckedChange={(v) => form.setData('schedule_include_storage', v)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="google_drive_folder_id">Drive folder ID (optional)</Label>
                                <Input
                                    id="google_drive_folder_id"
                                    value={form.data.google_drive_folder_id}
                                    onChange={(e) => form.setData('google_drive_folder_id', e.target.value)}
                                    placeholder="From the folder URL in Google Drive"
                                />
                                <p className="text-xs text-muted-foreground">Leave empty to upload to the app folder in Drive.</p>
                            </div>
                            <Button type="submit" disabled={form.processing}>
                                {form.processing ? 'Saving…' : 'Save schedule'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
