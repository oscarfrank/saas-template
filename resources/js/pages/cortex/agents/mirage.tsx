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

import { Loader2, Send, Image } from 'lucide-react';

type MirageChatMessage = {
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
    'I need thumbnail and title ideas for a video about: [topic]. Walk me through what you need (emotion, curiosity, provocation) then suggest options.',
    'Here’s my script summary: [paste]. Generate CTR-strong titles + on-image text + visual directions. Ask me anything missing first.',
    'Compare three packaging strategies for this premise: [one line] — safe vs spicy vs mystery. Then give concrete title + thumb text for each.',
];

export default function MiragePage({ openAiConfigured, promptKey, promptLabel, promptDescription }: Props) {
    const tenantRouter = useTenantRouter();

    const breadcrumbs: BreadcrumbItem[] = useMemo(
        () => [{ title: 'Cortex', href: tenantRouter.route('cortex.index') }, { title: 'Mirage', href: '' }],
        [tenantRouter],
    );

    const [messages, setMessages] = useState<MirageChatMessage[]>([]);
    const [context, setContext] = useState('');
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const runChat = async (userMessage: string) => {
        setLoading(true);
        setError(null);

        try {
            const url = tenantRouter.route('cortex.agents.mirage.chat');
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
            <Head title="Mirage - Cortex" />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-md">
                            <Image className="size-5" />
                        </div>
                        <h1 className="text-2xl font-semibold tracking-tight">Mirage</h1>
                    </div>
                    <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                        {promptDescription || 'Titles and thumbnails tuned for CTR, with a guided conversation about tone and emotion.'} Prompt key{' '}
                        <code className="rounded bg-muted px-1 py-0.5 text-xs">{promptKey}</code> ({promptLabel}) — customize under{' '}
                        <Link href={tenantRouter.route('settings.organization.ai-prompts')} className="text-primary font-medium underline-offset-4 hover:underline">
                            Settings → Organization → AI prompts
                        </Link>
                        .
                    </p>
                </div>

                {!openAiConfigured && (
                    <Alert variant="destructive">
                        <AlertTitle>OpenAI not configured</AlertTitle>
                        <AlertDescription>Set OPENAI_API_KEY in your environment, then reload.</AlertDescription>
                    </Alert>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Topic & extra context</CardTitle>
                        <CardDescription>
                            Optional. Paste a script excerpt, one-line pitch, niche, or competitor links. Included with every message until you clear it.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                            placeholder="e.g. Video is about X vs Y; audience is global tech; I want curiosity not outrage…"
                            disabled={!canUseAgent || loading}
                            rows={5}
                            className="font-mono text-xs"
                        />
                    </CardContent>
                </Card>

                <Card className="flex-1">
                    <CardHeader>
                        <CardTitle>Chat with Mirage</CardTitle>
                        <CardDescription>
                            Mirage will ask what it needs (provocation, curiosity, emotions, visuals) then propose titles, on-thumbnail text, and layout hints.
                        </CardDescription>
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
                            <Label htmlFor="mirage_message">Your message</Label>
                            <Textarea
                                id="mirage_message"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="e.g. I want mystery + surprise, not angry. Face on thumbnail. Give 6 title + thumb text pairs."
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
                                        Working…
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
