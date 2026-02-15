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
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
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
        </div>
    );
}

