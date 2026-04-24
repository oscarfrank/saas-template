import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PageProps } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import { usePage } from '@inertiajs/react';
import { useCallback, useMemo, useState } from 'react';
import axios from 'axios';
import { route } from 'ziggy-js';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { History, Loader2, Wand2 } from 'lucide-react';

type SessionItem = {
    id: string;
    title: string;
    last_activity_at: string | null;
    created_at: string | null;
};

interface PagePropsType extends PageProps {
    sessions: SessionItem[];
    [key: string]: unknown;
}

function formatWhen(iso: string | null): string {
    if (!iso) {
        return '—';
    }
    try {
        return new Date(iso).toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return '—';
    }
}

export default function MirageHistoryPage() {
    const tenantRouter = useTenantRouter();
    const { sessions } = usePage<PagePropsType>().props;
    const [deleting, setDeleting] = useState<string | null>(null);

    const breadcrumbs: BreadcrumbItem[] = useMemo(
        () => [
            { title: 'Cortex', href: tenantRouter.route('cortex.index') },
            { title: 'Mirage', href: tenantRouter.route('cortex.agents.mirage') },
            { title: 'History', href: '' },
        ],
        [tenantRouter],
    );

    const removeSession = useCallback(
        async (id: string) => {
            if (!window.confirm('Remove this session from your list? (Usage is still on record for billing.)')) {
                return;
            }
            setDeleting(id);
            const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
            try {
                await axios.delete(
                    route('cortex.agents.mirage.sessions.destroy', { tenant: tenantRouter.tenant.slug, mirageSession: id }),
                    {
                        headers: {
                            Accept: 'application/json',
                            'X-CSRF-TOKEN': csrf,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                    },
                );
                router.reload();
            } catch {
                toast.error('Could not remove session.');
            } finally {
                setDeleting(null);
            }
        },
        [tenantRouter.tenant.slug],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mirage history" />
            <div className="mx-auto w-full max-w-2xl flex flex-col gap-3 px-3 py-2 md:px-4">
                <header className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight">Mirage sessions</h1>
                        <p className="text-muted-foreground text-xs">Open a past run or start fresh from Mirage.</p>
                    </div>
                    <Button asChild type="button" className="shrink-0">
                        <Link href={tenantRouter.route('cortex.agents.mirage')}>
                            <Wand2 className="size-4" />
                            New session
                        </Link>
                    </Button>
                </header>

                <Card>
                    <CardHeader className="p-3 pb-2">
                        <div className="flex items-center gap-2 text-sm">
                            <History className="text-muted-foreground size-4" />
                            <CardTitle className="text-sm">Your sessions</CardTitle>
                        </div>
                        <CardDescription className="text-xs">
                            Each session keeps your thumbnail runs in order, like a chat.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {sessions.length === 0 ? (
                            <p className="text-muted-foreground p-4 text-center text-xs">No saved sessions yet.</p>
                        ) : (
                            <div className="max-h-[min(70dvh,520px)] overflow-y-auto">
                                <ul className="divide-y">
                                    {sessions.map((s) => (
                                        <li key={s.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                                            <div className="min-w-0">
                                                <Link
                                                    className="text-foreground line-clamp-1 text-sm font-medium hover:underline"
                                                    href={route('cortex.agents.mirage.sessions.show', {
                                                        tenant: tenantRouter.tenant.slug,
                                                        mirageSession: s.id,
                                                    })}
                                                >
                                                    {s.title}
                                                </Link>
                                                <p className="text-muted-foreground text-[10px]">{formatWhen(s.last_activity_at)}</p>
                                            </div>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                className="text-destructive hover:text-destructive h-7 shrink-0 text-xs"
                                                disabled={deleting === s.id}
                                                onClick={() => void removeSession(s.id)}
                                            >
                                                {deleting === s.id ? <Loader2 className="size-3 animate-spin" /> : 'Remove'}
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
