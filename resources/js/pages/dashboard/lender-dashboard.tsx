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
    TrendingUp, 
    DollarSign, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    Calendar, 
    CreditCard, 
    History, 
    HelpCircle,
    Bell,
    PieChart,
    BarChart3,
    Wallet
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard - Lender',
        href: '/dashboard/lender',
    },
];

export default function Dashboard() {
    const { user } = useAuth();
    const { hasRole } = useRole();
    const { getGreeting } = useGreeting();

    const portfolioStats = {
        totalInvestment: '$250,000',
        activeLoans: '24',
        totalReturns: '$15,750',
        averageReturnRate: '12.5%',
    };

    const activeInvestments = [
        {
            id: 'L-2024-001',
            amount: '$25,000',
            borrower: 'John Smith',
            interestRate: '15%',
            term: '12 months',
            status: 'Active',
            nextPayment: 'May 15, 2024',
            icon: CheckCircle2,
            color: 'text-green-500',
        },
        {
            id: 'L-2024-002',
            amount: '$15,000',
            borrower: 'Sarah Johnson',
            interestRate: '14%',
            term: '24 months',
            status: 'Active',
            nextPayment: 'May 20, 2024',
            icon: CheckCircle2,
            color: 'text-green-500',
        },
    ];

    const quickActions = [
        {
            title: 'New Investment',
            description: 'Browse available loans',
            icon: DollarSign,
            href: '/investments/new',
        },
        {
            title: 'Portfolio Analytics',
            description: 'View detailed analytics',
            icon: BarChart3,
            href: '/portfolio/analytics',
        },
        {
            title: 'Payment History',
            description: 'Track your returns',
            icon: History,
            href: '/payments/history',
        },
        {
            title: 'Get Help',
            description: 'Contact support',
            icon: HelpCircle,
            href: '/support',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard - Lender" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-semibold">{getGreeting()}, {user.name}</h3>
                        <p className="text-muted-foreground">Welcome to your lender dashboard</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                            <Bell className="mr-2 h-4 w-4" />
                            Notifications
                        </Button>
                    </div>
                </div>

                {/* Portfolio Overview */}
                <Card>
                    <CardHeader>
                        <CardTitle>Portfolio Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            <div className="flex flex-col gap-1">
                                <p className="text-sm text-muted-foreground">Total Investment</p>
                                <p className="text-2xl font-bold">{portfolioStats.totalInvestment}</p>
                            </div>
                            <div className="flex flex-col gap-1">
                                <p className="text-sm text-muted-foreground">Active Loans</p>
                                <p className="text-2xl font-bold">{portfolioStats.activeLoans}</p>
                            </div>
                            <div className="flex flex-col gap-1">
                                <p className="text-sm text-muted-foreground">Total Returns</p>
                                <p className="text-2xl font-bold text-green-500">{portfolioStats.totalReturns}</p>
                            </div>
                            <div className="flex flex-col gap-1">
                                <p className="text-sm text-muted-foreground">Average Return Rate</p>
                                <p className="text-2xl font-bold text-green-500">{portfolioStats.averageReturnRate}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {quickActions.map((action, index) => (
                        <Card key={index} className="hover:bg-accent/50 transition-colors cursor-pointer">
                            <CardContent className="p-6">
                                <div className="flex flex-col items-center text-center gap-2">
                                    <action.icon className="h-8 w-8 text-primary" />
                                    <h4 className="font-semibold">{action.title}</h4>
                                    <p className="text-sm text-muted-foreground">{action.description}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Active Investments */}
                <Card>
                    <CardHeader>
                        <CardTitle>Active Investments</CardTitle>
                        <CardDescription>Your current loan investments</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {activeInvestments.map((investment, index) => (
                                <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                                    <div className="flex items-center gap-4">
                                        <investment.icon className={`h-6 w-6 ${investment.color}`} />
                                        <div>
                                            <p className="font-medium">Investment #{investment.id}</p>
                                            <p className="text-sm text-muted-foreground">{investment.borrower}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-right">
                                        <div>
                                            <p className="font-bold">{investment.amount}</p>
                                            <p className="text-sm text-muted-foreground">{investment.interestRate} interest</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Next payment</p>
                                            <p className="font-medium">{investment.nextPayment}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Upcoming Returns */}
                <Card>
                    <CardHeader>
                        <CardTitle>Upcoming Returns</CardTitle>
                        <CardDescription>Expected payments from your investments</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-lg border">
                                <div className="flex items-center gap-4">
                                    <Calendar className="h-6 w-6 text-primary" />
                                    <div>
                                        <p className="font-medium">May 15, 2024</p>
                                        <p className="text-sm text-muted-foreground">From Investment #L-2024-001</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold">$1,250.00</p>
                                    <Badge variant="outline" className="w-fit">
                                        Due in 5 days
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
