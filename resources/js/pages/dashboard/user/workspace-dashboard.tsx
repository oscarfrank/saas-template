import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { useAuth } from '@/hooks/use-auth';
import { useGreeting } from '@/hooks/use-greeting';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Calendar,
    ListTodo,
    Youtube,
    Video,
    ChevronRight,
    Clock,
    LayoutGrid,
} from 'lucide-react';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/** Badge class for script production_status / status in upcoming events */
const scriptStatusBadgeClass: Record<string, string> = {
    // production_status
    not_shot: 'border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
    shot: 'border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
    editing: 'border-violet-200 bg-violet-100 text-violet-800 dark:border-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
    edited: 'border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
    // status (when no production_status)
    draft: 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300',
    writing: 'border-sky-200 bg-sky-100 text-sky-800 dark:border-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
    completed: 'border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
    published: 'border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
    in_review: 'border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
    archived: 'border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400',
};

/** Badge class for task status in My tasks */
const taskStatusBadgeClass: Record<string, string> = {
    todo: 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300',
    in_progress: 'border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
    done: 'border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
};

function formatStatusLabel(value: string): string {
    return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Workspace', href: '/dashboard/workspace' },
];

interface UpcomingScript {
    id: number;
    uuid: string;
    title: string;
    scheduled_at: string | null;
    status: string;
    production_status: string | null;
    script_type_name?: string | null;
    script_type_slug?: string | null;
}

interface UpcomingTask {
    id: number;
    uuid: string;
    title: string;
    due_at: string | null;
    status: string;
}

interface Props {
    upcomingScripts: UpcomingScript[];
    upcomingTasks: UpcomingTask[];
}

export default function WorkspaceDashboard({ upcomingScripts = [], upcomingTasks = [] }: Props) {
    const tenantRouter = useTenantRouter();
    const { user } = useAuth();
    const { getGreeting } = useGreeting();

    const formatDate = (iso: string | null) => {
        if (!iso) return '—';
        const d = new Date(iso);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (d.toDateString() === today.toDateString()) return `Today ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        if (d.toDateString() === tomorrow.toDateString()) return `Tomorrow ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Workspace" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-semibold">
                            {getGreeting()}, {(user.first_name as string)} {(user.last_name as string)}
                        </h3>
                        <p className="text-muted-foreground">Your workspace: events, tasks, and YouTube in one place.</p>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Upcoming events (scripts) */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Calendar className="h-5 w-5" />
                                Upcoming events
                            </CardTitle>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href={tenantRouter.route('script.calendar')}>
                                    View calendar
                                    <ChevronRight className="ml-1 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {upcomingScripts.length === 0 ? (
                                <p className="text-muted-foreground text-sm py-4">
                                    No upcoming scheduled scripts. Schedule shoots from the Script calendar.
                                </p>
                            ) : (
                                <ul className="space-y-3">
                                    {upcomingScripts.map((s) => (
                                        <li key={s.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Link
                                                        href={tenantRouter.route('script.edit', { script: s.uuid })}
                                                        className="font-medium hover:underline truncate block"
                                                    >
                                                        {s.title}
                                                    </Link>
                                                    {s.script_type_slug && (
                                                        <span
                                                            className={cn(
                                                                'shrink-0 text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded',
                                                                s.script_type_slug === 'shorts'
                                                                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                                                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                                            )}
                                                        >
                                                            {s.script_type_slug === 'shorts' ? 'Short' : 'Long form'}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-muted-foreground text-sm flex items-center gap-1 mt-0.5">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    {formatDate(s.scheduled_at)}
                                                </p>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    'ml-2 shrink-0 capitalize',
                                                    scriptStatusBadgeClass[(s.production_status || s.status) ?? ''] ??
                                                        'bg-secondary/50 text-secondary-foreground'
                                                )}
                                            >
                                                {formatStatusLabel(s.production_status || s.status)}
                                            </Badge>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>

                    {/* My tasks */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <ListTodo className="h-5 w-5" />
                                My tasks
                            </CardTitle>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href={tenantRouter.route('hr.tasks.index')}>
                                    View all
                                    <ChevronRight className="ml-1 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {upcomingTasks.length === 0 ? (
                                <p className="text-muted-foreground text-sm py-4">
                                    No upcoming tasks. Tasks assigned to you in HR will appear here.
                                </p>
                            ) : (
                                <ul className="space-y-3">
                                    {upcomingTasks.map((t) => (
                                        <li key={t.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50">
                                            <div className="min-w-0 flex-1">
                                                <Link
                                                    href={tenantRouter.route('hr.tasks.show', { task: t.uuid })}
                                                    className="font-medium hover:underline truncate block"
                                                >
                                                    {t.title}
                                                </Link>
                                                <p className="text-muted-foreground text-sm flex items-center gap-1 mt-0.5">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    Due {formatDate(t.due_at)}
                                                </p>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    'ml-2 shrink-0 capitalize',
                                                    taskStatusBadgeClass[t.status] ?? 'bg-secondary/50 text-secondary-foreground'
                                                )}
                                            >
                                                {formatStatusLabel(t.status)}
                                            </Badge>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* YouTube section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Youtube className="h-5 w-5 text-red-500" />
                            YouTube & content
                        </CardTitle>
                        <CardDescription>
                            Scripts, calendar, and creator tools for your channel.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <Button variant="outline" className="h-auto flex-col gap-2 p-4 items-start text-left" asChild>
                                <Link href={tenantRouter.route('script.calendar')}>
                                    <Calendar className="h-6 w-6" />
                                    <span>Script calendar</span>
                                    <span className="text-muted-foreground text-xs font-normal">Schedule and reschedule shoots</span>
                                </Link>
                            </Button>
                            <Button variant="outline" className="h-auto flex-col gap-2 p-4 items-start text-left" asChild>
                                <Link href={tenantRouter.route('youtuber-dashboard')}>
                                    <Video className="h-6 w-6" />
                                    <span>YouTuber dashboard</span>
                                    <span className="text-muted-foreground text-xs font-normal">Channel stats and tools</span>
                                </Link>
                            </Button>
                            <Button variant="outline" className="h-auto flex-col gap-2 p-4 items-start text-left" asChild>
                                <Link href={tenantRouter.route('hr.tasks.index')}>
                                    <ListTodo className="h-6 w-6" />
                                    <span>HR tasks</span>
                                    <span className="text-muted-foreground text-xs font-normal">Tasks and due dates</span>
                                </Link>
                            </Button>
                            <Button variant="outline" className="h-auto flex-col gap-2 p-4 items-start text-left" asChild>
                                <Link href={tenantRouter.route('dashboard')}>
                                    <LayoutGrid className="h-6 w-6" />
                                    <span>All dashboards</span>
                                    <span className="text-muted-foreground text-xs font-normal">Switch dashboard</span>
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
