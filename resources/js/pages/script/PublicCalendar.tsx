import { Head } from '@inertiajs/react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useState } from 'react';

interface ScriptCalendarItem {
    id: number;
    uuid: string;
    title: string;
    scheduled_at: string | null;
    status: string;
    script_type?: string | null;
    production_status?: string | null;
}

interface Props {
    scripts: ScriptCalendarItem[];
}

export default function PublicScriptCalendarPage({ scripts }: Props) {
    const [calendarScripts] = useState<ScriptCalendarItem[]>(scripts);
    const [currentRange, setCurrentRange] = useState<{ start: Date; end: Date } | null>(null);

    const events = scripts
        .filter((s) => s.scheduled_at)
        .map((s) => ({
            id: String(s.id),
            title: s.title,
            start: s.scheduled_at!,
            allDay: false,
            editable: false,
            extendedProps: {
                status: s.status,
                script_type: s.script_type,
                production_status: s.production_status,
            },
        }));

    const summary = (() => {
        if (!currentRange) return { planned: 0, published: 0, shot: 0, ready: 0 };
        const { start, end } = currentRange;
        const inRange = calendarScripts.filter((s) => {
            if (!s.scheduled_at) return false;
            const d = new Date(s.scheduled_at);
            return d >= start && d < end;
        });
        const planned = inRange.length;
        const published = inRange.filter((s) => s.status === 'published').length;
        const shot = inRange.filter((s) =>
            s.production_status && ['shot', 'editing', 'edited'].includes(s.production_status)
        ).length;
        const ready = inRange.filter(
            (s) => s.production_status === 'edited' && s.status !== 'published'
        ).length;
        return { planned, published, shot, ready };
    })();

    const getEventStyleClass = (status: string, productionStatus?: string | null): string => {
        if (status === 'published') {
            return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
        }
        if (!productionStatus || productionStatus === 'not_shot') {
            return 'bg-muted text-muted-foreground';
        }
        if (productionStatus === 'shot' || productionStatus === 'editing') {
            return 'bg-muted text-muted-foreground border-b border-yellow-400';
        }
        if (productionStatus === 'edited') {
            return 'bg-muted text-muted-foreground border-b border-emerald-500';
        }
        return 'bg-muted text-muted-foreground';
    };

    return (
        <div className="bg-background min-h-svh px-4 py-6 sm:px-6 md:px-10">
            <Head title="Production Publishing calendar" />
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
                <header className="flex flex-col gap-1 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                        Production Publishing calendar
                    </h1>
                    <p className="text-muted-foreground text-sm md:text-base">
                        Read-only view of upcoming and past scripts.
                    </p>
                </header>

                <div className="rounded-xl border bg-card p-4 shadow-sm">
                    <div className="script-calendar">
                        <FullCalendar
                            plugins={[dayGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            editable={false}
                            droppable={false}
                            events={events}
                            height="auto"
                            dayMaxEvents
                            displayEventTime={false}
                            datesSet={(arg) => setCurrentRange({ start: arg.start, end: arg.end })}
                            eventContent={(arg) => {
                                const s = arg.event.extendedProps.status as string | undefined;
                                const p = arg.event.extendedProps.production_status as string | undefined;
                                const extra = getEventStyleClass(s ?? '', p);
                                return (
                                    <div className={`fc-script-event-title ${extra}`}>
                                        {arg.event.title}
                                    </div>
                                );
                            }}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                    <span>
                        <span className="font-medium">Planned:</span> {summary.planned}
                    </span>
                    <span>
                        <span className="font-medium">Published:</span> {summary.published}
                    </span>
                    <span>
                        <span className="font-medium">Shot:</span> {summary.shot}
                    </span>
                    <span>
                        <span className="font-medium">Ready:</span> {summary.ready}
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
        </div>
    );
}

