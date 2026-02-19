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
                                                <Link
                                                    href={tenantRouter.route('script.edit', { script: s.uuid })}
                                                    className="font-medium hover:underline truncate block"
                                                >
                                                    {s.title}
                                                </Link>
                                                <p className="text-muted-foreground text-sm flex items-center gap-1 mt-0.5">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    {formatDate(s.scheduled_at)}
                                                </p>
                                            </div>
                                            <Badge variant="secondary" className="ml-2 shrink-0">
                                                {s.production_status || s.status}
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
                                            <Badge variant={t.status === 'in_progress' ? 'default' : 'secondary'} className="ml-2 shrink-0">
                                                {t.status.replace('_', ' ')}
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
