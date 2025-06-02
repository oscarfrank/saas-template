import { Bell, Check, Circle, Trash2, Activity as ActivityIcon, User, Settings, FileText, DollarSign, CreditCard, Mail, Shield, AlertCircle, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { router, usePage } from "@inertiajs/react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from "@/hooks/use-auth";
import { useEffectiveTenant } from "@/hooks/use-effective-tenant";
import { useTenantRouter } from "@/hooks/use-tenant-router";

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

interface Activities {
    data: Activity[];
    links: any[];
    current_page: number;
    last_page: number;
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
    <div className="flex items-start gap-2 rounded-md border p-2">
        <Skeleton className="h-1.5 w-1.5 rounded-full mt-1" />
        <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
                <Skeleton className="h-4 w-24" />
                <div className="flex gap-1">
                    <Skeleton className="h-6 w-6" />
                    <Skeleton className="h-6 w-6" />
                </div>
            </div>
            <Skeleton className="h-3 w-48 mt-1" />
            <Skeleton className="h-2 w-20 mt-0.5" />
        </div>
    </div>
);

export function AppNotifications({ unreadCount }: { unreadCount: number }) {
    const { props } = usePage();
    const [activities, setActivities] = useState<Activities | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const { user } = useAuth();
    const observerTarget = useRef<HTMLDivElement>(null);
    const tenantRouter = useTenantRouter();
    const { notifications } = useEffectiveTenant();

    const loadActivities = async (page: number = 1) => {
        setIsLoading(true);
        try {
            let token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ||
                       document.querySelector('meta[name="csrf"]')?.getAttribute('content') ||
                       document.querySelector('meta[name="csrf-param"]')?.getAttribute('content');

            if (!token) {
                const cookies = document.cookie.split(';');
                const csrfCookie = cookies.find(cookie => cookie.trim().startsWith('XSRF-TOKEN='));
                if (csrfCookie) {
                    token = decodeURIComponent(csrfCookie.split('=')[1]);
                }
            }

            if (!token) {
                throw new Error('CSRF token not found in meta tags or cookies');
            }

            const response = await fetch(tenantRouter.route('activity.user-notifications'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': token,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({ page }),
                credentials: 'same-origin'
            });
            
            if (!response.ok) throw new Error('Failed to load activities');
            
            const data = await response.json();
            const newActivities = data.activities as Activities;
            
            setActivities(prev => prev ? {
                ...newActivities,
                data: [...prev.data, ...newActivities.data],
                links: newActivities.links,
                current_page: newActivities.current_page,
                last_page: newActivities.last_page
            } : newActivities);
        } catch (error) {
            console.error('Failed to load activities:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (open && !activities) {
            loadActivities();
        }
    }, [open]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && activities && !isLoading && activities.current_page < activities.last_page) {
                    loadActivities(activities.current_page + 1);
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [activities, isLoading]);

    const markAsRead = (id: number) => {
        // TODO: Implement mark as read functionality
        console.log('Mark as read:', id);
    };

    const markAsUnread = (id: number) => {
        // TODO: Implement mark as unread functionality
        console.log('Mark as unread:', id);
    };

    const deleteNotification = (id: number) => {
        // TODO: Implement delete functionality
        console.log('Delete:', id);
    };

    const markAllAsRead = async () => {
        try {
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            if (!token) throw new Error('CSRF token not found');

            const response = await fetch(tenantRouter.route('activity.user.reset-counter'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': token,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            });

            if (!response.ok) throw new Error('Failed to reset counter');

            // Update activities to mark all as read
            setActivities(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    data: prev.data.map(activity => ({
                        ...activity,
                        properties: {
                            ...activity.properties,
                            read: true
                        }
                    }))
                };
            });

            // Reload the page to update the shared notification count
            router.reload();
        } catch (error) {
            console.error('Failed to reset counter:', error);
        }
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    className="relative w-full justify-start gap-2"
                    aria-label="Notifications"
                >
                    <Bell className="size-4" />
                    <span>Inbox</span>
                    {unreadCount > 0 && (
                        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] text-white">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent side="left">
                <SheetHeader className="space-y-2">
                    <SheetTitle>Notifications</SheetTitle>
                    <div className="flex items-center justify-between">
                        <SheetDescription>
                            View and manage your notifications
                        </SheetDescription>
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={markAllAsRead}
                                className="text-xs"
                            >
                                Mark all as read
                            </Button>
                        )}
                    </div>
                </SheetHeader>
                <div className="mt-2 space-y-1">
                    {activities?.data.map((activity) => {
                        const Icon = getActivityIcon(activity.description);
                        const iconColor = getActivityColor(activity.description);
                        const isRead = activity.properties?.read;

                        return (
                            <div
                                key={activity.id}
                                className={cn(
                                    "flex items-start gap-2 rounded-md border p-2 hover:bg-muted/50 transition-colors",
                                    !isRead && "bg-muted/30"
                                )}
                            >
                                <div className="mt-1">
                                    {isRead ? (
                                        <Circle className="size-1.5 text-muted-foreground" />
                                    ) : (
                                        <Circle className="size-1.5 fill-primary text-primary" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <div className={cn("rounded-full p-1", iconColor)}>
                                                <Icon className="h-3.5 w-3.5" />
                                            </div>
                                            <p className="text-sm font-medium truncate">
                                                {activity.causer ? (
                                                    activity.causer.id === user.id ? 'You' : 'System (Admin)'
                                                ) : 'System (Admin)'}
                                            </p>
                                        </div>
                                        <div className="flex gap-1 shrink-0">
                                            {isRead ? (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => markAsUnread(activity.id)}
                                                    className="h-6 w-6"
                                                >
                                                    <Circle className="size-3" />
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => markAsRead(activity.id)}
                                                    className="h-6 w-6"
                                                >
                                                    <Check className="size-3" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => deleteNotification(activity.id)}
                                                className="h-6 w-6"
                                            >
                                                <Trash2 className="size-3" />
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                        {activity.description}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                                    </p>
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

                    <div ref={observerTarget} className="h-4" />
                </div>
            </SheetContent>
        </Sheet>
    );
} 