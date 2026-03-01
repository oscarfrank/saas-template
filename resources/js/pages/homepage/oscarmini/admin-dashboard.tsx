import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { useAuth } from '@/hooks/use-auth';
import { useGreeting } from '@/hooks/use-greeting';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Users,
    Video,
    Banknote,
    MessageSquare,
    Settings,
    LayoutGrid,
    Bell,
    HelpCircle,
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

export default function OscarMiniAdminDashboard({ quickStats, recentActivity }: Props) {
    const { user } = useAuth();
    const { getGreeting } = useGreeting();
    const isSuperAdmin = (usePage().props as { auth?: { is_superadmin?: boolean } }).auth?.is_superadmin === true;

    const quickStatsData = [
        { title: 'Staff / users', value: quickStats.total_users.toLocaleString(), icon: Users, color: 'text-emerald-500' },
        { title: 'Active loans', value: quickStats.active_loans.toLocaleString(), icon: Banknote, color: 'text-violet-500' },
        { title: 'Pending', value: quickStats.pending_applications.toLocaleString(), icon: LayoutGrid, color: 'text-amber-500' },
        { title: 'Support tickets', value: quickStats.support_tickets.toLocaleString(), icon: MessageSquare, color: 'text-rose-500' },
    ];

    const orgSections = [
        {
            title: 'Staff & people',
            icon: Users,
            description: 'Manage team and roles',
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
            items: [
                { name: 'Support Tickets', href: '/admin/tickets' },
                { name: 'Email Templates', href: '/admin/email-templates' },
            ],
        },
        {
            title: 'Loans & finance',
            icon: Banknote,
            description: 'Loans and payroll',
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
            items: [
                { name: 'System Settings', href: '/admin/settings' },
                { name: 'Loan Settings', href: '/admin/settings/loan' },
                { name: 'API Management', href: '/admin/settings/api' },
                ...(isSuperAdmin ? [{ name: 'Export / Import', href: '/admin/export-import' }] : []),
            ],
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard - Admin (OscarMini)" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-semibold">{getGreeting()}, {(user.first_name as string)} {(user.last_name as string)}</h3>
                        <p className="text-muted-foreground">OscarMini admin – staff, studio, payroll, assets, loans & projects</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                            <Bell className="mr-2 h-4 w-4" />
                            Notifications
                        </Button>
                        <Button variant="outline" size="sm">
                            <HelpCircle className="mr-2 h-4 w-4" />
                            Help
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {quickStatsData.map((stat, index) => (
                        <Card key={index} className="cursor-pointer">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {orgSections.map((section, index) => (
                        <Card key={index}>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <section.icon className="h-5 w-5" />
                                    <CardTitle>{section.title}</CardTitle>
                                </div>
                                <CardDescription>{section.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-2">
                                    {section.items.map((item, itemIndex) => (
                                        <Button
                                            key={itemIndex}
                                            variant="ghost"
                                            className="w-full justify-start cursor-pointer"
                                            onClick={() => (window.location.href = item.href)}
                                        >
                                            {item.name}
                                        </Button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent activity</CardTitle>
                        <CardDescription>Latest activity across the organization</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentActivity.map((activity, index) => (
                                <div key={index} className="flex items-center gap-4 cursor-pointer">
                                    <div
                                        className={`h-2 w-2 rounded-full ${activity.type === 'loan_application' ? 'bg-green-500' : 'bg-blue-500'}`}
                                    />
                                    <div>
                                        <p className="text-sm font-medium">{activity.title}</p>
                                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
