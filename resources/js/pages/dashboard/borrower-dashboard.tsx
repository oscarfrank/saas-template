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
    FileText, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    DollarSign, 
    Calendar, 
    CreditCard, 
    History, 
    HelpCircle,
    Bell
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard - Borrower',
        href: '/dashboard/borrower',
    },
];

export default function Dashboard() {
    const { user } = useAuth();
    const { hasRole } = useRole();
    const { getGreeting } = useGreeting();

    const loanStatus = {
        current: {
            amount: '$15,000',
            status: 'Active',
            nextPayment: 'May 15, 2024',
            remainingBalance: '$12,500',
        },
        applications: [
            {
                id: 'L-2024-001',
                amount: '$10,000',
                status: 'Pending',
                date: 'May 1, 2024',
                icon: Clock,
                color: 'text-yellow-500',
            },
            {
                id: 'L-2023-045',
                amount: '$5,000',
                status: 'Approved',
                date: 'April 15, 2024',
                icon: CheckCircle2,
                color: 'text-green-500',
            },
        ],
    };

    const quickActions = [
        {
            title: 'Apply for New Loan',
            description: 'Start a new loan application',
            icon: FileText,
            href: '/loans/apply',
        },
        {
            title: 'Make Payment',
            description: 'Pay your current loan installment',
            icon: CreditCard,
            href: '/payments',
        },
        {
            title: 'View History',
            description: 'Check your loan history',
            icon: History,
            href: '/loans/history',
        },
        {
            title: 'Get Help',
            description: 'Contact support',
            icon: HelpCircle,
            href: '/tickets',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard - Borrower" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-semibold">{getGreeting()}, {(user.first_name as string)} {(user.last_name as string)}</h3>
                        <p className="text-muted-foreground">Welcome to your borrower dashboard</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                            <Bell className="mr-2 h-4 w-4" />
                            Notifications
                        </Button>
                    </div>
                </div>

                {/* Current Loan Status */}
                <Card>
                    <CardHeader>
                        <CardTitle>Current Loan Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            <div className="flex flex-col gap-1">
                                <p className="text-sm text-muted-foreground">Loan Amount</p>
                                <p className="text-2xl font-bold">{loanStatus.current.amount}</p>
                            </div>
                            <div className="flex flex-col gap-1">
                                <p className="text-sm text-muted-foreground">Status</p>
                                <Badge variant="outline" className="w-fit">
                                    {loanStatus.current.status}
                                </Badge>
                            </div>
                            <div className="flex flex-col gap-1">
                                <p className="text-sm text-muted-foreground">Next Payment</p>
                                <p className="text-2xl font-bold">{loanStatus.current.nextPayment}</p>
                            </div>
                            <div className="flex flex-col gap-1">
                                <p className="text-sm text-muted-foreground">Remaining Balance</p>
                                <p className="text-2xl font-bold">{loanStatus.current.remainingBalance}</p>
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

                {/* Loan Applications */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Applications</CardTitle>
                        <CardDescription>Track your loan applications</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {loanStatus.applications.map((application, index) => (
                                <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                                    <div className="flex items-center gap-4">
                                        <application.icon className={`h-6 w-6 ${application.color}`} />
                                        <div>
                                            <p className="font-medium">Application #{application.id}</p>
                                            <p className="text-sm text-muted-foreground">{application.date}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">{application.amount}</p>
                                        <Badge variant="outline" className="w-fit">
                                            {application.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Upcoming Payments */}
                <Card>
                    <CardHeader>
                        <CardTitle>Upcoming Payments</CardTitle>
                        <CardDescription>Your next loan payments</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-lg border">
                                <div className="flex items-center gap-4">
                                    <Calendar className="h-6 w-6 text-primary" />
                                    <div>
                                        <p className="font-medium">May 15, 2024</p>
                                        <p className="text-sm text-muted-foreground">Next installment</p>
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
