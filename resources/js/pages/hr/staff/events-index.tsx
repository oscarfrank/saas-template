import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import { ArrowLeft, Award, ClipboardList, MessageSquare, AlertTriangle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface StaffUser {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
}

interface Staff {
    id: number;
    uuid: string;
    user?: StaffUser;
}

interface ChangedBy {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
}

interface EventItem {
    id: number;
    event_type: string;
    title: string | null;
    description: string | null;
    position_history_id?: number | null;
    created_at: string;
    changed_by?: ChangedBy | null;
    changedBy?: ChangedBy | null;
}

interface PaginatedEvents {
    data: EventItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    staff: Staff;
    events: PaginatedEvents;
    eventTypeLabels: Record<string, string>;
    canDeleteEvents?: boolean;
}

function staffName(staff: Staff): string {
    const u = staff.user;
    if (!u) return 'Staff';
    const name = `${u.first_name || ''} ${u.last_name || ''}`.trim();
    return name || u.email || 'Staff';
}

function eventTypeIcon(type: string) {
    switch (type) {
        case 'policy_violation':
        case 'warning':
            return <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />;
        case 'commendation':
            return <Award className="h-4 w-4 shrink-0 text-emerald-500" />;
        default:
            return <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />;
    }
}

export default function HRStaffEventsIndex({ staff, events, eventTypeLabels, canDeleteEvents = false }: Props) {
    const tenantRouter = useTenantRouter();
    const [eventToDelete, setEventToDelete] = useState<{ id: number; position_history_id: number | null } | null>(null);
    const [deletePositionHistoryToo, setDeletePositionHistoryToo] = useState(true);

    const name = staffName(staff);
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'HR', href: tenantRouter.route('hr.staff.index') },
        { title: 'Staff', href: tenantRouter.route('hr.staff.index') },
        { title: name, href: tenantRouter.route('hr.staff.show', { staff: staff.uuid }) },
        { title: 'Event log', href: '#' },
    ];

    const handleDeleteEvent = () => {
        if (eventToDelete === null) return;
        let url = tenantRouter.route('hr.staff.events.destroy', { staff: staff.uuid, event: eventToDelete.id });
        if (deletePositionHistoryToo && eventToDelete.position_history_id != null) {
            url += '?delete_position_history=1';
        }
        router.delete(url, {
            preserveScroll: false,
            onSuccess: () => setEventToDelete(null),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Event log – ${name}`} />
            <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
                <div className="mb-6 flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={tenantRouter.route('hr.staff.show', { staff: staff.uuid })}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold">Event log</h1>
                        <p className="text-sm text-muted-foreground">{name}</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <ClipboardList className="h-4 w-4 text-muted-foreground" />
                            All events ({events.total})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {events.data.length === 0 ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">No events yet.</p>
                        ) : (
                            <>
                                <ul className="space-y-3">
                                    {events.data.map((ev) => {
                                        const loggedBy = ev.changed_by ?? ev.changedBy;
                                        const loggedByName = loggedBy
                                            ? [loggedBy.first_name, loggedBy.last_name].filter(Boolean).join(' ') || 'Unknown'
                                            : null;
                                        return (
                                            <li
                                                key={ev.id}
                                                className="flex gap-3 rounded-lg border border-muted/50 bg-muted/10 px-4 py-3"
                                            >
                                                {eventTypeIcon(ev.event_type)}
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                                            {eventTypeLabels[ev.event_type] ?? ev.event_type}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {new Date(ev.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    {loggedByName && (
                                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                                            Logged by: <span className="font-medium text-foreground">{loggedByName}</span>
                                                        </p>
                                                    )}
                                                    {(ev.title || ev.description) && (
                                                        <p className="mt-1 text-sm font-medium">
                                                            {ev.title}
                                                            {ev.title && ev.description ? ' — ' : ''}
                                                            {ev.description}
                                                        </p>
                                                    )}
                                                </div>
                                                {canDeleteEvents && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="shrink-0 text-muted-foreground hover:text-destructive"
                                                        onClick={() => setEventToDelete({ id: ev.id, position_history_id: ev.position_history_id ?? null })}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                                {events.last_page > 1 && (
                                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-muted/50 pt-4">
                                        <p className="text-sm text-muted-foreground">
                                            Showing {events.from ?? 0}–{events.to ?? 0} of {events.total}
                                        </p>
                                        <div className="flex gap-1">
                                            {events.links.map((link, i) => (
                                                <Button
                                                    key={i}
                                                    variant={link.active ? 'secondary' : 'outline'}
                                                    size="sm"
                                                    disabled={!link.url}
                                                    asChild={!!link.url && !link.active}
                                                >
                                                    {link.url && !link.active ? (
                                                        <Link href={link.url}>{link.label}</Link>
                                                    ) : (
                                                        <span>{link.label}</span>
                                                    )}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            <AlertDialog open={eventToDelete !== null} onOpenChange={(open) => !open && setEventToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete event?</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-2">
                                <p>This event log entry will be removed. This cannot be undone.</p>
                                {eventToDelete?.position_history_id != null && (
                                    <label className="flex cursor-pointer items-center gap-2 pt-2">
                                        <input
                                            type="checkbox"
                                            checked={deletePositionHistoryToo}
                                            onChange={(e) => setDeletePositionHistoryToo(e.target.checked)}
                                            className="h-4 w-4 rounded border-input"
                                        />
                                        <span className="text-sm">Also delete the related position history entry</span>
                                    </label>
                                )}
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-white hover:bg-destructive/90 hover:text-white"
                            onClick={handleDeleteEvent}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
