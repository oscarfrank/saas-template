import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import { useForm, Link, usePage } from '@inertiajs/react';
import { useLayoutEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SCHEDULE_KIND_OPTIONS, WEEKDAY_OPTIONS } from './schedule-presets';

export type DepartmentOption = { id: number; name: string };
export type GoalOption = { id: number; uuid: string; title: string };
export type WorkerOption = { id: number; uuid: string; name: string };
export type ProjectOption = { id: number; name: string };
export type ReportingOption = { id: number; label: string; kind: string };
export type CapabilityOption = { value: string; label: string };
export type ScopeOption = { value: string; label: string };

export type LlmMeta = {
    openai_key_configured: boolean;
    anthropic_key_configured: boolean;
    default_openai_model: string;
    default_anthropic_model: string;
    openai_model_options: { id: string; label: string }[];
    anthropic_model_options: { id: string; label: string }[];
};

export type WorkerFormFields = {
    name: string;
    /** hr_departments.id as string for controlled Select */
    department_id: string;
    reports_to_staff_id: string;
    skills: string;
    capabilities: string[];
    organization_goal_ids: number[];
    schedule_kind: string;
    schedule_time: string;
    schedule_day_of_week: string;
    schedule_cron_custom: string;
    schedule_timezone: string;
    input_scope: string;
    input_worker_agent_ids: number[];
    input_project_ids: number[];
    automation_enabled: boolean;
    requires_approval: boolean;
    max_runs_per_hour: string;
    daily_llm_budget_cents: string;
    enabled: boolean;
    llm_provider: string;
    chat_model: string;
};

function toggleNum(list: number[], id: number): number[] {
    return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

function toggleStr(list: string[], v: string): string[] {
    return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

const WORKER_AGENT_FORM_DEFAULTS: WorkerFormFields = {
    name: '',
    department_id: '',
    reports_to_staff_id: '',
    skills: '',
    capabilities: [],
    organization_goal_ids: [],
    schedule_kind: 'off',
    schedule_time: '09:00',
    schedule_day_of_week: '1',
    schedule_cron_custom: '',
    schedule_timezone: 'UTC',
    input_scope: 'all_workers',
    input_worker_agent_ids: [],
    input_project_ids: [],
    automation_enabled: true,
    requires_approval: false,
    max_runs_per_hour: '',
    daily_llm_budget_cents: '',
    enabled: true,
    llm_provider: 'openai',
    chat_model: '',
};

function mergeWorkerFormState(workerForm: Partial<WorkerFormFields> | undefined): WorkerFormFields {
    const w = workerForm ?? {};
    const merged: WorkerFormFields = { ...WORKER_AGENT_FORM_DEFAULTS, ...w };

    // JSON may deserialize nulls; keep controlled inputs as strings / defined arrays.
    merged.name = merged.name ?? '';
    merged.skills = merged.skills ?? '';
    merged.department_id =
        w.department_id != null && String(w.department_id) !== '' ? String(w.department_id) : '';
    merged.schedule_time = merged.schedule_time ?? '09:00';
    merged.schedule_cron_custom = merged.schedule_cron_custom ?? '';
    merged.schedule_timezone = merged.schedule_timezone ?? 'UTC';
    merged.schedule_kind = merged.schedule_kind ?? 'off';
    merged.input_scope = merged.input_scope ?? 'all_workers';
    merged.max_runs_per_hour = merged.max_runs_per_hour ?? '';
    merged.daily_llm_budget_cents = merged.daily_llm_budget_cents ?? '';
    merged.llm_provider = merged.llm_provider ?? 'openai';
    merged.chat_model = merged.chat_model ?? '';
    merged.capabilities = Array.isArray(merged.capabilities) ? merged.capabilities : [];
    merged.organization_goal_ids = Array.isArray(merged.organization_goal_ids) ? merged.organization_goal_ids : [];
    merged.input_worker_agent_ids = Array.isArray(merged.input_worker_agent_ids) ? merged.input_worker_agent_ids : [];
    merged.input_project_ids = Array.isArray(merged.input_project_ids) ? merged.input_project_ids : [];
    if (typeof merged.automation_enabled !== 'boolean') {
        merged.automation_enabled = WORKER_AGENT_FORM_DEFAULTS.automation_enabled;
    }
    if (typeof merged.requires_approval !== 'boolean') {
        merged.requires_approval = WORKER_AGENT_FORM_DEFAULTS.requires_approval;
    }
    if (typeof merged.enabled !== 'boolean') {
        merged.enabled = WORKER_AGENT_FORM_DEFAULTS.enabled;
    }

    merged.reports_to_staff_id =
        w.reports_to_staff_id != null && w.reports_to_staff_id !== '' ? String(w.reports_to_staff_id) : '';
    merged.schedule_day_of_week = String(w.schedule_day_of_week ?? merged.schedule_day_of_week ?? '1');
    return merged;
}

export function WorkerAgentForm({
    mode,
    departments,
    goals,
    projects,
    reportingOptions,
    otherWorkers,
    capabilityOptions,
    inputScopeOptions,
    llm,
    workerForm,
    currentWorkerId,
    workerUuid,
}: {
    mode: 'create' | 'edit';
    departments: DepartmentOption[];
    goals: GoalOption[];
    projects: ProjectOption[];
    reportingOptions: ReportingOption[];
    otherWorkers: WorkerOption[];
    capabilityOptions: CapabilityOption[];
    inputScopeOptions: ScopeOption[];
    llm: LlmMeta;
    /** Server state for edit; omit or {} for create. */
    workerForm?: Partial<WorkerFormFields>;
    currentWorkerId?: number;
    workerUuid?: string;
}) {
    const tenantRouter = useTenantRouter();
    const pageProps = usePage().props as {
        workerForm?: Partial<WorkerFormFields>;
        worker_form?: Partial<WorkerFormFields>;
        worker?: { uuid?: string };
    };

    /** Prefer explicit prop; fall back to full page props (avoids missed drilling / SSR quirks). */
    const resolvedWorkerForm = workerForm ?? pageProps.workerForm ?? pageProps.worker_form;

    /** Route key for PUT — must match worker_agents.uuid; fall back to page `worker.uuid`. */
    const workerAgentRouteUuid = workerUuid ?? pageProps.worker?.uuid;
    const editFormSignature = mode === 'edit' ? JSON.stringify(resolvedWorkerForm ?? {}) : '';

    const { data, setData, post, put, processing, errors, transform } = useForm<WorkerFormFields>(WORKER_AGENT_FORM_DEFAULTS);

    useLayoutEffect(() => {
        if (mode !== 'edit') {
            return;
        }
        setData(mergeWorkerFormState(resolvedWorkerForm));
        // eslint-disable-next-line react-hooks/exhaustive-deps -- sync when serialized payload from Inertia changes
    }, [mode, editFormSignature, setData]);

    transform((raw) => ({
        ...raw,
        department_id: raw.department_id === '' ? null : Number(raw.department_id),
        reports_to_staff_id: raw.reports_to_staff_id === '' ? null : Number(raw.reports_to_staff_id),
        schedule_day_of_week: raw.schedule_kind === 'weekly' ? Number(raw.schedule_day_of_week) : null,
        max_runs_per_hour: raw.max_runs_per_hour === '' ? null : Number(raw.max_runs_per_hour),
        daily_llm_budget_cents: raw.daily_llm_budget_cents === '' ? null : Number(raw.daily_llm_budget_cents),
        input_worker_agent_ids: raw.input_scope === 'selected_workers' ? raw.input_worker_agent_ids : [],
    }));

    const subscriptionWorkers = currentWorkerId ? otherWorkers.filter((w) => w.id !== currentWorkerId) : otherWorkers;

    const modelOptions = data.llm_provider === 'anthropic' ? llm.anthropic_model_options : llm.openai_model_options;
    const llmReady = data.llm_provider === 'anthropic' ? llm.anthropic_key_configured : llm.openai_key_configured;

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (mode === 'create') {
            post(tenantRouter.route('worker-agents.store'));
        } else if (workerAgentRouteUuid) {
            put(tenantRouter.route('worker-agents.update', { worker_agent: workerAgentRouteUuid }));
        }
    };

    const goalsUrl = tenantRouter.route('hr.goals.index');
    const departmentsUrl = tenantRouter.route('hr.departments.index');

    return (
        <form onSubmit={submit} className="space-y-8">
            {!llmReady && (
                <Alert variant="destructive">
                    <AlertTitle>LLM not configured</AlertTitle>
                    <AlertDescription>
                        Add API keys in your environment and tune models under Cortex → agent settings. Runs will still queue but full execution needs
                        keys.
                    </AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Identity</CardTitle>
                    <CardDescription>
                        Name and HR seat. Choose a department from the{' '}
                        <Link href={departmentsUrl} className="text-primary underline underline-offset-4">
                            HR catalog
                        </Link>
                        .
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                        {errors.name && <p className="text-destructive text-sm">{errors.name}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="department_id">Department (seat)</Label>
                        {departments.length === 0 ? (
                            <p className="text-muted-foreground text-sm">
                                No departments yet.{' '}
                                <Link href={departmentsUrl} className="text-primary underline underline-offset-4">
                                    Add departments in HR
                                </Link>{' '}
                                first; otherwise the server will pick a default.
                            </p>
                        ) : (
                            <Select
                                value={data.department_id || 'none'}
                                onValueChange={(v) => setData('department_id', v === 'none' ? '' : v)}
                            >
                                <SelectTrigger id="department_id">
                                    <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Not set (use server default)</SelectItem>
                                    {departments.map((d) => (
                                        <SelectItem key={d.id} value={String(d.id)}>
                                            {d.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        {errors.department_id && <p className="text-destructive text-sm">{errors.department_id}</p>}
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="reports_to">Reports to (optional)</Label>
                        <Select value={data.reports_to_staff_id || 'none'} onValueChange={(v) => setData('reports_to_staff_id', v === 'none' ? '' : v)}>
                            <SelectTrigger id="reports_to">
                                <SelectValue placeholder="Nobody — top of chain" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Nobody (top of chain)</SelectItem>
                                {reportingOptions.map((r) => (
                                    <SelectItem key={r.id} value={String(r.id)}>
                                        {r.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-muted-foreground text-xs">Same hierarchy as HR staff: managers, CEO, etc.</p>
                        {errors.reports_to_staff_id && <p className="text-destructive text-sm">{errors.reports_to_staff_id}</p>}
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="skills">Skills (description)</Label>
                        <Textarea id="skills" value={data.skills} onChange={(e) => setData('skills', e.target.value)} rows={3} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Capabilities</CardTitle>
                    <CardDescription>Machine-readable gates for future tools (calendar, HR, workers).</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                    {capabilityOptions.map((c) => (
                        <label key={c.value} className="flex cursor-pointer items-center gap-2 text-sm">
                            <Checkbox
                                checked={data.capabilities.includes(c.value)}
                                onCheckedChange={() => setData('capabilities', toggleStr(data.capabilities, c.value))}
                            />
                            {c.label}
                        </label>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Organization goals</CardTitle>
                    <CardDescription>
                        Align with HR goals. Manage goals in <Link href={goalsUrl}>HR → Goals</Link>.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    {goals.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No active goals yet.</p>
                    ) : (
                        goals.map((g) => (
                            <label key={g.id} className="flex cursor-pointer items-center gap-2 text-sm">
                                <Checkbox
                                    checked={data.organization_goal_ids.includes(g.id)}
                                    onCheckedChange={() => setData('organization_goal_ids', toggleNum(data.organization_goal_ids, g.id))}
                                />
                                {g.title}
                            </label>
                        ))
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Automation</CardTitle>
                    <CardDescription>
                        Pick how often this worker runs. The app converts it to a schedule for the server (checked every minute). Times use the
                        timezone below.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                        <Label>Frequency</Label>
                        <Select value={data.schedule_kind} onValueChange={(v) => setData('schedule_kind', v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {SCHEDULE_KIND_OPTIONS.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>
                                        {o.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {(data.schedule_kind === 'daily' || data.schedule_kind === 'weekly') && (
                        <div className="space-y-2">
                            <Label htmlFor="schedule_time">Time</Label>
                            <Input
                                id="schedule_time"
                                type="time"
                                value={data.schedule_time}
                                onChange={(e) => setData('schedule_time', e.target.value)}
                            />
                        </div>
                    )}
                    {data.schedule_kind === 'weekly' && (
                        <div className="space-y-2">
                            <Label>Day of week</Label>
                            <Select value={data.schedule_day_of_week} onValueChange={(v) => setData('schedule_day_of_week', v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {WEEKDAY_OPTIONS.map((d) => (
                                        <SelectItem key={d.value} value={d.value}>
                                            {d.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="schedule_timezone">Timezone (for daily / weekly)</Label>
                        <Input
                            id="schedule_timezone"
                            placeholder="UTC, America/New_York, Europe/London…"
                            value={data.schedule_timezone}
                            onChange={(e) => setData('schedule_timezone', e.target.value)}
                        />
                    </div>
                    {data.schedule_kind === 'custom' && (
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="schedule_cron_custom">Cron expression (5 fields)</Label>
                            <Input
                                id="schedule_cron_custom"
                                placeholder="0 * * * *"
                                value={data.schedule_cron_custom}
                                onChange={(e) => setData('schedule_cron_custom', e.target.value)}
                            />
                            {errors.schedule_cron_custom && <p className="text-destructive text-sm">{errors.schedule_cron_custom}</p>}
                        </div>
                    )}
                    <label className="flex items-center gap-2 text-sm md:col-span-2">
                        <Checkbox checked={data.automation_enabled} onCheckedChange={(v) => setData('automation_enabled', !!v)} />
                        Automation enabled (queue scheduled runs when frequency is set)
                    </label>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Inputs</CardTitle>
                    <CardDescription>Which other workers feed context for this agent (handoffs / analysis).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Input scope</Label>
                        <Select value={data.input_scope} onValueChange={(v) => setData('input_scope', v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {inputScopeOptions.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>
                                        {o.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {data.input_scope === 'selected_workers' && (
                        <div className="space-y-2">
                            <Label>Subscribe to workers</Label>
                            {subscriptionWorkers.length === 0 ? (
                                <p className="text-muted-foreground text-sm">No other workers yet.</p>
                            ) : (
                                subscriptionWorkers.map((w) => (
                                    <label key={w.id} className="flex cursor-pointer items-center gap-2 text-sm">
                                        <Checkbox
                                            checked={data.input_worker_agent_ids.includes(w.id)}
                                            onCheckedChange={() =>
                                                setData('input_worker_agent_ids', toggleNum(data.input_worker_agent_ids, w.id))
                                            }
                                        />
                                        {w.name}
                                    </label>
                                ))
                            )}
                            {errors.input_worker_agent_ids && (
                                <p className="text-destructive text-sm">{errors.input_worker_agent_ids}</p>
                            )}
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label>Limit to projects (optional)</Label>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {projects.map((p) => (
                                <label key={p.id} className="flex cursor-pointer items-center gap-2 text-sm">
                                    <Checkbox
                                        checked={data.input_project_ids.includes(p.id)}
                                        onCheckedChange={() => setData('input_project_ids', toggleNum(data.input_project_ids, p.id))}
                                    />
                                    {p.name}
                                </label>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Policy & LLM</CardTitle>
                    <CardDescription>Approvals, rate limits, and model overrides for this worker.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <label className="flex items-center gap-2 text-sm md:col-span-2">
                        <Checkbox checked={data.enabled} onCheckedChange={(v) => setData('enabled', !!v)} />
                        Enabled
                    </label>
                    <label className="flex items-center gap-2 text-sm md:col-span-2">
                        <Checkbox checked={data.requires_approval} onCheckedChange={(v) => setData('requires_approval', !!v)} />
                        Require approval for high-impact actions (future)
                    </label>
                    <div className="space-y-2">
                        <Label htmlFor="max_runs">Max runs / hour</Label>
                        <Input
                            id="max_runs"
                            type="number"
                            min={1}
                            max={120}
                            value={data.max_runs_per_hour}
                            onChange={(e) => setData('max_runs_per_hour', e.target.value)}
                            placeholder="Unlimited"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="budget">Daily LLM budget (cents)</Label>
                        <Input
                            id="budget"
                            type="number"
                            min={0}
                            value={data.daily_llm_budget_cents}
                            onChange={(e) => setData('daily_llm_budget_cents', e.target.value)}
                            placeholder="Optional"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Provider</Label>
                        <Select value={data.llm_provider} onValueChange={(v) => setData('llm_provider', v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="openai">OpenAI</SelectItem>
                                <SelectItem value="anthropic">Anthropic</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Model</Label>
                        <Select
                            value={data.chat_model || (data.llm_provider === 'anthropic' ? llm.default_anthropic_model : llm.default_openai_model)}
                            onValueChange={(v) => setData('chat_model', v)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {modelOptions.map((m) => (
                                    <SelectItem key={m.id} value={m.id}>
                                        {m.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={processing}>
                    {mode === 'create' ? 'Create worker' : 'Save changes'}
                </Button>
                <Button type="button" variant="outline" asChild>
                    <Link href={mode === 'create' ? tenantRouter.route('worker-agents.index') : tenantRouter.route('worker-agents.show', { worker_agent: workerUuid! })}>
                        Cancel
                    </Link>
                </Button>
            </div>
        </form>
    );
}
