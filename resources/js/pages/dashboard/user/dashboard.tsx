import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useAuth } from '@/hooks/use-auth';
import { useRole } from '@/hooks/use-role';
import { useGreeting } from '@/hooks/use-greeting';
import { Link } from '@inertiajs/react';

import { useTenantRouter } from '@/hooks/use-tenant-router';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

export default function Dashboard() {
    const tenantRouter = useTenantRouter();
    const { user } = useAuth();
    const { hasRole } = useRole();
    const { getGreeting } = useGreeting();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-semibold">{getGreeting()}, {(user.first_name as string)} {(user.last_name as string)}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
                    {/* Borrower Dashboard Button */}
                    <Link 
                        href={tenantRouter.route('borrower-dashboard')}
                        className="group relative flex flex-col items-center justify-center p-8 rounded-xl border-2 border-blue-500 hover:border-blue-600 transition-all duration-200 hover:shadow-lg bg-white dark:bg-gray-800"
                    >
                        <div className="text-4xl mb-4">💰</div>
                        <h2 className="text-2xl font-bold mb-2 text-blue-600 dark:text-blue-400">Borrower Dashboard</h2>
                        <p className="text-center text-gray-600 dark:text-gray-300">
                            For individuals and businesses looking to secure funding for their projects and ventures
                        </p>
                        <div className="absolute inset-0 rounded-xl bg-blue-500/0 group-hover:bg-blue-500/5 transition-all duration-200" />
                    </Link>

                    {/* Lender Dashboard Button */}
                    <Link 
                        href={tenantRouter.route('lender-dashboard')}
                        className="group relative flex flex-col items-center justify-center p-8 rounded-xl border-2 border-green-500 hover:border-green-600 transition-all duration-200 hover:shadow-lg bg-white dark:bg-gray-800"
                    >
                        <div className="text-4xl mb-4">💎</div>
                        <h2 className="text-2xl font-bold mb-2 text-green-600 dark:text-green-400">Lender Dashboard</h2>
                        <p className="text-center text-gray-600 dark:text-gray-300">
                            For investors looking to grow their portfolio and earn returns on their investments
                        </p>
                        <div className="absolute inset-0 rounded-xl bg-green-500/0 group-hover:bg-green-500/5 transition-all duration-200" />
                    </Link>
                </div>
            </div>
        </AppLayout>
    );
}
