import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useAuth } from '@/hooks/use-auth';
import { useRole } from '@/hooks/use-role';
import { useGreeting } from '@/hooks/use-greeting';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    Users, 
    Package, 
    Handshake, 
    MessageSquare, 
    Settings, 
    BarChart3, 
    FileText, 
    Shield, 
    Bell, 
    HelpCircle 
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard - Admin',
        href: '/dashboard/admin',
    },
];

export default function Dashboard() {
    const { user } = useAuth();
    const { hasRole } = useRole();
    const { getGreeting } = useGreeting();

    const quickStats = [
        { title: 'Total Users', value: '2,543', icon: Users, color: 'text-blue-500' },
        { title: 'Active Loans', value: '1,234', icon: Handshake, color: 'text-green-500' },
        { title: 'Pending Applications', value: '89', icon: FileText, color: 'text-yellow-500' },
        { title: 'Support Tickets', value: '45', icon: MessageSquare, color: 'text-red-500' },
    ];

    const adminSections = [
        {
            title: 'User Management',
            icon: Users,
            items: [
                { name: 'All Users', href: '/admin/users' },
                { name: 'User Roles', href: '/admin/roles' },
                { name: 'User Activity', href: '/admin/activity' },
            ],
        },
        {
            title: 'Loan Management',
            icon: Handshake,
            items: [
                { name: 'Loan Applications', href: '/admin/loans' },
                { name: 'Loan Packages', href: '/admin/packages' },
                { name: 'Loan History', href: '/admin/loan-history' },
            ],
        },
        {
            title: 'Support & Communication',
            icon: MessageSquare,
            items: [
                { name: 'Support Tickets', href: '/admin/support' },
                { name: 'Announcements', href: '/admin/announcements' },
                { name: 'Messages', href: '/admin/messages' },
            ],
        },
        {
            title: 'System & Settings',
            icon: Settings,
            items: [
                { name: 'System Settings', href: '/admin/settings' },
                { name: 'Security', href: '/admin/security' },
                { name: 'API Management', href: '/admin/api' },
            ],
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard - Admin" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-semibold">{getGreeting()}, {user.name}</h3>
                        <p className="text-muted-foreground">Welcome to your admin dashboard</p>
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

                {/* Quick Stats */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {quickStats.map((stat, index) => (
                        <Card key={index}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {stat.title}
                                </CardTitle>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Admin Sections */}
                <div className="grid gap-6 md:grid-cols-2">
                    {adminSections.map((section, index) => (
                        <Card key={index}>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <section.icon className="h-5 w-5" />
                                    <CardTitle>{section.title}</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-2">
                                    {section.items.map((item, itemIndex) => (
                                        <Button
                                            key={itemIndex}
                                            variant="ghost"
                                            className="w-full justify-start"
                                            onClick={() => window.location.href = item.href}
                                        >
                                            {item.name}
                                        </Button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                <div>
                                    <p className="text-sm font-medium">New loan application received</p>
                                    <p className="text-xs text-muted-foreground">2 minutes ago</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                                <div>
                                    <p className="text-sm font-medium">User registration completed</p>
                                    <p className="text-xs text-muted-foreground">15 minutes ago</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
