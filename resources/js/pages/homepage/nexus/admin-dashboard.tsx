import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { useAuth } from '@/hooks/use-auth';
import { useGreeting } from '@/hooks/use-greeting';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    ArrowUpRight,
    Banknote,
    Bell,
    FolderKanban,
    HelpCircle,
    MessageSquare,
    Network,
    Settings,
    Users,
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

export default function NexusAdminDashboard({ quickStats, recentActivity }: Props) {
    const { user } = useAuth();
    const { getGreeting } = useGreeting();
    const isSuperAdmin = (usePage().props as { auth?: { is_superadmin?: boolean } }).auth?.is_superadmin === true;

    const quickStatsData = [
        { title: 'Team members', value: quickStats.total_users.toLocaleString(), icon: Users },
        { title: 'Active', value: quickStats.active_loans.toLocaleString(), icon: FolderKanban },
        { title: 'Pending', value: quickStats.pending_applications.toLocaleString(), icon: Banknote },
        { title: 'Support tickets', value: quickStats.support_tickets.toLocaleString(), icon: MessageSquare },
    ];

    const nexusSections = [
        {
            title: 'Teams & people',
            icon: Users,
            description: 'Manage team and access',
            items: [
                { name: 'All Users', href: '/admin/users' },
                { name: 'User Roles', href: '/admin/roles' },
                { name: 'User Activity', href: '/admin/activity' },
                { name: 'User KYC', href: '/admin/kyc' },
                ...(isSuperAdmin ? [{ name: 'Add members to org', href: '/organizations/add-members' }] : []),
            ],
        },
        {
            title: 'Operations & finance',
            icon: FolderKanban,
            description: 'Projects, loans, and workflows',
            items: [
                { name: 'Loan Applications', href: '/admin/loans' },
                { name: 'Loan Packages', href: '/admin/loan-packages' },
                { name: 'Currencies', href: '/admin/currencies' },
            ],
        },
        {
            title: 'Support & comms',
            icon: MessageSquare,
            description: 'Tickets and templates',
            items: [
                { name: 'Support Tickets', href: '/admin/tickets' },
                { name: 'Email Templates', href: '/admin/email-templates' },
            ],
        },
        {
            title: 'System & settings',
            icon: Settings,
            description: 'Platform and security',
            items: [
                { name: 'System Settings', href: '/admin/settings' },
                { name: 'Loan Settings', href: '/admin/settings/loan' },
                { name: 'API Management', href: '/admin/settings/api' },
                ...(isSuperAdmin ? [{ name: 'AI API usage (all tenants)', href: '/admin/ai-usage' }] : []),
                ...(isSuperAdmin ? [{ name: 'Export / Import', href: '/admin/export-import' }] : []),
                ...(isSuperAdmin ? [{ name: 'Route catalog', href: '/admin/route-catalog' }] : []),
            ],
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard - Admin (Nexus)" />

            <div className="relative min-h-full">
                {/* Subtle ops grid */}
                <div
                    className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:24px_24px] opacity-[0.35] dark:opacity-25"
                    aria-hidden
                />
                <div
                    className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_0%_0%,rgba(79,70,229,0.12),transparent_55%)]"
                    aria-hidden
                />

                <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                    <div className="flex flex-col gap-4 border-b border-border/80 pb-6 sm:flex-row sm:items-end sm:justify-between">
                        <div className="flex items-start gap-3">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                <Network className="size-6" strokeWidth={1.5} />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                                    Nexus · Operations
                                </p>
                                <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                                    {getGreeting()}, {user.first_name as string} {user.last_name as string}
                                </h1>
                                <p className="mt-1 text-sm text-muted-foreground">Teams, workflows, finance & support.</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" className="border-indigo-200/80 dark:border-indigo-900/60">
                                <Bell className="mr-2 size-4" />
                                Notifications
                            </Button>
                            <Button variant="outline" size="sm" className="border-indigo-200/80 dark:border-indigo-900/60">
                                <HelpCircle className="mr-2 size-4" />
                                Help
                            </Button>
                        </div>
                    </div>

                    <section aria-label="Key metrics" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        {quickStatsData.map((stat) => {
                            const Icon = stat.icon;
                            return (
                                <div
                                    key={stat.title}
                                    className="relative overflow-hidden rounded-xl border border-indigo-200/40 bg-card p-4 shadow-sm dark:border-indigo-900/40"
                                >
                                    <div className="absolute left-0 top-0 h-full w-1 bg-indigo-500/80" aria-hidden />
                                    <div className="pl-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                {stat.title}
                                            </span>
                                            <Icon className="size-4 text-indigo-600 dark:text-indigo-400" strokeWidth={2} />
                                        </div>
                                        <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight sm:text-3xl">{stat.value}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </section>

                    <section aria-label="Nexus sections" className="grid gap-4 sm:grid-cols-2">
                        {nexusSections.map((section) => {
                            const Icon = section.icon;
                            return (
                                <div
                                    key={section.title}
                                    className="flex flex-col rounded-xl border border-indigo-200/35 bg-card/95 shadow-sm dark:border-indigo-900/40"
                                >
                                    <div className="flex items-center gap-3 border-b border-indigo-200/30 px-4 py-3 dark:border-indigo-900/35">
                                        <span className="flex size-9 items-center justify-center rounded-md bg-indigo-600 text-white shadow-sm">
                                            <Icon className="size-4" strokeWidth={2} />
                                        </span>
                                        <div>
                                            <h2 className="text-sm font-bold leading-tight">{section.title}</h2>
                                            <p className="text-xs text-muted-foreground">{section.description}</p>
                                        </div>
                                    </div>
                                    <ul className="grid flex-1 grid-cols-1 gap-0 sm:grid-cols-2">
                                        {section.items.map((item) => (
                                            <li key={item.href + item.name} className="border-b border-indigo-200/20 last:border-b-0 sm:border-b-0 sm:odd:border-r sm:odd:border-indigo-200/20 dark:border-indigo-900/25 dark:sm:odd:border-indigo-900/25">
                                                <Link
                                                    href={item.href}
                                                    className="group flex h-full min-h-[44px] items-center justify-between gap-2 px-4 py-3 text-sm font-medium transition hover:bg-indigo-500/[0.06]"
                                                >
                                                    <span className="line-clamp-2">{item.name}</span>
                                                    <ArrowUpRight className="size-4 shrink-0 text-indigo-500/60 opacity-0 transition group-hover:opacity-100" />
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </section>

                    <section aria-label="Recent activity" className="overflow-hidden rounded-xl border border-indigo-200/35 bg-card dark:border-indigo-900/40">
                        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-indigo-200/30 px-4 py-3 dark:border-indigo-900/35 sm:px-5">
                            <div>
                                <h2 className="text-sm font-bold">Recent activity</h2>
                                <p className="text-xs text-muted-foreground">Latest activity across operations and teams</p>
                            </div>
                        </div>
                        <div className="p-4 sm:p-5">
                            {recentActivity.length === 0 ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">No recent activity.</p>
                            ) : (
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {recentActivity.map((activity, index) => (
                                        <div
                                            key={`${activity.title}-${index}`}
                                            className="flex gap-3 rounded-lg border border-transparent bg-indigo-500/[0.03] px-3 py-2.5 hover:border-indigo-200/50 dark:hover:border-indigo-900/50"
                                        >
                                            <span
                                                className={cn(
                                                    'mt-1.5 size-1.5 shrink-0 rounded-sm',
                                                    activity.type === 'loan_application' ? 'bg-indigo-500' : 'bg-slate-400',
                                                )}
                                            />
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium leading-snug">{activity.title}</p>
                                                {activity.description ? (
                                                    <p className="text-xs text-muted-foreground">{activity.description}</p>
                                                ) : null}
                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                    {activity.time}
                                                    {activity.user ? ` · ${activity.user}` : ''}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}
