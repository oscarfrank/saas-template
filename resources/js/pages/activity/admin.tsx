import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from 'date-fns';
import { 
    User, 
    Settings, 
    FileText, 
    DollarSign, 
    CreditCard, 
    Mail, 
    Shield, 
    AlertCircle,
    ChevronDown,
    Activity as ActivityIcon,
    Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin',
        href: '/admin/dashboard',
    },
    {
        title: 'Activity Log',
        href: '/admin/activity',
    },
];

interface Activity {
    id: number;
    description: string;
    properties: any;
    created_at: string;
    causer: {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
    } | null;
}

interface Props {
    activities: {
        data: Activity[];
        links: any[];
        current_page: number;
        last_page: number;
    };
}

interface PageProps {
    activities: {
        data: Activity[];
        links: any[];
        current_page: number;
        last_page: number;
    };
}

const getActivityIcon = (description: string) => {
    const lowerDesc = description.toLowerCase();
    
    if (lowerDesc.includes('user') || lowerDesc.includes('profile')) return User;
    if (lowerDesc.includes('setting')) return Settings;
    if (lowerDesc.includes('document') || lowerDesc.includes('file')) return FileText;
    if (lowerDesc.includes('loan') || lowerDesc.includes('payment')) return DollarSign;
    if (lowerDesc.includes('transaction')) return CreditCard;
    if (lowerDesc.includes('email') || lowerDesc.includes('mail')) return Mail;
    if (lowerDesc.includes('security') || lowerDesc.includes('permission')) return Shield;
    if (lowerDesc.includes('error') || lowerDesc.includes('warning')) return AlertCircle;
    
    return ActivityIcon;
};

const getActivityColor = (description: string) => {
    const lowerDesc = description.toLowerCase();
    
    if (lowerDesc.includes('error') || lowerDesc.includes('warning')) return 'text-red-500';
    if (lowerDesc.includes('success') || lowerDesc.includes('approved')) return 'text-green-500';
    if (lowerDesc.includes('update') || lowerDesc.includes('modified')) return 'text-blue-500';
    if (lowerDesc.includes('create') || lowerDesc.includes('new')) return 'text-purple-500';
    if (lowerDesc.includes('delete') || lowerDesc.includes('remove')) return 'text-orange-500';
    
    return 'text-gray-500';
};

const ActivitySkeleton = () => (
    <div className="relative group">
        <div className="absolute left-4 top-2 h-2 w-2 rounded-full border-2 border-background bg-primary" />
        <div className="ml-8 py-1.5">
            <div className="flex items-center gap-3 px-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <div className="flex-1 min-w-0 flex items-center gap-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-24" />
                </div>
            </div>
        </div>
    </div>
);

export default function Admin({ activities: initialActivities }: Props) {
    const [activities, setActivities] = useState(initialActivities);
    const [isLoading, setIsLoading] = useState(false);

    const loadMore = () => {
        setIsLoading(true);
        router.visit('/admin/activity/load-more', {
            method: 'post',
            data: {
                page: activities.current_page + 1
            },
            preserveState: true,
            preserveScroll: true,
            only: ['activities'],
            onSuccess: (page) => {
                const newActivities = page.props.activities as typeof activities;
                setActivities(prev => ({
                    ...newActivities,
                    data: [...prev.data, ...newActivities.data],
                    links: newActivities.links,
                    current_page: newActivities.current_page,
                    last_page: newActivities.last_page
                }));
                setIsLoading(false);
            },
            onError: () => {
                setIsLoading(false);
            }
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Activity Log" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ActivityIcon className="h-6 w-6 text-primary" />
                        <h1 className="text-2xl font-semibold">Activity Log</h1>
                    </div>
                </div>

                <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-6 top-0 h-full w-0.5 bg-border" />

                    <div className="space-y-2">
                        {activities.data.map((activity, index) => {
                            const Icon = getActivityIcon(activity.description);
                            const iconColor = getActivityColor(activity.description);
                            
                            return (
                                <div key={activity.id} className="relative group">
                                    {/* Timeline dot */}
                                    <div className="absolute left-4 top-2 h-2 w-2 rounded-full border-2 border-background bg-primary" />
                                    
                                    <div className="ml-8 py-1.5 hover:bg-muted/50 rounded-md transition-colors">
                                        <div className="flex items-center gap-3 px-2">
                                            <div className={cn("rounded-full p-1", iconColor)}>
                                                <Icon className="h-3.5 w-3.5" />
                                            </div>
                                            <div className="flex-1 min-w-0 flex items-center gap-4">
                                                <p className="text-sm font-medium truncate min-w-[120px]">
                                                    {activity.causer ? activity.causer.first_name + ' ' + activity.causer.last_name : 'System Action'}
                                                </p>
                                                <p className="text-sm text-muted-foreground truncate flex-1">
                                                    {activity.description}
                                                    {activity.properties?.affected_user_id && (
                                                        <span className="ml-1 text-xs text-muted-foreground">
                                                            (Affected User: {activity.properties.affected_user_name})
                                                        </span>
                                                    )}
                                                </p>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <Badge variant="outline" className="text-xs">
                                                        {activity.properties?.event || 'Activity'}
                                                    </Badge>
                                                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                                                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {isLoading && (
                            <>
                                <ActivitySkeleton />
                                <ActivitySkeleton />
                            </>
                        )}
                    </div>

                    {activities.current_page < activities.last_page && (
                        <div className="mt-4 flex justify-center">
                            <Button
                                variant="outline"
                                onClick={loadMore}
                                disabled={isLoading}
                                className="flex items-center gap-2 h-8 text-sm"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        Loading...
                                    </>
                                ) : (
                                    <>
                                        Load More
                                        <ChevronDown className="h-3.5 w-3.5" />
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
