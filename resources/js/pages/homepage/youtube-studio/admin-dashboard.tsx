import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useAuth } from '@/hooks/use-auth';
import { useGreeting } from '@/hooks/use-greeting';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Users,
    Video,
    CheckSquare,
    MessageSquare,
    Settings,
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

export default function YouTubeStudioAdminDashboard({ quickStats, recentActivity }: Props) {
    const { user } = useAuth();
    const { getGreeting } = useGreeting();

    const quickStatsData = [
        { title: 'Team members', value: quickStats.total_users.toLocaleString(), icon: Users, color: 'text-cyan-500' },
        { title: 'Support tickets', value: quickStats.support_tickets.toLocaleString(), icon: MessageSquare, color: 'text-amber-500' },
        { title: 'Active loans', value: quickStats.active_loans.toLocaleString(), icon: Video, color: 'text-emerald-500' },
        { title: 'Pending', value: quickStats.pending_applications.toLocaleString(), icon: CheckSquare, color: 'text-violet-500' },
    ];

    const studioSections = [
        {
            title: 'Team & people',
            icon: Users,
            description: 'Manage your crew and roles',
            items: [
                { name: 'All Users', href: '/admin/users' },
                { name: 'User Roles', href: '/admin/roles' },
                { name: 'User Activity', href: '/admin/activity' },
            ],
        },
        {
            title: 'Studio & content',
            icon: Video,
            description: 'Shoots, scripts, and tasks',
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
            items: [
                { name: 'System Settings', href: '/admin/settings' },
                { name: 'API Management', href: '/admin/settings/api' },
            ],
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard - Admin (YouTube Studio)" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-semibold">{getGreeting()}, {(user.first_name as string)} {(user.last_name as string)}</h3>
                        <p className="text-muted-foreground">YouTube Studio admin – team, content, and support</p>
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

                <div className="grid gap-6 md:grid-cols-3">
                    {studioSections.map((section, index) => (
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
                        <CardDescription>Latest registrations and activity</CardDescription>
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
