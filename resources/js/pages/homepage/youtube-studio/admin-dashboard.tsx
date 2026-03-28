import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { useAuth } from '@/hooks/use-auth';
import { useGreeting } from '@/hooks/use-greeting';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    ArrowUpRight,
    Bell,
    CheckSquare,
    Clapperboard,
    HelpCircle,
    MessageSquare,
    Settings,
    Users,
    Video,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard - Admin', href: '/admin/dashboard' },
];

interface QuickStats {
    total_users: number;
    active_loans: number;
    pending_applications: number;
    support_tickets: number;
}

interface RecentActivity {
    type: string;
    title: string;
    description: string;
    time: string;
    user: string;
}

interface Props {
    quickStats: QuickStats;
    recentActivity: RecentActivity[];
}

export default function YouTubeStudioAdminDashboard({ quickStats, recentActivity }: Props) {
    const { user } = useAuth();
    const { getGreeting } = useGreeting();
    const isSuperAdmin = (usePage().props as { auth?: { is_superadmin?: boolean } }).auth?.is_superadmin === true;

    const quickStatsData = [
        { title: 'Team members', value: quickStats.total_users.toLocaleString(), icon: Users },
        { title: 'Support tickets', value: quickStats.support_tickets.toLocaleString(), icon: MessageSquare },
        { title: 'Active loans', value: quickStats.active_loans.toLocaleString(), icon: Video },
        { title: 'Pending', value: quickStats.pending_applications.toLocaleString(), icon: CheckSquare },
    ];

    const studioSections = [
        {
            title: 'Team & people',
            icon: Users,
            description: 'Manage your crew and roles',
            accent: 'from-rose-600 via-red-600 to-orange-600',
            items: [
                { name: 'All Users', href: '/admin/users' },
                { name: 'User Roles', href: '/admin/roles' },
                { name: 'User Activity', href: '/admin/activity' },
                ...(isSuperAdmin ? [{ name: 'Add members to org', href: '/organizations/add-members' }] : []),
            ],
        },
        {
            title: 'Studio & content',
            icon: Video,
            description: 'Shoots, scripts, and tasks',
            accent: 'from-fuchsia-600 via-purple-600 to-indigo-700',
            items: [
                { name: 'Loans (if used)', href: '/admin/loans' },
                { name: 'Support Tickets', href: '/admin/tickets' },
                { name: 'Email Templates', href: '/admin/email-templates' },
            ],
        },
        {
            title: 'Settings',
            icon: Settings,
            description: 'System and preferences',
            accent: 'from-slate-700 via-slate-800 to-zinc-900',
            items: [
                { name: 'System Settings', href: '/admin/settings' },
                { name: 'API Management', href: '/admin/settings/api' },
                ...(isSuperAdmin ? [{ name: 'AI API usage (all tenants)', href: '/admin/ai-usage' }] : []),
                ...(isSuperAdmin ? [{ name: 'Export / Import', href: '/admin/export-import' }] : []),
                ...(isSuperAdmin ? [{ name: 'Route catalog', href: '/admin/route-catalog' }] : []),
            ],
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard - Admin (YouTube Studio)" />

            <div className="relative min-h-full overflow-hidden">
                {/* Spotlight + dark floor */}
                <div
                    className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(225,29,72,0.18),transparent_55%),radial-gradient(ellipse_60%_40%_at_100%_0%,rgba(168,85,247,0.12),transparent_50%)]"
                    aria-hidden
                />
                <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,hsl(var(--background)),hsl(var(--background)))] opacity-95 dark:opacity-100" aria-hidden />

                <div className="mx-auto max-w-7xl space-y-10 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                    <header className="relative overflow-hidden rounded-3xl border border-rose-500/20 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-6 text-white shadow-2xl shadow-black/40 sm:p-8">
                        <div className="absolute -right-16 -top-16 size-64 rounded-full bg-rose-500/20 blur-3xl" aria-hidden />
                        <div className="absolute bottom-0 left-1/4 size-40 rounded-full bg-purple-600/15 blur-2xl" aria-hidden />
                        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                            <div className="space-y-3">
                                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-rose-200 backdrop-blur">
                                    <Clapperboard className="size-3.5" />
                                    YouTube Studio · Admin
                                </div>
                                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                    {getGreeting()},{' '}
                                    <span className="font-normal text-rose-100/90">
                                        {user.first_name as string} {user.last_name as string}
                                    </span>
                                </h1>
                                <p className="max-w-lg text-sm text-zinc-400">Team, content pipeline, and support — production control room.</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="border-0 bg-white/10 text-white hover:bg-white/20"
                                >
                                    <Bell className="mr-2 size-4" />
                                    Notifications
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="border-0 bg-white/10 text-white hover:bg-white/20"
                                >
                                    <HelpCircle className="mr-2 size-4" />
                                    Help
                                </Button>
                            </div>
                        </div>
                    </header>

                    <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {quickStatsData.map((stat) => {
                            const Icon = stat.icon;
                            return (
                                <div
                                    key={stat.title}
                                    className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/90 p-5 shadow-lg shadow-black/5 transition hover:border-rose-500/30 hover:shadow-xl"
                                >
                                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-500/50 to-transparent opacity-0 transition group-hover:opacity-100" />
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{stat.title}</span>
                                        <div className="flex size-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                                            <Icon className="size-5" strokeWidth={1.75} />
                                        </div>
                                    </div>
                                    <p className="mt-3 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-3xl font-bold tabular-nums text-transparent">
                                        {stat.value}
                                    </p>
                                </div>
                            );
                        })}
                    </section>

                    <section aria-label="Studio sections" className="grid gap-6 lg:grid-cols-3">
                        {studioSections.map((section) => {
                            const Icon = section.icon;
                            return (
                                <div
                                    key={section.title}
                                    className="flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-md"
                                >
                                    <div className={cn('relative bg-gradient-to-br px-5 py-6 text-white', section.accent)}>
                                        <div className="absolute inset-0 bg-black/10" />
                                        <div className="relative">
                                            <Icon className="size-8 opacity-90" strokeWidth={1.5} />
                                            <h2 className="mt-4 text-lg font-bold">{section.title}</h2>
                                            <p className="mt-1 text-sm text-white/85">{section.description}</p>
                                        </div>
                                    </div>
                                    <ul className="flex flex-1 flex-col divide-y divide-border/60 bg-muted/10 p-2">
                                        {section.items.map((item) => (
                                            <li key={item.href + item.name}>
                                                <Link
                                                    href={item.href}
                                                    className="group flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-background"
                                                >
                                                    {item.name}
                                                    <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </section>

                    <section aria-label="Recent activity" className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm">
                        <div className="border-b border-border/60 px-5 py-4 sm:px-6">
                            <h2 className="text-lg font-semibold">Recent activity</h2>
                            <p className="text-sm text-muted-foreground">Latest registrations and activity</p>
                        </div>
                        <div className="p-4 sm:p-5">
                            {recentActivity.length === 0 ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">No recent activity.</p>
                            ) : (
                                <ul className="space-y-2">
                                    {recentActivity.map((activity, index) => (
                                        <li
                                            key={`${activity.title}-${index}`}
                                            className="flex gap-3 rounded-xl border border-transparent px-3 py-2 hover:border-rose-500/20 hover:bg-rose-500/[0.03]"
                                        >
                                            <span
                                                className={cn(
                                                    'mt-2 size-2 shrink-0 rounded-full ring-2 ring-background',
                                                    activity.type === 'loan_application' ? 'bg-emerald-500' : 'bg-sky-500',
                                                )}
                                            />
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium">{activity.title}</p>
                                                {activity.description ? (
                                                    <p className="text-xs text-muted-foreground">{activity.description}</p>
                                                ) : null}
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {activity.time}
                                                    {activity.user ? ` · ${activity.user}` : ''}
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}
