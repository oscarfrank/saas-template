import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { useMemo } from 'react';
import { Activity } from 'lucide-react';

import { useTenantRouter } from '@/hooks/use-tenant-router';

import HeadingSmall from '@/components/heading-small';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type LogUser = { id: number; first_name: string; last_name: string; email: string } | null;

type AiCallLogRow = {
    id: number;
    created_at: string;
    user_id: number | null;
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
    http_status: number | null;
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

interface Props {
    logs: Paginator<AiCallLogRow>;
}

function formatTokens(n: number | null | undefined): string {
    if (n === null || n === undefined) return '—';
    return n.toLocaleString();
}

function formatUserDisplay(user: LogUser): string {
    if (!user) return '—';
    const n = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();

    return n || user.email;
}

export default function OrganizationAiUsage({ logs }: Props) {
    const tenantRouter = useTenantRouter();

    const breadcrumbs: BreadcrumbItem[] = useMemo(
        () => [
            { title: 'Organization', href: tenantRouter.route('settings.organization.general') },
            { title: 'AI usage', href: '' },
        ],
        [tenantRouter],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="AI usage" />
            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="AI API usage"
                        description="OpenAI calls from this workspace: who triggered them, models, tokens, and latency. Logs start from when this feature was enabled."
                    />

                    <div className="overflow-hidden rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="whitespace-nowrap">When</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Source / route</TableHead>
                                    <TableHead>Provider</TableHead>
                                    <TableHead>API</TableHead>
                                    <TableHead>Model</TableHead>
                                    <TableHead className="text-right">Tokens</TableHead>
                                    <TableHead className="text-right">ms</TableHead>
                                    <TableHead className="text-center">OK</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-muted-foreground py-10 text-center text-sm">
                                            No API calls recorded yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.data.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                                                {new Date(row.created_at).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="max-w-[140px] truncate text-sm">
                                                {row.user ? formatUserDisplay(row.user) : row.user_id === null ? '—' : `User #${row.user_id}`}
                                            </TableCell>
                                            <TableCell className="max-w-[220px]">
                                                <div className="truncate font-mono text-xs" title={row.source}>
                                                    {row.source}
                                                </div>
                                                {row.route_name && row.route_name !== row.source ? (
                                                    <div className="text-muted-foreground truncate text-[11px]">{row.route_name}</div>
                                                ) : null}
                                            </TableCell>
                                            <TableCell className="text-sm">{row.provider}</TableCell>
                                            <TableCell className="font-mono text-xs">{row.api_family ?? '—'}</TableCell>
                                            <TableCell className="max-w-[140px] truncate font-mono text-xs">{row.model ?? '—'}</TableCell>
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
                                            <Link href={link.url} preserveScroll only={['logs']}>
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

                    <p className="text-muted-foreground flex items-start gap-2 text-xs">
                        <Activity className="mt-0.5 size-4 shrink-0" />
                        <span>
                            <strong className="text-foreground">Source</strong> is the Laravel route name when the call runs in a web request (or{' '}
                            <code className="rounded bg-muted px-1">cli</code> for Artisan/queue). Token counts come from the provider response when available; image calls may show empty tokens.
                        </span>
                    </p>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
