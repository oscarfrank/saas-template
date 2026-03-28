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
    CreditCard,
    HelpCircle,
    KeyRound,
    Layers,
    MessageSquare,
    Settings,
    Sparkles,
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

export default function VaultAdminDashboard({ quickStats, recentActivity }: Props) {
    const { user } = useAuth();
    const { getGreeting } = useGreeting();
    const isSuperAdmin = (usePage().props as { auth?: { is_superadmin?: boolean } }).auth?.is_superadmin === true;

    const quickStatsData = [
        { title: 'Members', value: quickStats.total_users.toLocaleString(), icon: Users },
        { title: 'Active subscriptions', value: quickStats.active_loans.toLocaleString(), icon: Layers },
        { title: 'Pending', value: quickStats.pending_applications.toLocaleString(), icon: CreditCard },
        { title: 'Support tickets', value: quickStats.support_tickets.toLocaleString(), icon: MessageSquare },
    ];

    const vaultSections = [
        {
            title: 'Members',
            icon: Users,
            description: 'Manage members and access',
            items: [
                { name: 'All Users', href: '/admin/users' },
                { name: 'User Roles', href: '/admin/roles' },
                { name: 'User Activity', href: '/admin/activity' },
                { name: 'User KYC', href: '/admin/kyc' },
                ...(isSuperAdmin ? [{ name: 'Add members to org', href: '/organizations/add-members' }] : []),
            ],
        },
        {
            title: 'Subscriptions & tiers',
            icon: Layers,
            description: 'Plans, pricing, and tiers',
            items: [
                { name: 'Loan Packages', href: '/admin/loan-packages' },
                { name: 'Currencies', href: '/admin/currencies' },
            ],
        },
        {
            title: 'Billing & support',
            icon: CreditCard,
            description: 'Payments and member support',
            items: [
                { name: 'Loan Applications', href: '/admin/loans' },
                { name: 'Support Tickets', href: '/admin/tickets' },
            ],
        },
        {
            title: 'Settings',
            icon: Settings,
            description: 'Vault and platform settings',
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
            <Head title="Dashboard - Admin (Vault)" />

            <div className="relative min-h-full overflow-hidden">
                <div
                    className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_120%_80%_at_50%_-30%,rgba(245,158,11,0.14),transparent_50%)]"
                    aria-hidden
                />
                <div
                    className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(165deg,hsl(var(--background))_0%,hsl(38_40%_97%)_45%,hsl(var(--background))_100%)] dark:bg-[linear-gradient(165deg,hsl(var(--background))_0%,hsl(30_25%_8%)_50%,hsl(var(--background))_100%)]"
                    aria-hidden
                />

                <div className="mx-auto max-w-7xl space-y-10 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                    <header className="relative overflow-hidden rounded-2xl border border-amber-200/60 bg-gradient-to-b from-amber-50/90 to-card shadow-xl shadow-amber-900/5 dark:border-amber-900/40 dark:from-amber-950/40 dark:to-card">
                        <div className="absolute right-0 top-0 h-40 w-40 translate-x-1/4 -translate-y-1/4 rounded-full bg-amber-400/20 blur-3xl dark:bg-amber-500/10" aria-hidden />
                        <div className="relative flex flex-col gap-6 border-b border-amber-200/50 px-6 py-7 dark:border-amber-900/30 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                            <div className="flex items-start gap-4">
                                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-amber-300/60 bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-600/25">
                                    <KeyRound className="size-7" strokeWidth={1.5} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-amber-800/80 dark:text-amber-400/90">
                                        <Sparkles className="size-3.5" />
                                        Vault
                                    </div>
                                    <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                                        {getGreeting()}, {user.first_name as string} {user.last_name as string}
                                    </h1>
                                    <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
                                        Members, tiers, billing & support — your premium workspace.
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 sm:justify-end">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-amber-300/80 bg-background/80 dark:border-amber-800"
                                >
                                    <Bell className="mr-2 size-4" />
                                    Notifications
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-amber-300/80 bg-background/80 dark:border-amber-800"
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
                                    className="relative overflow-hidden rounded-2xl border border-amber-200/50 bg-card p-5 shadow-md dark:border-amber-900/35"
                                >
                                    <div className="absolute -right-6 -top-6 size-24 rounded-full bg-amber-400/10 blur-2xl dark:bg-amber-500/5" aria-hidden />
                                    <div className="relative flex items-center justify-between gap-3">
                                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{stat.title}</span>
                                        <div className="rounded-xl border border-amber-200/60 bg-amber-500/10 p-2 text-amber-700 dark:border-amber-800 dark:text-amber-400">
                                            <Icon className="size-5" strokeWidth={1.75} />
                                        </div>
                                    </div>
                                    <p className="relative mt-4 text-3xl font-semibold tabular-nums tracking-tight text-amber-950 dark:text-amber-50">
                                        {stat.value}
                                    </p>
                                </div>
                            );
                        })}
                    </section>

                    <section aria-label="Vault sections" className="grid gap-5 md:grid-cols-2">
                        {vaultSections.map((section) => {
                            const Icon = section.icon;
                            return (
                                <div
                                    key={section.title}
                                    className="group rounded-2xl border border-amber-200/40 bg-card/95 shadow-sm ring-1 ring-amber-500/5 transition hover:ring-amber-500/20 dark:border-amber-900/35"
                                >
                                    <div className="flex items-start gap-3 border-b border-amber-200/40 px-5 py-4 dark:border-amber-900/30">
                                        <span className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400">
                                            <Icon className="size-5" strokeWidth={1.75} />
                                        </span>
                                        <div>
                                            <h2 className="font-semibold leading-tight">{section.title}</h2>
                                            <p className="mt-0.5 text-sm text-muted-foreground">{section.description}</p>
                                        </div>
                                    </div>
                                    <ul className="divide-y divide-amber-200/30 dark:divide-amber-900/25">
                                        {section.items.map((item) => (
                                            <li key={item.href + item.name}>
                                                <Link
                                                    href={item.href}
                                                    className="flex items-center justify-between gap-2 px-5 py-3 text-sm font-medium transition hover:bg-amber-500/[0.06]"
                                                >
                                                    {item.name}
                                                    <ArrowUpRight className="size-4 text-amber-600/50 opacity-0 transition group-hover:opacity-100 dark:text-amber-400/50" />
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </section>

                    <section aria-label="Recent activity" className="rounded-2xl border border-amber-200/45 bg-card shadow-sm dark:border-amber-900/35">
                        <div className="border-b border-amber-200/40 px-5 py-4 dark:border-amber-900/30 sm:px-6">
                            <h2 className="text-lg font-semibold">Recent activity</h2>
                            <p className="text-sm text-muted-foreground">Latest activity across members and subscriptions</p>
                        </div>
                        <div className="p-4 sm:p-6">
                            {recentActivity.length === 0 ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">No recent activity.</p>
                            ) : (
                                <ul className="space-y-3">
                                    {recentActivity.map((activity, index) => (
                                        <li
                                            key={`${activity.title}-${index}`}
                                            className="flex gap-3 rounded-xl border border-transparent px-3 py-2.5 transition hover:border-amber-200/60 hover:bg-amber-500/[0.04] dark:hover:border-amber-900/40"
                                        >
                                            <span
                                                className={cn(
                                                    'mt-2 size-2 shrink-0 rounded-full ring-2 ring-background',
                                                    activity.type === 'loan_application' ? 'bg-amber-500' : 'bg-slate-400',
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
