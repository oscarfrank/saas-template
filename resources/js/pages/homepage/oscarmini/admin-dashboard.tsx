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
    HelpCircle,
    LayoutGrid,
    MessageSquare,
    Settings,
    Sparkles,
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

const statAccent: Record<number, { bar: string; iconWrap: string; glow: string }> = {
    0: {
        bar: 'from-emerald-500 to-teal-400',
        iconWrap: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
        glow: 'shadow-emerald-500/10',
    },
    1: {
        bar: 'from-violet-500 to-fuchsia-400',
        iconWrap: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
        glow: 'shadow-violet-500/10',
    },
    2: {
        bar: 'from-amber-500 to-orange-400',
        iconWrap: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
        glow: 'shadow-amber-500/10',
    },
    3: {
        bar: 'from-rose-500 to-pink-400',
        iconWrap: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
        glow: 'shadow-rose-500/10',
    },
};

export default function OscarMiniAdminDashboard({ quickStats, recentActivity }: Props) {
    const { user } = useAuth();
    const { getGreeting } = useGreeting();
    const isSuperAdmin = (usePage().props as { auth?: { is_superadmin?: boolean } }).auth?.is_superadmin === true;

    const quickStatsData = [
        { title: 'Staff / users', value: quickStats.total_users.toLocaleString(), icon: Users },
        { title: 'Active loans', value: quickStats.active_loans.toLocaleString(), icon: Banknote },
        { title: 'Pending', value: quickStats.pending_applications.toLocaleString(), icon: LayoutGrid },
        { title: 'Support tickets', value: quickStats.support_tickets.toLocaleString(), icon: MessageSquare },
    ];

    const orgSections = [
        {
            title: 'Staff & people',
            icon: Users,
            description: 'Manage team and roles',
            accent: 'from-emerald-500/90 to-teal-600/80',
            items: [
                { name: 'All Users', href: '/admin/users' },
                { name: 'User Roles', href: '/admin/roles' },
                { name: 'User Activity', href: '/admin/activity' },
                { name: 'User KYC', href: '/admin/kyc' },
                ...(isSuperAdmin ? [{ name: 'Add members to org', href: '/organizations/add-members' }] : []),
            ],
        },
        {
            title: 'Studio & content',
            icon: Video,
            description: 'YouTube studio and content',
            accent: 'from-violet-500/90 to-indigo-600/80',
            items: [
                { name: 'Support Tickets', href: '/admin/tickets' },
                { name: 'Email Templates', href: '/admin/email-templates' },
            ],
        },
        {
            title: 'Loans & finance',
            icon: Banknote,
            description: 'Loans and payroll',
            accent: 'from-amber-500/90 to-orange-600/80',
            items: [
                { name: 'Loan Applications', href: '/admin/loans' },
                { name: 'Loan Packages', href: '/admin/loan-packages' },
                { name: 'Currencies', href: '/admin/currencies' },
            ],
        },
        {
            title: 'System & settings',
            icon: Settings,
            description: 'Organization and app settings',
            accent: 'from-slate-500/90 to-slate-700/80',
            items: [
                { name: 'System Settings', href: '/admin/settings' },
                { name: 'Loan Settings', href: '/admin/settings/loan' },
                { name: 'API Management', href: '/admin/settings/api' },
                ...(isSuperAdmin ? [{ name: 'AI API usage (all tenants)', href: '/admin/ai-usage' }] : []),
                ...(isSuperAdmin
                    ? [
                          { name: 'Export / Import', href: '/admin/export-import' },
                          { name: 'Backups', href: '/admin/backup' },
                      ]
                    : []),
                ...(isSuperAdmin ? [{ name: 'Route catalog', href: '/admin/route-catalog' }] : []),
            ],
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard - Admin (OscarMini)" />

            <div className="relative min-h-full flex-1 overflow-hidden">
                {/* Ambient background */}
                <div
                    className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_90%_50%_at_50%_-10%,hsl(var(--primary)/0.14),transparent_55%)]"
                    aria-hidden
                />
                <div
                    className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,hsl(var(--background)),hsl(var(--muted)/0.35)_40%,hsl(var(--background)))]"
                    aria-hidden
                />
                <div
                    className="pointer-events-none absolute inset-0 -z-10 opacity-[0.22] dark:opacity-[0.12] [background-image:linear-gradient(hsl(var(--border)/0.6)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/0.6)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]"
                    aria-hidden
                />

                <div className="relative mx-auto flex max-w-7xl flex-col gap-10 px-4 py-6 sm:px-6 lg:gap-12 lg:px-8 lg:py-8">
                    {/* Hero */}
                    <header className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="max-w-2xl space-y-4">
                            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-md">
                                <Sparkles className="size-3.5 text-amber-500" aria-hidden />
                                OscarMini · Admin control
                            </div>
                            <div>
                                <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                                    {getGreeting()},{' '}
                                    <span className="text-muted-foreground font-normal">
                                        {user.first_name as string} {user.last_name as string}
                                    </span>
                                </h1>
                                <p className="mt-3 max-w-xl text-pretty text-base text-muted-foreground">
                                    Staff, studio, payroll, assets, loans & projects — everything your organization runs on, in one
                                    place.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
                            <Button variant="outline" size="sm" className="border-border/80 bg-background/80 shadow-sm backdrop-blur-sm">
                                <Bell className="mr-2 size-4" />
                                Notifications
                            </Button>
                            <Button variant="outline" size="sm" className="border-border/80 bg-background/80 shadow-sm backdrop-blur-sm">
                                <HelpCircle className="mr-2 size-4" />
                                Help
                            </Button>
                        </div>
                    </header>

                    {/* KPI strip */}
                    <section aria-label="Key metrics">
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            {quickStatsData.map((stat, index) => {
                                const accent = statAccent[index] ?? statAccent[0];
                                const Icon = stat.icon;
                                return (
                                    <div
                                        key={stat.title}
                                        className={cn(
                                            'group relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-5 shadow-sm backdrop-blur-md transition-all duration-300',
                                            'hover:-translate-y-0.5 hover:border-border hover:bg-card/80 hover:shadow-md',
                                            accent.glow,
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                'absolute left-0 top-0 h-1 w-full bg-gradient-to-r opacity-90',
                                                accent.bar,
                                            )}
                                        />
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{stat.title}</p>
                                                <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-foreground">
                                                    {stat.value}
                                                </p>
                                            </div>
                                            <div
                                                className={cn(
                                                    'flex size-11 items-center justify-center rounded-2xl ring-1 ring-inset ring-black/5 dark:ring-white/10',
                                                    accent.iconWrap,
                                                )}
                                            >
                                                <Icon className="size-5" strokeWidth={1.75} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* Navigation bento */}
                    <section aria-label="Admin sections" className="space-y-4">
                        <div className="flex items-end justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold tracking-tight">Where to go</h2>
                                <p className="text-sm text-muted-foreground">Jump into tools by area — same links as before, clearer layout.</p>
                            </div>
                        </div>
                        <div className="grid gap-5 md:grid-cols-2">
                            {orgSections.map((section) => {
                                const Icon = section.icon;
                                return (
                                    <div
                                        key={section.title}
                                        className="flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/50 shadow-sm backdrop-blur-md transition-shadow hover:shadow-md"
                                    >
                                        <div
                                            className={cn(
                                                'relative px-5 pb-4 pt-5 text-white',
                                                'bg-gradient-to-br',
                                                section.accent,
                                            )}
                                        >
                                            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.12),transparent_45%)]" />
                                            <div className="relative flex items-start gap-3">
                                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-inset ring-white/25">
                                                    <Icon className="size-5 text-white" strokeWidth={1.75} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="text-base font-semibold leading-tight">{section.title}</h3>
                                                    <p className="mt-1 text-sm text-white/85">{section.description}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <ul className="divide-y divide-border/60 bg-background/40 p-2">
                                            {section.items.map((item) => (
                                                <li key={item.href + item.name}>
                                                    <Link
                                                        href={item.href}
                                                        className={cn(
                                                            'group flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground',
                                                            'transition-colors hover:bg-muted/80',
                                                        )}
                                                    >
                                                        <span className="min-w-0 truncate">{item.name}</span>
                                                        <ArrowUpRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* Activity */}
                    <section aria-label="Recent activity">
                        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/50 shadow-sm backdrop-blur-md">
                            <div className="border-b border-border/60 bg-muted/20 px-5 py-4 sm:px-6">
                                <h2 className="text-lg font-semibold tracking-tight">Recent activity</h2>
                                <p className="text-sm text-muted-foreground">Latest activity across the organization</p>
                            </div>
                            <div className="p-2 sm:p-4">
                                {recentActivity.length === 0 ? (
                                    <p className="px-3 py-8 text-center text-sm text-muted-foreground">No recent activity to show.</p>
                                ) : (
                                    <ul className="space-y-1">
                                        {recentActivity.map((activity, index) => (
                                            <li
                                                key={`${activity.title}-${activity.time}-${index}`}
                                                className="rounded-xl px-3 py-3 transition-colors hover:bg-muted/50"
                                            >
                                                <div className="flex gap-3">
                                                    <div className="mt-2 flex shrink-0">
                                                        <span
                                                            className={cn(
                                                                'size-2.5 rounded-full ring-4 ring-background',
                                                                activity.type === 'loan_application'
                                                                    ? 'bg-emerald-500 shadow-[0_0_0_1px] shadow-emerald-500/40'
                                                                    : 'bg-sky-500 shadow-[0_0_0_1px] shadow-sky-500/40',
                                                            )}
                                                        />
                                                    </div>
                                                    <div className="min-w-0 flex-1 space-y-1">
                                                        <p className="text-sm font-medium leading-snug text-foreground">{activity.title}</p>
                                                        {activity.description ? (
                                                            <p className="text-xs leading-relaxed text-muted-foreground">{activity.description}</p>
                                                        ) : null}
                                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                                            <span>{activity.time}</span>
                                                            {activity.user ? (
                                                                <>
                                                                    <span className="text-border">·</span>
                                                                    <span className="font-medium text-foreground/80">{activity.user}</span>
                                                                </>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}
