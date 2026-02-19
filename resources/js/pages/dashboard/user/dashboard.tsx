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

                <p className="text-muted-foreground text-sm mb-6 max-w-2xl">
                    Choose a dashboard to get started. You can switch anytime from this page or the sidebar.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl w-full">
                    {/* Workspace (Notion-like) */}
                    <Link
                        href={tenantRouter.route('workspace-dashboard')}
                        className="group relative flex flex-col items-center justify-center p-6 rounded-xl border-2 border-violet-500 hover:border-violet-600 transition-all duration-200 hover:shadow-lg bg-white dark:bg-gray-800"
                    >
                        <div className="text-4xl mb-3">📋</div>
                        <h2 className="text-xl font-bold mb-2 text-violet-600 dark:text-violet-400">Workspace</h2>
                        <p className="text-center text-gray-600 dark:text-gray-300 text-sm">
                            Upcoming events, tasks, and YouTube in one place
                        </p>
                        <div className="absolute inset-0 rounded-xl bg-violet-500/0 group-hover:bg-violet-500/5 transition-all duration-200" />
                    </Link>

                    {/* YouTuber Dashboard */}
                    <Link
                        href={tenantRouter.route('youtuber-dashboard')}
                        className="group relative flex flex-col items-center justify-center p-6 rounded-xl border-2 border-red-500 hover:border-red-600 transition-all duration-200 hover:shadow-lg bg-white dark:bg-gray-800"
                    >
                        <div className="text-4xl mb-3">▶️</div>
                        <h2 className="text-xl font-bold mb-2 text-red-600 dark:text-red-400">YouTuber</h2>
                        <p className="text-center text-gray-600 dark:text-gray-300 text-sm">
                            Channel stats, creative tools, and content ideas
                        </p>
                        <div className="absolute inset-0 rounded-xl bg-red-500/0 group-hover:bg-red-500/5 transition-all duration-200" />
                    </Link>

                    {/* Borrower Dashboard */}
                    <Link
                        href={tenantRouter.route('borrower-dashboard')}
                        className="group relative flex flex-col items-center justify-center p-6 rounded-xl border-2 border-blue-500 hover:border-blue-600 transition-all duration-200 hover:shadow-lg bg-white dark:bg-gray-800"
                    >
                        <div className="text-4xl mb-3">💰</div>
                        <h2 className="text-xl font-bold mb-2 text-blue-600 dark:text-blue-400">Borrower</h2>
                        <p className="text-center text-gray-600 dark:text-gray-300 text-sm">
                            Funding for your projects and ventures
                        </p>
                        <div className="absolute inset-0 rounded-xl bg-blue-500/0 group-hover:bg-blue-500/5 transition-all duration-200" />
                    </Link>

                    {/* Lender Dashboard */}
                    <Link
                        href={tenantRouter.route('lender-dashboard')}
                        className="group relative flex flex-col items-center justify-center p-6 rounded-xl border-2 border-green-500 hover:border-green-600 transition-all duration-200 hover:shadow-lg bg-white dark:bg-gray-800"
                    >
                        <div className="text-4xl mb-3">💎</div>
                        <h2 className="text-xl font-bold mb-2 text-green-600 dark:text-green-400">Lender</h2>
                        <p className="text-center text-gray-600 dark:text-gray-300 text-sm">
                            Grow your portfolio and earn returns
                        </p>
                        <div className="absolute inset-0 rounded-xl bg-green-500/0 group-hover:bg-green-500/5 transition-all duration-200" />
                    </Link>
                </div>
            </div>
        </AppLayout>
    );
}
