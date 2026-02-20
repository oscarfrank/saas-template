import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import { Plus, Search, ChevronLeft, ChevronRight, LayoutGrid, Calendar, Columns3, Users, FolderKanban } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { toast } from 'sonner';

export type TaskItem = {
    id: number;
    uuid: string;
    title: string;
    status: string;
    priority: string | null;
    due_at: string | null;
    completed_at: string | null;
    project?: { id: number; name: string };
    assignee?: { id: number; user?: { first_name: string; last_name: string } };
    script?: { id: number; title: string; scheduled_at: string | null };
    blocked_by_task?: { id: number; uuid: string; title: string; status: string } | null;
};

type ViewType = 'table' | 'calendar' | 'board' | 'by_staff' | 'by_project';

interface Props {
    tasks: { data: TaskItem[]; current_page: number; last_page: number; total: number } | null;
    allTasks: TaskItem[] | null;
    staffOptions: { id: number; name: string }[];
    projectOptions: { id: number; name: string }[];
    filters: Record<string, unknown> & { view?: ViewType; show_completed?: string };
    /** 'all' = see everyone's tasks; 'mine' = only tasks assigned to me */
    tasksView?: 'all' | 'mine';
    /** Current user's staff id in this tenant */
    currentStaffId?: number | null;
    /** Admin: can edit, reschedule, delete any task. If false, user can only change status on their own tasks. */
    canManageAnyTask?: boolean;
}

const STATUS_COLUMNS: { key: string; label: string }[] = [
    { key: 'todo', label: 'To do' },
    { key: 'in_progress', label: 'In progress' },
    { key: 'done', label: 'Done' },
    { key: 'cancelled', label: 'Cancelled' },
];

function assigneeName(t: TaskItem): string {
    return t.assignee?.user
        ? `${t.assignee.user.first_name || ''} ${t.assignee.user.last_name || ''}`.trim() || '—'
        : '—';
}

export default function HRTasksIndex({ tasks, allTasks, staffOptions, projectOptions, filters, tasksView = 'all', currentStaffId = null, canManageAnyTask = false }: Props) {
    const tenantRouter = useTenantRouter();
    const currentView = (filters.view as ViewType) || 'table';
    const [boardTasks, setBoardTasks] = useState<TaskItem[]>(() => allTasks ?? []);
    useEffect(() => {
        if (currentView === 'board' && allTasks) setBoardTasks(allTasks);
    }, [currentView, allTasks]);
    const allTasksForViews = currentView === 'board' ? boardTasks : (allTasks ?? []);
    const isAssignee = (t: TaskItem) => currentStaffId != null && t.assignee?.id === currentStaffId;
    const canManageTask = (_t: TaskItem) => canManageAnyTask;
    const canUpdateStatus = (t: TaskItem) => canManageAnyTask || isAssignee(t);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'HR', href: tenantRouter.route('hr.staff.index') },
        { title: 'Tasks', href: tenantRouter.route('hr.tasks.index') },
    ];

    const setView = (view: ViewType) => {
        tenantRouter.get('hr.tasks.index', { ...filters, view, page: undefined });
    };

    const calendarEventsFromTasks = useMemo(() => {
        return (allTasks ?? [])
            .filter((t) => t.due_at)
            .map((t) => ({
                id: String(t.id),
                title: t.title,
                start: t.due_at!,
                allDay: false,
                extendedProps: { taskUuid: t.uuid, status: t.status },
            }));
    }, [allTasks]);

    const [calendarEvents, setCalendarEvents] = useState(calendarEventsFromTasks);
    useEffect(() => {
        setCalendarEvents(calendarEventsFromTasks);
    }, [calendarEventsFromTasks]);

    const handleEventClick = (arg: { event: { extendedProps: Record<string, unknown> } }) => {
        const taskUuid = arg.event.extendedProps.taskUuid as string | undefined;
        if (taskUuid) router.visit(tenantRouter.route('hr.tasks.show', { task: taskUuid }));
    };

    const handleCalendarEventDrop = async (arg: { event: { id: string; start: Date | null; extendedProps: Record<string, unknown> }; revert: () => void }) => {
        const taskUuid = arg.event.extendedProps.taskUuid as string | undefined;
        const start = arg.event.start;
        if (!taskUuid || !start) {
            arg.revert();
            return;
        }
        const task = allTasks?.find((t) => t.uuid === taskUuid);
        if (!task || !canManageTask(task)) {
            arg.revert();
            toast.error('Only admins can reschedule tasks.');
            return;
        }
        const dueAt = start.toISOString();
        const url = tenantRouter.route('hr.tasks.update-due', { task: taskUuid });
        const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
        try {
            const res = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ due_at: dueAt }),
            });
            if (!res.ok) {
                arg.revert();
                const data = await res.json().catch(() => ({}));
                toast.error((data as { message?: string }).message ?? 'Failed to update due date.');
                return;
            }
            setCalendarEvents((prev) =>
                prev.map((e) => (e.id === arg.event.id ? { ...e, start: dueAt } : e))
            );
            toast.success('Due date updated.');
        } catch {
            arg.revert();
            toast.error('Network error.');
        }
    };

    const handleBoardDrop = async (taskUuid: string, newStatus: string) => {
        const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
        const url = tenantRouter.route('hr.tasks.update-status', { task: taskUuid });
        try {
            const res = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) {
                toast.error('Failed to update status');
                return;
            }
            const data = await res.json();
            setBoardTasks((prev) =>
                prev.map((t) => (t.uuid === taskUuid ? { ...t, status: newStatus, completed_at: newStatus === 'done' ? new Date().toISOString() : null } : t))
            );
            toast.success('Status updated');
        } catch {
            toast.error('Network error');
        }
    };

    const tasksByStaff = useMemo(() => {
        const map = new Map<number | 'unassigned', { name: string; tasks: TaskItem[] }>();
        map.set('unassigned', { name: 'Unassigned', tasks: [] });
        staffOptions.forEach((s) => map.set(s.id, { name: s.name, tasks: [] }));
        allTasksForViews.forEach((t) => {
            const staffId = t.assignee?.id ?? null;
            const entry = staffId != null ? map.get(staffId) : map.get('unassigned');
            if (entry) entry.tasks.push(t);
            else if (staffId != null) map.set(staffId, { name: assigneeName(t), tasks: [t] });
            else map.get('unassigned')!.tasks.push(t);
        });
        return Array.from(map.entries()).filter(([, v]) => v.tasks.length > 0 || v.name === 'Unassigned');
    }, [allTasksForViews, staffOptions]);

    const tasksByProject = useMemo(() => {
        const map = new Map<number | 'none', { name: string; tasks: TaskItem[] }>();
        map.set('none', { name: 'No project', tasks: [] });
        projectOptions.forEach((p) => map.set(p.id, { name: p.name, tasks: [] }));
        allTasksForViews.forEach((t) => {
            const key = t.project?.id ?? 'none';
            const entry = map.get(key as number);
            if (entry) entry.tasks.push(t);
            else map.set(key as 'none', { name: t.project?.name ?? 'No project', tasks: [t] });
        });
        return Array.from(map.entries()).filter(([, v]) => v.tasks.length > 0);
    }, [allTasksForViews, projectOptions]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="HR – Tasks" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-semibold">Tasks</h1>
                    <div className="flex flex-wrap items-center gap-2">
                        <form
                            className="flex gap-2"
                            onSubmit={(e) => {
                                e.preventDefault();
                                const q = (e.currentTarget.querySelector('input[name="search"]') as HTMLInputElement)?.value;
                                tenantRouter.get('hr.tasks.index', { search: q || undefined, ...filters, view: currentView });
                            }}
                        >
                            <Input name="search" placeholder="Search..." defaultValue={(filters.search as string) || ''} className="max-w-xs" />
                            <Button type="submit" variant="secondary" size="icon">
                                <Search className="h-4 w-4" />
                            </Button>
                        </form>
                        {(currentView === 'table' || currentView === 'board' || currentView === 'by_staff' || currentView === 'by_project') && (
                            <Select
                                value={(filters.show_completed as string) || 'active'}
                                onValueChange={(value) => {
                                    tenantRouter.get('hr.tasks.index', { ...filters, show_completed: value === 'active' ? undefined : value, view: currentView, page: undefined });
                                }}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Show completed" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active only</SelectItem>
                                    <SelectItem value="last_month">+ Completed (last month)</SelectItem>
                                    <SelectItem value="last_3_months">+ Completed (last 3 months)</SelectItem>
                                    <SelectItem value="all">All time</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                        {(tasksView === 'all' || currentStaffId != null) && (
                            <Button asChild>
                                <Link href={tenantRouter.route('hr.tasks.create')}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    New task
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                <Tabs value={currentView} onValueChange={(v) => setView(v as ViewType)}>
                    <TabsList className="grid w-full max-w-lg grid-cols-5">
                        <TabsTrigger value="table" className="gap-1.5">
                            <LayoutGrid className="h-4 w-4" />
                            <span className="hidden sm:inline">Table</span>
                        </TabsTrigger>
                        <TabsTrigger value="calendar" className="gap-1.5">
                            <Calendar className="h-4 w-4" />
                            <span className="hidden sm:inline">Calendar</span>
                        </TabsTrigger>
                        <TabsTrigger value="board" className="gap-1.5">
                            <Columns3 className="h-4 w-4" />
                            <span className="hidden sm:inline">Board</span>
                        </TabsTrigger>
                        <TabsTrigger value="by_staff" className="gap-1.5">
                            <Users className="h-4 w-4" />
                            <span className="hidden sm:inline">By staff</span>
                        </TabsTrigger>
                        <TabsTrigger value="by_project" className="gap-1.5">
                            <FolderKanban className="h-4 w-4" />
                            <span className="hidden sm:inline">By project</span>
                        </TabsTrigger>
                    </TabsList>

                    <div className="mt-4">
                        {currentView === 'table' && (
                            <Card>
                                <CardHeader>
                                    <h2 className="text-lg font-medium">All tasks</h2>
                                </CardHeader>
                                <CardContent>
                                    {!tasks || tasks.data.length === 0 ? (
                                        <p className="text-muted-foreground py-8 text-center">No tasks yet.</p>
                                    ) : (
                                        <>
                                            <div className="rounded-md border">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="border-b bg-muted/50">
                                                            <th className="p-3 text-left font-medium">Title</th>
                                                            <th className="p-3 text-left font-medium">Project</th>
                                                            <th className="p-3 text-left font-medium">Assignee</th>
                                                            <th className="p-3 text-left font-medium">Status</th>
                                                            <th className="p-3 text-left font-medium">Due</th>
                                                            <th className="p-3 text-left font-medium">Blocked by</th>
                                                            <th className="p-3 text-right font-medium"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {tasks.data.map((t) => (
                                                            <tr key={t.id} className="border-b last:border-0">
                                                                <td className="p-3">{t.title}</td>
                                                                <td className="p-3">{t.project?.name ?? '—'}</td>
                                                                <td className="p-3">{assigneeName(t)}</td>
                                                                <td className="p-3">
                                                                    <Badge variant={t.status === 'done' ? 'secondary' : 'default'}>{t.status}</Badge>
                                                                </td>
                                                                <td className="p-3">{t.due_at ? new Date(t.due_at).toLocaleDateString() : '—'}</td>
                                                                <td className="p-3">
                                                                    {t.blocked_by_task ? (
                                                                        <Link
                                                                            href={tenantRouter.route('hr.tasks.show', { task: t.blocked_by_task.uuid })}
                                                                            className="text-amber-600 dark:text-amber-400 hover:underline text-sm"
                                                                        >
                                                                            {t.blocked_by_task.title}
                                                                        </Link>
                                                                    ) : (
                                                                        '—'
                                                                    )}
                                                                </td>
                                                                <td className="p-3 text-right">
                                                                    <Button variant="ghost" size="sm" asChild>
                                                                        <Link href={tenantRouter.route('hr.tasks.show', { task: t.uuid })}>View</Link>
                                                                    </Button>
                                                                    {canManageTask(t) && (
                                                                        <Button variant="ghost" size="sm" asChild>
                                                                            <Link href={tenantRouter.route('hr.tasks.edit', { task: t.uuid })}>Edit</Link>
                                                                        </Button>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            {tasks.last_page > 1 && (
                                                <div className="mt-4 flex items-center justify-between">
                                                    <p className="text-sm text-muted-foreground">
                                                        Page {tasks.current_page} of {tasks.last_page}
                                                    </p>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={tasks.current_page <= 1}
                                                            onClick={() =>
                                                                tenantRouter.get('hr.tasks.index', { ...filters, view: 'table', page: tasks.current_page - 1 })
                                                            }
                                                        >
                                                            <ChevronLeft className="h-4 w-4" /> Previous
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={tasks.current_page >= tasks.last_page}
                                                            onClick={() =>
                                                                tenantRouter.get('hr.tasks.index', { ...filters, view: 'table', page: tasks.current_page + 1 })
                                                            }
                                                        >
                                                            Next <ChevronRight className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {currentView === 'calendar' && (
                            <Card>
                                <CardHeader>
                                    <h2 className="text-lg font-medium">Tasks by due date</h2>
                                    <p className="text-muted-foreground text-sm">Tasks with a due date appear on the calendar. Click an event to open the task.</p>
                                </CardHeader>
                                <CardContent>
                                    <div className="hr-tasks-calendar">
                                        <FullCalendar
                                            plugins={[dayGridPlugin, interactionPlugin]}
                                            initialView="dayGridMonth"
                                            events={calendarEvents}
                                            editable={canManageAnyTask}
                                            eventClick={handleEventClick}
                                            eventDrop={handleCalendarEventDrop}
                                            height="auto"
                                            dayMaxEvents
                                            displayEventTime={false}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {currentView === 'board' && (
                            <Card>
                                <CardHeader>
                                    <h2 className="text-lg font-medium">Board</h2>
                                    <p className="text-muted-foreground text-sm">Drag cards between columns to update status.</p>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                                        {STATUS_COLUMNS.map((col) => {
                                            const columnTasks = allTasksForViews.filter((t) => t.status === col.key);
                                            return (
                                                <div
                                                    key={col.key}
                                                    className="rounded-lg border bg-muted/30 p-3"
                                                    onDragOver={(e) => e.preventDefault()}
                                                    onDrop={(e) => {
                                                        e.preventDefault();
                                                        const taskUuid = e.dataTransfer.getData('taskUuid');
                                                        if (taskUuid && col.key) handleBoardDrop(taskUuid, col.key);
                                                    }}
                                                >
                                                    <h3 className="mb-2 font-medium">
                                                        {col.label} <span className="text-muted-foreground">({columnTasks.length})</span>
                                                    </h3>
                                                    <div className="space-y-2">
                                                        {columnTasks.map((t) => (
                                                            <div
                                                                key={t.id}
                                                                draggable={canUpdateStatus(t)}
                                                                onDragStart={(e) => {
                                                                    if (!canUpdateStatus(t)) return;
                                                                    e.dataTransfer.setData('taskUuid', t.uuid);
                                                                    e.dataTransfer.effectAllowed = 'move';
                                                                }}
                                                                className={`rounded border bg-background p-3 shadow-sm ${canUpdateStatus(t) ? 'cursor-grab active:cursor-grabbing' : ''}`}
                                                            >
                                                                <Link
                                                                    href={tenantRouter.route('hr.tasks.show', { task: t.uuid })}
                                                                    className="font-medium hover:underline"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    {t.title}
                                                                </Link>
                                                                <p className="mt-1 text-muted-foreground text-xs">
                                                                    {assigneeName(t)}
                                                                    {t.due_at ? ` · Due ${new Date(t.due_at).toLocaleDateString()}` : ''}
                                                                </p>
                                                                {t.blocked_by_task && (
                                                                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                                                                        Blocked by: <Link href={tenantRouter.route('hr.tasks.show', { task: t.blocked_by_task.uuid })} className="hover:underline">{t.blocked_by_task.title}</Link>
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {currentView === 'by_staff' && (
                            <Card>
                                <CardHeader>
                                    <h2 className="text-lg font-medium">By staff</h2>
                                    <p className="text-muted-foreground text-sm">Tasks grouped by assignee.</p>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        {tasksByStaff.map(([key, { name, tasks: staffTaskList }]) => (
                                            <div key={String(key)}>
                                                <h3 className="mb-2 font-medium text-muted-foreground">{name}</h3>
                                                <ul className="space-y-2">
                                                    {staffTaskList.map((t) => (
                                                        <li key={t.id} className="flex items-center justify-between rounded border p-3">
                                                            <div>
                                                                <Link href={tenantRouter.route('hr.tasks.show', { task: t.uuid })} className="font-medium hover:underline">
                                                                    {t.title}
                                                                </Link>
                                                                <p className="text-muted-foreground text-sm">
                                                                    {t.project?.name ?? '—'} · {t.due_at ? new Date(t.due_at).toLocaleDateString() : 'No due date'}
                                                                </p>
                                                            </div>
                                                            <Badge variant={t.status === 'done' ? 'secondary' : 'default'}>{t.status}</Badge>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                        {tasksByStaff.length === 0 && (
                                            <p className="text-muted-foreground py-8 text-center">No tasks to group.</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {currentView === 'by_project' && (
                            <Card>
                                <CardHeader>
                                    <h2 className="text-lg font-medium">By project</h2>
                                    <p className="text-muted-foreground text-sm">Tasks grouped by project.</p>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        {tasksByProject.map(([key, { name, tasks: projectTaskList }]) => (
                                            <div key={String(key)}>
                                                <h3 className="mb-2 font-medium text-muted-foreground">{name}</h3>
                                                <ul className="space-y-2">
                                                    {projectTaskList.map((t) => (
                                                        <li key={t.id} className="flex items-center justify-between rounded border p-3">
                                                            <div>
                                                                <Link href={tenantRouter.route('hr.tasks.show', { task: t.uuid })} className="font-medium hover:underline">
                                                                    {t.title}
                                                                </Link>
                                                                <p className="text-muted-foreground text-sm">
                                                                    {assigneeName(t)} · {t.due_at ? new Date(t.due_at).toLocaleDateString() : 'No due date'}
                                                                </p>
                                                            </div>
                                                            <Badge variant={t.status === 'done' ? 'secondary' : 'default'}>{t.status}</Badge>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                        {tasksByProject.length === 0 && (
                                            <p className="text-muted-foreground py-8 text-center">No tasks to group.</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </Tabs>
                </div>
            </div>
            <style>{`
                .hr-tasks-calendar .fc-daygrid-event { white-space: normal; }
                .hr-tasks-calendar .fc-event-title { font-size: 0.75rem; }
            `}</style>
        </AppLayout>
    );
}
