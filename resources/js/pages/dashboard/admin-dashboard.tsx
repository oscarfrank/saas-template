import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useAuth } from '@/hooks/use-auth';
import { useRole } from '@/hooks/use-role';
import { useGreeting } from '@/hooks/use-greeting';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
    HelpCircle,
    DollarSign,
    TrendingUp,
    AlertCircle,
    Globe
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

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

    const currencies = [
        { code: 'USD', symbol: '$', name: 'US Dollar' },
        { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
        { code: 'EUR', symbol: '€', name: 'Euro' },
        { code: 'GBP', symbol: '£', name: 'British Pound' },
    ];

    const quickStats = [
        { title: 'Total Users', value: '2,543', icon: Users, color: 'text-blue-500' },
        { title: 'Active Loans', value: '1,234', icon: Handshake, color: 'text-green-500' },
        { title: 'Pending Applications', value: '89', icon: FileText, color: 'text-yellow-500' },
        { title: 'Support Tickets', value: '45', icon: MessageSquare, color: 'text-red-500' },
    ];

    const loanStats = {
        USD: [
            { 
                title: 'Total Active Loan Amount', 
                value: '$12,450,000', 
                icon: DollarSign, 
                color: 'text-green-500',
                description: 'Sum of all active loans',
                trend: '+12.5% from last month'
            },
            { 
                title: 'Total Pending Loan Balance', 
                value: '$3,250,000', 
                icon: AlertCircle, 
                color: 'text-yellow-500',
                description: 'Sum of all pending loan applications',
                trend: '+8.2% from last month'
            },
            { 
                title: 'Average Loan Size', 
                value: '$10,089', 
                icon: TrendingUp, 
                color: 'text-blue-500',
                description: 'Average amount per loan',
                trend: '+5.3% from last month'
            },
            { 
                title: 'Default Rate', 
                value: '2.3%', 
                icon: Shield, 
                color: 'text-red-500',
                description: 'Percentage of defaulted loans',
                trend: '-0.5% from last month'
            },
        ],
        NGN: [
            { 
                title: 'Total Active Loan Amount', 
                value: '₦1,245,000,000', 
                icon: DollarSign, 
                color: 'text-green-500',
                description: 'Sum of all active loans',
                trend: '+15.2% from last month'
            },
            { 
                title: 'Total Pending Loan Balance', 
                value: '₦325,000,000', 
                icon: AlertCircle, 
                color: 'text-yellow-500',
                description: 'Sum of all pending loan applications',
                trend: '+10.8% from last month'
            },
            { 
                title: 'Average Loan Size', 
                value: '₦1,008,900', 
                icon: TrendingUp, 
                color: 'text-blue-500',
                description: 'Average amount per loan',
                trend: '+7.3% from last month'
            },
            { 
                title: 'Default Rate', 
                value: '2.1%', 
                icon: Shield, 
                color: 'text-red-500',
                description: 'Percentage of defaulted loans',
                trend: '-0.3% from last month'
            },
        ],
        EUR: [
            { 
                title: 'Total Active Loan Amount', 
                value: '€11,250,000', 
                icon: DollarSign, 
                color: 'text-green-500',
                description: 'Sum of all active loans',
                trend: '+9.5% from last month'
            },
            { 
                title: 'Total Pending Loan Balance', 
                value: '€2,950,000', 
                icon: AlertCircle, 
                color: 'text-yellow-500',
                description: 'Sum of all pending loan applications',
                trend: '+6.8% from last month'
            },
            { 
                title: 'Average Loan Size', 
                value: '€9,125', 
                icon: TrendingUp, 
                color: 'text-blue-500',
                description: 'Average amount per loan',
                trend: '+4.2% from last month'
            },
            { 
                title: 'Default Rate', 
                value: '1.8%', 
                icon: Shield, 
                color: 'text-red-500',
                description: 'Percentage of defaulted loans',
                trend: '-0.4% from last month'
            },
        ],
    };

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

                {/* Loan Statistics */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Loan Statistics</CardTitle>
                            <CardDescription>Overview of loan performance and metrics</CardDescription>
                        </div>
                        <Select defaultValue="USD">
                            <SelectTrigger className="w-[180px]">
                                <Globe className="mr-2 h-4 w-4" />
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
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            {loanStats.USD.map((stat, index) => (
                                <div key={index} className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                                    </div>
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                    <p className="text-sm text-muted-foreground">{stat.description}</p>
                                    <p className="text-xs text-green-500">{stat.trend}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

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
