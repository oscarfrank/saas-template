import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useAuth } from '@/hooks/use-auth';
import { useRole } from '@/hooks/use-role';
import { useGreeting } from '@/hooks/use-greeting';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard - User',
        href: '/dashboard',
    },
];

export default function Dashboard() {
    const { user } = useAuth();
    const { hasRole } = useRole();
    const { getGreeting } = useGreeting();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard - Admin" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">{getGreeting()}, {(user.first_name as string)} {(user.last_name as string)}</h3>
                    <h3>{hasRole(user, 'super-admin') ? 'Super Admin' : ''}</h3>

                </div>
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative aspect-video overflow-hidden rounded-xl border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative aspect-video overflow-hidden rounded-xl border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative aspect-video overflow-hidden rounded-xl border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                </div>
                <div className="border-sidebar-border/70 dark:border-sidebar-border relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border md:min-h-min">
                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                </div>
            </div>
        </AppLayout>
    );
}
