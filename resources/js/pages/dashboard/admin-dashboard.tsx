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
    Banknote,
    TrendingUp,
    AlertCircle,
    Globe,
    Mail
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard - Admin',
        href: '/dashboard/admin',
    },
];

interface QuickStats {
    total_users: number;
    active_loans: number;
    pending_applications: number;
    support_tickets: number;
}

interface LoanStats {
    [currency: string]: {
        total_active_loan_balance: {
            value: number;
            trend: string;
        };
        total_pending_loan_balance: {
            value: number;
            trend: string;
        };
        average_loan_balance: {
            value: number;
            trend: string;
        };
        default_rate: {
            value: string;
            trend: string;
        };
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

export default function Dashboard({ quickStats, loanStats, recentActivity, currencies }: Props) {
    const { user } = useAuth();
    const { hasRole } = useRole();
    const { getGreeting } = useGreeting();
    const [selectedCurrency, setSelectedCurrency] = useState(
        currencies.find(c => c.is_default)?.code || currencies[0]?.code
    );

    console.log('Quick Stats', quickStats);
    console.log('Loan Stats', loanStats);
    console.log('Recent Activity', recentActivity);
    

    const quickStatsData = [
        { title: 'Total Users', value: quickStats.total_users.toLocaleString(), icon: Users, color: 'text-blue-500' },
        { title: 'Active Loans', value: quickStats.active_loans.toLocaleString(), icon: Handshake, color: 'text-green-500' },
        { title: 'Pending Applications', value: quickStats.pending_applications.toLocaleString(), icon: FileText, color: 'text-yellow-500' },
        { title: 'Support Tickets', value: quickStats.support_tickets.toLocaleString(), icon: MessageSquare, color: 'text-red-500' },
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
                        <h3 className="text-2xl font-semibold">{getGreeting()}, {(user.first_name as string)} {(user.last_name as string)}</h3>
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
                    {quickStatsData.map((stat, index) => (
                        <Card key={index} className="cursor-pointer">
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
                        <Select 
                            value={selectedCurrency} 
                            onValueChange={(value) => setSelectedCurrency(value)}
                        >
                            <SelectTrigger className="w-[180px] cursor-pointer">
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
                            {Object.entries(loanStats[selectedCurrency] || loanStats[currencies.find(c => c.is_default)?.code || currencies[0]?.code]).map(([key, stat], index) => {
                                const currency = currencies.find(c => c.code === selectedCurrency);
                                const formattedValue = new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: selectedCurrency,
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                }).format(Number(stat.value));

                                return (
                                    <div key={index} className="flex flex-col gap-1 cursor-pointer">
                                        <div className="flex items-center gap-2">
                                            {key === 'default_rate' ? (
                                                <AlertCircle className={`h-4 w-4 ${stat.trend.includes('+') ? 'text-green-500' : 'text-red-500'}`} />
                                            ) : (
                                                <Banknote className={`h-4 w-4 ${stat.trend.includes('+') ? 'text-green-500' : 'text-red-500'}`} />
                                            )}
                                            <p className="text-sm text-muted-foreground">{key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</p>
                                        </div>
                                        <p className="text-2xl font-bold">
                                            {key === 'default_rate' ? stat.value : formattedValue}
                                        </p>
                                        <p className="text-xs text-green-500">{stat.trend}</p>
                                    </div>
                                );
                            })}
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
                                            className="w-full justify-start cursor-pointer"
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
                            {recentActivity.map((activity, index) => (
                                <div key={index} className="flex items-center gap-4 cursor-pointer">
                                    <div className={`h-2 w-2 rounded-full ${
                                        activity.type === 'loan_application' ? 'bg-green-500' : 'bg-blue-500'
                                    }`} />
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
