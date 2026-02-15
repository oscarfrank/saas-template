import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface ScriptCalendarItem {
    id: number;
    uuid: string;
    title: string;
    scheduled_at: string | null;
    status: string;
    script_type?: string | null;
    production_status?: string | null;
    can_edit: boolean;
}

interface Props {
    scripts: ScriptCalendarItem[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Scripts', href: '/script' },
    { title: 'Calendar', href: '/script/calendar' },
];

export default function ScriptCalendarPage({ scripts }: Props) {
    const tenantRouter = useTenantRouter();
    const [calendarScripts, setCalendarScripts] = useState<ScriptCalendarItem[]>(scripts);
    const [events, setEvents] = useState(
        scripts
            .filter((s) => s.scheduled_at)
            .map((s) => ({
                id: String(s.id),
                title: s.title,
                start: s.scheduled_at!,
                allDay: false,
                editable: s.can_edit,
                extendedProps: {
                    uuid: s.uuid,
                    status: s.status,
                    script_type: s.script_type,
                    production_status: s.production_status,
                },
            }))
    );
    const [currentRange, setCurrentRange] = useState<{ start: Date; end: Date } | null>(null);

    const handleEventDrop = async (arg: any) => {
        const { event } = arg;
        const uuid: string | undefined = event.extendedProps.uuid as string | undefined;
        const start = event.start;

        if (!uuid || !start) {
            arg.revert();
            return;
        }

        const scheduledAt = start.toISOString();

        try {
            const url = tenantRouter.route('script.reschedule', { script: uuid });
            const csrfToken =
                document.querySelector<HTMLMetaElement>('meta[name=\"csrf-token\"]')?.content ?? '';
            const res = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ scheduled_at: scheduledAt }),
            });

            if (!res.ok) {
                arg.revert();
                const data = await res.json().catch(() => ({}));
                toast.error(data.message ?? 'Failed to reschedule script.');
                return;
            }

            setEvents((prev) =>
                prev.map((e) =>
                    e.id === event.id
                        ? { ...e, start: scheduledAt }
                        : e
                )
            );
            setCalendarScripts((prev) =>
                prev.map((s) => (s.id === Number(event.id) ? { ...s, scheduled_at: scheduledAt } : s))
            );
            toast.success('Script rescheduled.');
        } catch (e) {
            arg.revert();
            toast.error('Network error while rescheduling.');
        }
    };

    const handleEventClick = (arg: any) => {
        // Only treat as double-click to avoid interfering with drag
        if (arg.jsEvent?.detail !== 2) return;
        arg.jsEvent.preventDefault();
        const uuid: string | undefined = arg.event?.extendedProps?.uuid as string | undefined;
        if (!uuid) return;
        const url = tenantRouter.route('script.edit', { script: uuid });
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const summary = (() => {
        if (!currentRange) return { planned: 0, published: 0, shot: 0, ready: 0, longForm: 0, shorts: 0 };
        const { start, end } = currentRange;
        // Restrict to the displayed calendar month (FullCalendar range includes adjacent weeks)
        const mid = new Date(start.getTime() + (end.getTime() - start.getTime()) / 2);
        const viewYear = mid.getFullYear();
        const viewMonth = mid.getMonth();
        const monthStart = new Date(viewYear, viewMonth, 1);
        const monthEnd = new Date(viewYear, viewMonth + 1, 0, 23, 59, 59, 999);
        const inRange = calendarScripts.filter((s) => {
            if (!s.scheduled_at) return false;
            const d = new Date(s.scheduled_at);
            return d >= monthStart && d <= monthEnd;
        });
        const planned = inRange.length;
        const published = inRange.filter((s) => s.status === 'published').length;
        const shot = inRange.filter((s) =>
            s.production_status && ['shot', 'editing', 'edited'].includes(s.production_status) && s.status !== 'published'
        ).length;
        const ready = inRange.filter(
            (s) => s.production_status === 'edited' && s.status !== 'published'
        ).length;
        const longForm = inRange.filter((s) => s.script_type === 'Long Form').length;
        const shorts = inRange.filter((s) => s.script_type === 'Shorts').length;
        return { planned, published, shot, ready, longForm, shorts };
    })();

    const getEventStyleClass = (status: string, productionStatus?: string | null): string => {
        if (status === 'published') {
            // Published: light red background, deeper red text
            return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
        }
        // Not yet published
        if (!productionStatus || productionStatus === 'not_shot') {
            // Planned (written, not shot)
            return 'bg-muted text-muted-foreground';
        }
        if (productionStatus === 'shot' || productionStatus === 'editing') {
            // Shot / in editing: grey with yellow bottom border
            return 'bg-muted text-muted-foreground border-b border-yellow-400';
        }
        if (productionStatus === 'edited') {
            // Fully edited, ready: grey with green bottom border
            return 'bg-muted text-muted-foreground border-b border-emerald-500';
        }
        return 'bg-muted text-muted-foreground';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Script calendar" />
            <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
                <div className="mb-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="icon">
                            <Link href={tenantRouter.route('script.index')}>
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <h1 className="text-xl font-semibold md:text-2xl">Script calendar</h1>
                    </div>
                </div>

                <Card>
                    <CardHeader className="pb-2">
                        <p className="text-sm text-muted-foreground">
                            Drag a script to a new date to change its scheduled time.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="script-calendar">
                            <FullCalendar
                                plugins={[dayGridPlugin, interactionPlugin]}
                                initialView="dayGridMonth"
                                editable
                                droppable={false}
                                events={events}
                                eventDrop={handleEventDrop}
                                datesSet={(arg) => setCurrentRange({ start: arg.start, end: arg.end })}
                                eventClick={handleEventClick}
                                height="auto"
                                dayMaxEvents
                                displayEventTime={false}
                                eventContent={(arg) => {
                                    const s = arg.event.extendedProps.status as string | undefined;
                                    const p = arg.event.extendedProps.production_status as string | undefined;
                                    const scriptType = arg.event.extendedProps.script_type as string | undefined;
                                    const extra = getEventStyleClass(s ?? '', p);
                                    const typeLabel = scriptType === 'Shorts' ? 'Shorts' : scriptType === 'Long Form' ? 'Long' : scriptType ?? null;
                                    const typeBorderClass = scriptType === 'Shorts'
                                        ? 'border-l-2 border-l-blue-500'
                                        : scriptType === 'Long Form'
                                            ? 'border-l-2 border-l-pink-500'
                                            : '';
                                    return (
                                        <div className={`fc-script-event-title ${extra} ${typeBorderClass}`}>
                                            <span>{arg.event.title}</span>
                                            {typeLabel && <span className="ml-1 opacity-80 text-[10px]">· {typeLabel}</span>}
                                        </div>
                                    );
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                    <span className="inline-block rounded px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
                        Planned: {summary.planned}
                    </span>
                    <span className="inline-block rounded px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                        Published: {summary.published}
                    </span>
                    <span className="inline-block rounded px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground border-b-2 border-yellow-400">
                        Shot: {summary.shot}
                    </span>
                    <span className="inline-block rounded px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground border-b-2 border-emerald-500">
                        Ready: {summary.ready}
                    </span>
                    <span className="inline-block rounded px-2 py-0.5 text-xs font-medium text-muted-foreground border-l-2 border-pink-500 pl-2">
                        Long Form: {summary.longForm}
                    </span>
                    <span className="inline-block rounded px-2 py-0.5 text-xs font-medium text-muted-foreground border-l-2 border-blue-500 pl-2">
                        Shorts: {summary.shorts}
                    </span>
                </div>
                <style>{`
                    .script-calendar .fc-daygrid-event {
                        white-space: normal;
                    }
                    .script-calendar .fc-script-event-title {
                        white-space: normal;
                        font-size: 0.75rem;
                        line-height: 1rem;
                        display: inline-block;
                        padding: 2px 4px;
                        border-radius: 4px;
                    }
                `}</style>
            </div>
        </AppLayout>
    );
}

