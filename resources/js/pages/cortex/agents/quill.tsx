import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import axios from 'axios';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AgentMarkdown } from '@/components/cortex/agent-markdown';

import { Loader2, Send, PenLine } from 'lucide-react';
import { CortexAgentSettingsMenu } from '@/components/cortex/cortex-agent-settings-menu';

type QuillChatMessage = {
    role: 'user' | 'assistant';
    content: string;
};

interface Props {
    openAiConfigured: boolean;
    promptKey: string;
    promptLabel: string;
    promptDescription: string;
}

const STARTERS = [
    'Write a full script on: [topic]. Target length ~8 minutes spoken. Include intro and section headers.',
    'Rewrite this outline into a full script in my voice: [paste outline].',
    'Take this rough first draft and tighten pacing, keep my voice: [paste].',
];

export default function QuillPage({ openAiConfigured, promptKey, promptLabel, promptDescription }: Props) {
    const tenantRouter = useTenantRouter();

    const breadcrumbs: BreadcrumbItem[] = useMemo(
        () => [{ title: 'Cortex', href: tenantRouter.route('cortex.index') }, { title: 'Quill', href: '' }],
        [tenantRouter],
    );

    const [messages, setMessages] = useState<QuillChatMessage[]>([]);
    const [context, setContext] = useState('');
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const runChat = async (userMessage: string) => {
        setLoading(true);
        setError(null);

        try {
            const url = tenantRouter.route('cortex.agents.quill.chat');
            const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

            const { data } = await axios.post<{ reply?: string; message?: string }>(
                url,
                {
                    message: userMessage,
                    context: context.trim() || undefined,
                    history: messages,
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

            const assistant = data.reply ?? data.message ?? '';
            if (!assistant) {
                throw new Error('Empty response');
            }

            setMessages((prev) => [...prev, { role: 'user', content: userMessage }, { role: 'assistant', content: assistant }]);
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
            <Head title="Quill - Cortex" />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div>
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-md">
                                <PenLine className="size-5" />
                            </div>
                            <h1 className="text-2xl font-semibold tracking-tight">Quill</h1>
                        </div>
                        <CortexAgentSettingsMenu agentKey="quill" />
                    </div>
                    <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                        {promptDescription || 'YouTube scripts in your configured voice.'} The active system prompt is{' '}
                        <code className="rounded bg-muted px-1 py-0.5 text-xs">{promptKey}</code> ({promptLabel}) — edit it under{' '}
                        <Link href={tenantRouter.route('settings.organization.ai-prompts')} className="text-primary font-medium underline-offset-4 hover:underline">
                            Settings → Organization → AI prompts
                        </Link>
                        .
                    </p>
                </div>

                {!canUseAgent && (
                    <Alert variant="destructive">
                        <AlertTitle>AI not configured for this agent</AlertTitle>
                        <AlertDescription>
                            Open <strong>Settings → Agent settings</strong> and configure your provider and API keys.
                        </AlertDescription>
                    </Alert>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Outline & context</CardTitle>
                        <CardDescription>
                            Optional. Paste a beat sheet, product specs, links, or a rough draft. Sent with every message until you clear it.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                            placeholder="e.g. Video topic, key beats, must-mention features, competitor angle…"
                            disabled={!canUseAgent || loading}
                            rows={5}
                            className="font-mono text-xs"
                        />
                    </CardContent>
                </Card>

                <Card className="flex-1">
                    <CardHeader>
                        <CardTitle>Write with Quill</CardTitle>
                        <CardDescription>Chat to draft, rewrite, or extend sections. The model follows your voice prompt from the registry.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <div className="flex max-h-[min(480px,50vh)] flex-col gap-3 overflow-auto">
                            {messages.length === 0 ? (
                                <div className="space-y-2">
                                    <p className="text-muted-foreground text-sm">Try a starter:</p>
                                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                                        {STARTERS.map((s) => (
                                            <Button
                                                key={s}
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                className="h-auto justify-start whitespace-normal text-left text-xs"
                                                disabled={!canUseAgent || loading}
                                                onClick={() => setInput(s)}
                                            >
                                                {s}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                messages.map((m, idx) => (
                                    <div key={`${idx}-${m.role}`} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                                        {m.role === 'user' ? (
                                            <div className="max-w-[85%] whitespace-pre-wrap rounded-lg bg-muted px-3 py-2 text-sm">{m.content}</div>
                                        ) : (
                                            <div className="max-w-[85%] rounded-lg border bg-card px-3 py-3">
                                                <AgentMarkdown content={m.content} />
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="quill_message">Your message</Label>
                            <Textarea
                                id="quill_message"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="e.g. Write the middle section on battery life; keep the same energy as the intro."
                                disabled={!canUseAgent || loading}
                                rows={4}
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
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                        Writing…
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-2 size-4" />
                                        Send
                                    </>
                                )}
                            </Button>
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
        </AppLayout>
    );
}
