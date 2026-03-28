import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { useAuth } from '@/hooks/use-auth';
import { useGreeting } from '@/hooks/use-greeting';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
    AlertCircle,
    ArrowUpRight,
    Banknote,
    Bell,
    FileText,
    Globe,
    Handshake,
    HelpCircle,
    Landmark,
    MessageSquare,
    Settings,
    Users,
} from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard - Admin', href: '/admin/dashboard' },
];

interface QuickStats {
    total_users: number;
    active_loans: number;
    pending_applications: number;
    support_tickets: number;
}

interface LoanStats {
    [currency: string]: {
        total_active_loan_balance: { value: number; trend: string };
        total_pending_loan_balance: { value: number; trend: string };
        average_loan_balance: { value: number; trend: string };
        default_rate: { value: string; trend: string };
    };
}

interface RecentActivity {
    type: string;
    title: string;
    description: string;
    time: string;
    user: string;
}

interface Currency {
    id: number;
    code: string;
    symbol: string;
    name: string;
    is_default: boolean;
}

interface Props {
    quickStats: QuickStats;
    loanStats: LoanStats;
    recentActivity: RecentActivity[];
    currencies: Currency[];
}

const kpiStyles = [
    { bar: 'bg-blue-600', icon: 'bg-blue-500/15 text-blue-600 dark:text-blue-400' },
    { bar: 'bg-emerald-600', icon: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
    { bar: 'bg-amber-500', icon: 'bg-amber-500/15 text-amber-700 dark:text-amber-400' },
    { bar: 'bg-rose-600', icon: 'bg-rose-500/15 text-rose-600 dark:text-rose-400' },
];

const sectionAccent = ['border-l-blue-600', 'border-l-emerald-600', 'border-l-violet-600', 'border-l-slate-600'];

export default function LendingAdminDashboard({ quickStats, loanStats, recentActivity, currencies }: Props) {
    const { user } = useAuth();
    const { getGreeting } = useGreeting();
    const isSuperAdmin = (usePage().props as { auth?: { is_superadmin?: boolean } }).auth?.is_superadmin === true;
    const [selectedCurrency, setSelectedCurrency] = useState(
        currencies.find((c) => c.is_default)?.code || currencies[0]?.code
    );

    const quickStatsData = [
        { title: 'Total Users', value: quickStats.total_users.toLocaleString(), icon: Users },
        { title: 'Active Loans', value: quickStats.active_loans.toLocaleString(), icon: Handshake },
        { title: 'Pending Applications', value: quickStats.pending_applications.toLocaleString(), icon: FileText },
        { title: 'Support Tickets', value: quickStats.support_tickets.toLocaleString(), icon: MessageSquare },
    ];

    const adminSections = [
        {
            title: 'User Management',
            icon: Users,
            items: [
                { name: 'All Users', href: '/admin/users' },
                { name: 'User Roles', href: '/admin/roles' },
                { name: 'User Activity', href: '/admin/activity' },
                { name: 'User KYC', href: '/admin/kyc' },
                ...(isSuperAdmin ? [{ name: 'Add members to org', href: '/organizations/add-members' }] : []),
            ],
        },
        {
            title: 'Loan & Investment Management',
            icon: Handshake,
            items: [
                { name: 'Loan Applications', href: '/admin/loans' },
                { name: 'Loan Packages', href: '/admin/loan-packages' },
                { name: 'Investment Applications', href: '/admin/investments' },
                { name: 'Investment Packages', href: '/admin/investment-packages' },
            ],
        },
        {
            title: 'Support & Communication',
            icon: MessageSquare,
            items: [
                { name: 'Support Tickets', href: '/admin/tickets' },
                { name: 'Announcements', href: '/admin/announcements' },
                { name: 'Messages', href: '/admin/messages' },
                { name: 'Email Templates', href: '/admin/email-templates' },
            ],
        },
        {
            title: 'System & Settings',
            icon: Settings,
            items: [
                { name: 'System Settings', href: '/admin/settings' },
                { name: 'Loan Settings', href: '/admin/settings/loan' },
                { name: 'Security', href: '/admin/security' },
                { name: 'API Management', href: '/admin/settings/api' },
                { name: 'Currencies', href: '/admin/currencies' },
                ...(isSuperAdmin ? [{ name: 'AI API usage (all tenants)', href: '/admin/ai-usage' }] : []),
                ...(isSuperAdmin ? [{ name: 'Export / Import', href: '/admin/export-import' }] : []),
                ...(isSuperAdmin ? [{ name: 'Route catalog', href: '/admin/route-catalog' }] : []),
            ],
        },
    ];

    const defaultCode = currencies.find((c) => c.is_default)?.code || currencies[0]?.code;
    const currentLoanStats = loanStats[selectedCurrency] || loanStats[defaultCode];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard - Admin (Lending)" />

            <div className="relative min-h-full">
                <div
                    className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(135deg,hsl(214_32%_97%)_0%,hsl(var(--background))_45%,hsl(221_64%_97%)_100%)] dark:bg-[linear-gradient(135deg,hsl(222_47%_8%)_0%,hsl(var(--background))_50%,hsl(217_33%_12%)_100%)]"
                    aria-hidden
                />

                <div className="mx-auto max-w-7xl space-y-10 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                    <header className="flex flex-col gap-6 border-b border-border/60 pb-8 lg:flex-row lg:items-end lg:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
                                <Landmark className="size-6" strokeWidth={1.75} />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                                    Lending command
                                </p>
                                <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
                                    {getGreeting()},{' '}
                                    <span className="text-muted-foreground font-normal">
                                        {user.first_name as string} {user.last_name as string}
                                    </span>
                                </h1>
                                <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                                    Loans, users, investments, and support — institutional overview.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" className="border-blue-200/80 bg-background/90 dark:border-blue-900/50">
                                <Bell className="mr-2 size-4" />
                                Notifications
                            </Button>
                            <Button variant="outline" size="sm" className="border-blue-200/80 bg-background/90 dark:border-blue-900/50">
                                <HelpCircle className="mr-2 size-4" />
                                Help
                            </Button>
                        </div>
                    </header>

                    <section aria-label="Key metrics">
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            {quickStatsData.map((stat, index) => {
                                const Icon = stat.icon;
                                const s = kpiStyles[index] ?? kpiStyles[0];
                                return (
                                    <div
                                        key={stat.title}
                                        className="relative overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm"
                                    >
                                        <div className={cn('absolute left-0 top-0 h-full w-1', s.bar)} />
                                        <div className="p-5 pl-6">
                                            <div className="flex items-start justify-between gap-3">
                                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{stat.title}</p>
                                                <div className={cn('flex size-9 items-center justify-center rounded-lg', s.icon)}>
                                                    <Icon className="size-4" />
                                                </div>
                                            </div>
                                            <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight">{stat.value}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <section aria-label="Loan statistics" className="rounded-2xl border border-border/80 bg-card/80 shadow-sm backdrop-blur-sm">
                        <div className="flex flex-col gap-4 border-b border-border/60 bg-muted/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                            <div>
                                <h2 className="text-lg font-semibold">Loan statistics</h2>
                                <p className="text-sm text-muted-foreground">Overview of loan performance and metrics</p>
                            </div>
                            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                                <SelectTrigger className="w-full cursor-pointer sm:w-[220px]">
                                    <Globe className="mr-2 size-4 shrink-0 text-blue-600" />
                                    <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                                <SelectContent>
                                    {currencies.map((currency) => (
                                        <SelectItem key={currency.code} value={currency.code}>
                                            {currency.name} ({currency.symbol})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="p-5 sm:p-6">
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                                {currentLoanStats &&
                                    Object.entries(currentLoanStats).map(([key, stat], index) => {
                                        const formattedValue =
                                            key === 'default_rate'
                                                ? stat.value
                                                : new Intl.NumberFormat('en-US', {
                                                      style: 'currency',
                                                      currency: selectedCurrency,
                                                      minimumFractionDigits: 2,
                                                      maximumFractionDigits: 2,
                                                  }).format(Number((stat as { value: number }).value));
                                        return (
                                            <div
                                                key={key}
                                                className="rounded-xl border border-border/60 bg-background/50 p-4"
                                            >
                                                <div className="flex items-center gap-2">
                                                    {key === 'default_rate' ? (
                                                        <AlertCircle
                                                            className={cn(
                                                                'size-4',
                                                                stat.trend.includes('+') ? 'text-emerald-600' : 'text-red-500',
                                                            )}
                                                        />
                                                    ) : (
                                                        <Banknote
                                                            className={cn(
                                                                'size-4',
                                                                stat.trend.includes('+') ? 'text-emerald-600' : 'text-red-500',
                                                            )}
                                                        />
                                                    )}
                                                    <p className="text-xs font-medium text-muted-foreground">
                                                        {key
                                                            .split('_')
                                                            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                                            .join(' ')}
                                                    </p>
                                                </div>
                                                <p className="mt-2 text-2xl font-semibold tabular-nums">{formattedValue}</p>
                                                <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">{stat.trend}</p>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    </section>

                    <section aria-label="Admin navigation" className="grid gap-5 md:grid-cols-2">
                        {adminSections.map((section, index) => {
                            const Icon = section.icon;
                            return (
                                <div
                                    key={section.title}
                                    className={cn(
                                        'overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm',
                                        'border-l-4',
                                        sectionAccent[index] ?? 'border-l-slate-600',
                                    )}
                                >
                                    <div className="border-b border-border/50 bg-muted/20 px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <Icon className="size-5 text-blue-700 dark:text-blue-400" />
                                            <h3 className="font-semibold">{section.title}</h3>
                                        </div>
                                    </div>
                                    <ul className="divide-y divide-border/50 p-2">
                                        {section.items.map((item) => (
                                            <li key={item.href + item.name}>
                                                <Link
                                                    href={item.href}
                                                    className="group flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted/80"
                                                >
                                                    <span>{item.name}</span>
                                                    <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </section>

                    <section aria-label="Recent activity" className="rounded-2xl border border-border/80 bg-card shadow-sm">
                        <div className="border-b border-border/60 bg-muted/20 px-5 py-4 sm:px-6">
                            <h2 className="text-lg font-semibold">Recent activity</h2>
                        </div>
                        <div className="p-4 sm:p-5">
                            {recentActivity.length === 0 ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">No recent activity.</p>
                            ) : (
                                <ul className="space-y-1">
                                    {recentActivity.map((activity, index) => (
                                        <li key={`${activity.title}-${index}`} className="rounded-lg px-3 py-2.5 hover:bg-muted/40">
                                            <div className="flex gap-3">
                                                <span
                                                    className={cn(
                                                        'mt-1.5 size-2 shrink-0 rounded-full',
                                                        activity.type === 'loan_application' ? 'bg-emerald-500' : 'bg-blue-500',
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
