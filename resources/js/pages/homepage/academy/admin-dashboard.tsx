import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { useAuth } from '@/hooks/use-auth';
import { useGreeting } from '@/hooks/use-greeting';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    ArrowUpRight,
    Award,
    Bell,
    BookOpen,
    GraduationCap,
    HelpCircle,
    MessageSquare,
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

export default function AcademyAdminDashboard({ quickStats, recentActivity }: Props) {
    const { user } = useAuth();
    const { getGreeting } = useGreeting();
    const isSuperAdmin = (usePage().props as { auth?: { is_superadmin?: boolean } }).auth?.is_superadmin === true;

    const quickStatsData = [
        { title: 'Learners', value: quickStats.total_users.toLocaleString(), icon: Users },
        { title: 'Active enrollments', value: quickStats.active_loans.toLocaleString(), icon: BookOpen },
        { title: 'Pending', value: quickStats.pending_applications.toLocaleString(), icon: Award },
        { title: 'Support tickets', value: quickStats.support_tickets.toLocaleString(), icon: MessageSquare },
    ];

    const academySections = [
        {
            title: 'Learners & access',
            icon: Users,
            description: 'Manage learners and roles',
            ring: 'ring-teal-500/25',
            items: [
                { name: 'All Users', href: '/admin/users' },
                { name: 'User Roles', href: '/admin/roles' },
                { name: 'User Activity', href: '/admin/activity' },
                { name: 'User KYC', href: '/admin/kyc' },
                ...(isSuperAdmin ? [{ name: 'Add members to org', href: '/organizations/add-members' }] : []),
            ],
        },
        {
            title: 'Courses & content',
            icon: BookOpen,
            description: 'Courses, packages, and curricula',
            ring: 'ring-emerald-500/25',
            items: [
                { name: 'Loan Packages', href: '/admin/loan-packages' },
                { name: 'Currencies', href: '/admin/currencies' },
            ],
        },
        {
            title: 'Enrollments & support',
            icon: Award,
            description: 'Enrollments and learner support',
            ring: 'ring-amber-500/25',
            items: [
                { name: 'Loan Applications', href: '/admin/loans' },
                { name: 'Support Tickets', href: '/admin/tickets' },
            ],
        },
        {
            title: 'Settings',
            icon: Settings,
            description: 'Academy and platform settings',
            ring: 'ring-slate-400/30',
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
            <Head title="Dashboard - Admin (Academy)" />

            <div className="relative min-h-full">
                <div
                    className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,hsl(168_42%_96%)_0%,hsl(var(--background))_35%,hsl(45_40%_98%)_100%)] dark:bg-[linear-gradient(180deg,hsl(168_25%_12%)_0%,hsl(var(--background))_40%,hsl(30_20%_10%)_100%)]"
                    aria-hidden
                />

                <div className="mx-auto max-w-7xl space-y-10 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
                    <header className="mx-auto max-w-3xl text-center">
                        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-3xl bg-teal-600 text-white shadow-lg shadow-teal-600/30">
                            <GraduationCap className="size-9" strokeWidth={1.5} />
                        </div>
                        <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-700 dark:text-teal-400">Academy admin</p>
                        <h1 className="mt-3 text-balance font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                            {getGreeting()}, {user.first_name as string}{' '}
                            <span className="text-muted-foreground">{user.last_name as string}</span>
                        </h1>
                        <p className="mt-3 flex items-center justify-center gap-2 text-muted-foreground">
                            <BookOpen className="size-4 text-teal-600" />
                            Learners, courses & support
                        </p>
                        <div className="mt-6 flex justify-center gap-2">
                            <Button variant="outline" size="sm" className="rounded-full border-teal-200 bg-background/80 dark:border-teal-900">
                                <Bell className="mr-2 size-4" />
                                Notifications
                            </Button>
                            <Button variant="outline" size="sm" className="rounded-full border-teal-200 bg-background/80 dark:border-teal-900">
                                <HelpCircle className="mr-2 size-4" />
                                Help
                            </Button>
                        </div>
                    </header>

                    <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {quickStatsData.map((stat) => {
                            const Icon = stat.icon;
                            return (
                                <div
                                    key={stat.title}
                                    className="rounded-3xl border border-teal-200/60 bg-card/90 p-6 shadow-sm ring-2 ring-teal-500/5 dark:border-teal-900/40"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-muted-foreground">{stat.title}</span>
                                        <div className="rounded-2xl bg-teal-500/10 p-2 text-teal-700 dark:text-teal-400">
                                            <Icon className="size-5" />
                                        </div>
                                    </div>
                                    <p className="mt-4 font-serif text-4xl font-semibold tabular-nums text-teal-900 dark:text-teal-100">
                                        {stat.value}
                                    </p>
                                </div>
                            );
                        })}
                    </section>

                    <section aria-label="Academy sections" className="grid gap-6 md:grid-cols-2">
                        {academySections.map((section) => {
                            const Icon = section.icon;
                            return (
                                <div
                                    key={section.title}
                                    className={cn(
                                        'rounded-3xl border bg-card/95 p-1 shadow-md',
                                        'ring-2',
                                        section.ring,
                                    )}
                                >
                                    <div className="rounded-[1.35rem] bg-gradient-to-br from-teal-50/80 to-transparent p-5 dark:from-teal-950/30">
                                        <div className="flex items-start gap-3">
                                            <div className="rounded-2xl bg-teal-600 p-2.5 text-white shadow">
                                                <Icon className="size-5" />
                                            </div>
                                            <div>
                                                <h2 className="font-serif text-xl font-semibold">{section.title}</h2>
                                                <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
                                            </div>
                                        </div>
                                        <ul className="mt-5 space-y-1">
                                            {section.items.map((item) => (
                                                <li key={item.href + item.name}>
                                                    <Link
                                                        href={item.href}
                                                        className="group flex items-center justify-between rounded-2xl px-3 py-2 text-sm font-medium transition hover:bg-teal-600/10"
                                                    >
                                                        {item.name}
                                                        <ArrowUpRight className="size-4 text-teal-600/60 opacity-0 transition group-hover:opacity-100" />
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            );
                        })}
                    </section>

                    <section aria-label="Recent activity" className="overflow-hidden rounded-3xl border border-teal-200/50 bg-card shadow-sm dark:border-teal-900/40">
                        <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4 text-white">
                            <h2 className="font-serif text-lg font-semibold">Recent activity</h2>
                            <p className="text-sm text-teal-100">Latest activity across learners and courses</p>
                        </div>
                        <div className="p-5 sm:p-6">
                            {recentActivity.length === 0 ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">No recent activity.</p>
                            ) : (
                                <ul className="space-y-3">
                                    {recentActivity.map((activity, index) => (
                                        <li
                                            key={`${activity.title}-${index}`}
                                            className="flex gap-3 rounded-2xl border border-transparent bg-teal-50/30 px-4 py-3 dark:bg-teal-950/20"
                                        >
                                            <span
                                                className={cn(
                                                    'mt-1.5 size-2 shrink-0 rounded-full',
                                                    activity.type === 'loan_application' ? 'bg-teal-500' : 'bg-slate-400',
                                                )}
                                            />
                                            <div>
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
