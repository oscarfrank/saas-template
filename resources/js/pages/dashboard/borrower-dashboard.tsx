import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
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

interface DashboardProps {
    currentLoan: {
        current_balance: string;
        status: string;
        nextPayment: string | null;
        remainingBalance: string;
    } | null;
    applications: Array<{
        id: string;
        amount: string;
        status: string;
        date: string;
        icon: string;
        color: string;
    }>;
    upcomingPayments: Array<{
        date: string;
        amount: string;
        days_remaining: number;
    }>;
}

export default function Dashboard({ currentLoan, applications, upcomingPayments }: DashboardProps) {
    const { user } = useAuth();
    const { hasRole } = useRole();
    const { getGreeting } = useGreeting();

    const quickActions = [
        {
            title: 'Apply for New Loan',
            description: 'Start a new loan application',
            icon: FileText,
            href: '/loan-packages',
        },
        {
            title: 'Make Payment',
            description: 'Pay your current loan installment',
            icon: CreditCard,
            href: '/make-payments',
        },
        {
            title: 'View History',
            description: 'Check your loan history',
            icon: History,
            href: '/loans',
        },
        {
            title: 'Get Help',
            description: 'Contact support',
            icon: HelpCircle,
            href: '/tickets',
        },
    ];

    const getIconComponent = (iconName: string) => {
        const icons: { [key: string]: any } = {
            Clock,
            CheckCircle2,
            AlertCircle,
            DollarSign,
            HelpCircle,
        };
        return icons[iconName] || HelpCircle;
    };

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
                        <Link href="/activity">
                            <Button variant="outline" size="sm" className="cursor-pointer">
                                <Bell className="mr-2 h-4 w-4" />
                                Notifications
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Current Loan Status */}
                {currentLoan && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Current Loan Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                                <div className="flex flex-col gap-1">
                                    <p className="text-sm text-muted-foreground">Current Balance</p>
                                    <p className="text-2xl font-bold">{currentLoan.current_balance}</p>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <p className="text-sm text-muted-foreground">Status</p>
                                    <Badge variant="outline" className="w-fit">
                                        {currentLoan.status}
                                    </Badge>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <p className="text-sm text-muted-foreground">Next Payment</p>
                                    <p className="text-2xl font-bold">{currentLoan.nextPayment}</p>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <p className="text-sm text-muted-foreground">Remaining Balance</p>
                                    <p className="text-2xl font-bold">{currentLoan.remainingBalance}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Quick Actions */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {quickActions.map((action, index) => (
                        <Link key={index} href={action.href}>
                            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                                <CardContent className="p-6">
                                    <div className="flex flex-col items-center text-center gap-2">
                                        <action.icon className="h-8 w-8 text-primary" />
                                        <h4 className="font-semibold">{action.title}</h4>
                                        <p className="text-sm text-muted-foreground">{action.description}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
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
                            {applications.map((application, index) => {
                                const IconComponent = getIconComponent(application.icon);
                                return (
                                    <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                                        <div className="flex items-center gap-4">
                                            <IconComponent className={`h-6 w-6 ${application.color}`} />
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
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Upcoming Payments */}
                {upcomingPayments.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Upcoming Payments</CardTitle>
                            <CardDescription>Your next loan payments</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {upcomingPayments.map((payment, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                                        <div className="flex items-center gap-4">
                                            <Calendar className="h-6 w-6 text-primary" />
                                            <div>
                                                <p className="font-medium">{payment.date}</p>
                                                <p className="text-sm text-muted-foreground">Next installment</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">{payment.amount}</p>
                                            <Badge variant="outline" className="w-fit">
                                                Due in {payment.days_remaining} days
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
