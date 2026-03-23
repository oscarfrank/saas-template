import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AgentMarkdown } from '@/components/cortex/agent-markdown';

import { Loader2, Send, Calendar, Sparkles, Brain } from 'lucide-react';
import type React from 'react';

type NexusChatMessage = {
    role: 'user' | 'assistant';
    content: string;
};

type NexusCandidate = {
    key: string;
    script_id: number;
    script_title: string;
    action: string;
    assigned_to: number;
    assigned_to_name: string;
    due_at: string;
    recommended_due_at: string;
    priority: string;
    title: string;
    description: string;
};

interface Props {
    openAiConfigured: boolean;
    canApply: boolean;
}

function actionLabel(action: string): string {
    if (action === 'write_script') return 'Write script';
    if (action === 'shoot') return 'Shoot';
    if (action === 'edit') return 'Edit';
    if (action === 'finalize_edit') return 'Finalize edit';
    if (action === 'publish') return 'Publish';
    return action;
}

export default function NexusPlannerPage({ openAiConfigured, canApply }: Props) {
    const tenantRouter = useTenantRouter();

    const breadcrumbs: BreadcrumbItem[] = useMemo(
        () => [{ title: 'Cortex', href: tenantRouter.route('cortex.index') }, { title: 'Nexus planner', href: '' }],
        [tenantRouter],
    );

    const [messages, setMessages] = useState<NexusChatMessage[]>([]);
    const [candidates, setCandidates] = useState<NexusCandidate[]>([]);
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set());

    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const selectedCount = selectedKeys.size;

    const runChat = async (userMessage: string) => {
        setLoading(true);
        setError(null);

        try {
            const url = tenantRouter.route('cortex.agents.nexus.chat');
            const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

            const { data } = await axios.post<{
                assistant_message?: string;
                candidates?: NexusCandidate[];
                planning_range?: { start: string; end: string };
                message?: string;
            }>(
                url,
                {
                    message: userMessage,
                    history: messages,
                    selected_keys: Array.from(selectedKeys),
                },
                {
                    timeout: 300_000,
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrf,
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                },
            );

            const assistant = data.assistant_message ?? data.message ?? 'Plan updated.';
            const nextCandidates = data.candidates ?? [];

            setMessages((prev) => [
                ...prev,
                { role: 'user', content: userMessage },
                { role: 'assistant', content: assistant },
            ]);

            setCandidates(nextCandidates);
            setSelectedKeys((prev) => {
                const allowed = new Set(nextCandidates.map((c) => c.key));
                return new Set(Array.from(prev).filter((k) => allowed.has(k)));
            });
        } catch (e) {
            if (axios.isAxiosError(e)) {
                const msg = (e.response?.data as { message?: string } | undefined)?.message ?? e.message ?? 'Request failed.';
                setError(msg);
                toast.error(msg);
            } else {
                setError('Something went wrong.');
                toast.error('Something went wrong.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!openAiConfigured) return;
        if (messages.length > 0) return;
        void runChat('Plan the next 7 days workflow tasks. Propose HR task candidates.');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [openAiConfigured]);

    const toggleKey = (key: string, checked: boolean) => {
        setSelectedKeys((prev) => {
            const next = new Set(prev);
            if (checked) next.add(key);
            else next.delete(key);
            return next;
        });
    };

    const createTasks = async () => {
        if (!canApply) return;
        if (selectedKeys.size === 0) {
            toast.error('Select at least one candidate.');
            return;
        }

        const url = tenantRouter.route('cortex.agents.nexus.apply');
        const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

        const selectedCandidates = candidates.filter((c) => selectedKeys.has(c.key));

        setLoading(true);
        setError(null);
        try {
            const { data } = await axios.post<{
                message?: string;
                created?: { key: string; task_uuid: string; title: string }[];
                skipped?: { key: string; reason: string }[];
            }>(
                url,
                {
                    selected: selectedCandidates.map((c) => ({
                        key: c.key,
                        script_id: c.script_id,
                        action: c.action,
                        assigned_to: c.assigned_to,
                        title: c.title,
                        description: c.description,
                        priority: c.priority,
                    })),
                },
                {
                    timeout: 300_000,
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrf,
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                },
            );

            const createdCount = data.created?.length ?? 0;
            toast.success(`Created ${createdCount} HR task(s).`);
            if (data.skipped && data.skipped.length > 0) {
                toast.error(`Skipped ${data.skipped.length} duplicate(s).`);
            }

            // Clear selections and refresh plan after apply.
            setSelectedKeys(new Set());
            setInput('');
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: 'Tasks created. Refreshing the plan...' },
            ]);
            void runChat('Refresh the plan for next 7 days after tasks creation.');
        } catch (e) {
            if (axios.isAxiosError(e)) {
                const msg = (e.response?.data as { message?: string } | undefined)?.message ?? e.message ?? 'Request failed.';
                setError(msg);
                toast.error(msg);
            } else {
                setError('Something went wrong.');
                toast.error('Something went wrong.');
            }
        } finally {
            setLoading(false);
        }
    };

    const canUseAgent = openAiConfigured;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nexus planner - Cortex" />
            <div className="flex flex-col gap-6 p-4 md:p-6 lg:flex-row lg:gap-8">
                <div className="flex w-full flex-col gap-4 lg:w-1/2">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-md">
                                <Brain className="size-5" />
                            </div>
                            <h1 className="text-2xl font-semibold tracking-tight">Nexus planner</h1>
                        </div>
                        <p className="text-muted-foreground mt-2 text-sm">
                            Chat to refine the plan, then tick candidates to create HR tasks.
                        </p>
                    </div>

                    {!openAiConfigured && (
                        <Alert variant="destructive">
                            <AlertTitle>OpenAI not configured</AlertTitle>
                            <AlertDescription>Set OPENAI_API_KEY in your environment, then reload.</AlertDescription>
                        </Alert>
                    )}

                    <Card className="flex-1">
                        <CardHeader>
                            <CardTitle>Chat with Nexus</CardTitle>
                            <CardDescription>
                                Nexus keeps planning for the upcoming week unless you ask for a different range.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <div className="flex flex-col gap-3 max-h-[420px] overflow-auto">
                                {messages.length === 0 ? (
                                    <div className="text-muted-foreground text-sm">
                                        Nexus will generate a plan automatically.
                                    </div>
                                ) : (
                                    messages.map((m, idx) => (
                                        <div
                                            key={`${idx}-${m.role}`}
                                            className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
                                        >
                                            {m.role === 'user' ? (
                                                <div className="max-w-[80%] whitespace-pre-wrap rounded-lg bg-muted px-3 py-2 text-sm">{m.content}</div>
                                            ) : (
                                                <div className="max-w-[80%] rounded-lg border bg-card px-3 py-3">
                                                    <AgentMarkdown content={m.content} />
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="nexus_message">Refine the plan</Label>
                                <Textarea
                                    id="nexus_message"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="e.g. Only include tasks for shots that are not edited yet, and assign Alex for shooting."
                                    disabled={!canUseAgent || loading}
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <Button
                                    type="button"
                                    onClick={() => {
                                        if (!input.trim()) return;
                                        void runChat(input.trim());
                                        setInput('');
                                    }}
                                    disabled={!canUseAgent || loading || !input.trim()}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin mr-2" />
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="size-4 mr-2" />
                                            Send
                                        </>
                                    )}
                                </Button>

                                <Badge variant="secondary" className="gap-2">
                                    <Calendar className="size-3.5" />
                                    Week planning
                                </Badge>
                            </div>

                            {error && (
                                <Alert variant="destructive">
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="flex w-full flex-col gap-4 lg:w-1/2">
                    <Card>
                        <CardHeader className="flex flex-row items-start justify-between gap-4">
                            <div>
                                <CardTitle>Task candidates</CardTitle>
                                <CardDescription>
                                    Tick the ones you want. Nexus due dates follow the existing script schedule.
                                </CardDescription>
                            </div>
                            <div className="text-right">
                                <Badge variant="outline">{selectedCount} selected</Badge>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {candidates.length === 0 ? (
                                <div className="text-muted-foreground text-sm">No candidates yet. Ask Nexus for a plan.</div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {candidates.map((c) => {
                                        const checked = selectedKeys.has(c.key);
                                        return (
                                            <div key={c.key} className="rounded-lg border p-3">
                                                <div className="flex items-start gap-3">
                                                    <Checkbox
                                                        checked={checked}
                                                        onCheckedChange={(v) => toggleKey(c.key, Boolean(v))}
                                                        aria-label={`Select candidate ${c.title}`}
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <div className="font-medium text-sm">{c.title}</div>
                                                            <Badge variant="secondary">{actionLabel(c.action)}</Badge>
                                                            {c.priority && <Badge variant="outline">{c.priority}</Badge>}
                                                        </div>
                                                        <div className="text-muted-foreground text-xs mt-1">
                                                            Script: {c.script_title}
                                                        </div>
                                                        <div className="text-muted-foreground text-xs mt-1">
                                                            Assignee: {c.assigned_to_name}
                                                        </div>
                                                        <div className="text-muted-foreground text-xs mt-1">
                                                            Due: {c.due_at}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground leading-relaxed">
                                                    {c.description}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <Button
                                type="button"
                                onClick={() => void createTasks()}
                                disabled={!canApply || selectedKeys.size === 0 || loading || !openAiConfigured}
                                className="w-full"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin mr-2" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="size-4 mr-2" />
                                        Create tasks for selected
                                    </>
                                )}
                            </Button>

                            {!canApply && (
                                <div className="text-muted-foreground text-xs">
                                    Only HR managers can create HR tasks.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

