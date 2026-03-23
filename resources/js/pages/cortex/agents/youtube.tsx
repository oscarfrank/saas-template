import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AgentMarkdown } from '@/components/cortex/agent-markdown';
import axios from 'axios';
import { ArrowLeft, Loader2, Youtube } from 'lucide-react';
import { useState } from 'react';

interface Props {
    openAiConfigured: boolean;
}

export default function CortexYoutubeAgentPage({ openAiConfigured }: Props) {
    const tenantRouter = useTenantRouter();
    const cortexIndexUrl = tenantRouter.route('cortex.index');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Cortex', href: cortexIndexUrl },
        { title: 'YouTube video analyst', href: '' },
    ];

    const [videoUrl, setVideoUrl] = useState('');
    const [reply, setReply] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const runAgent = async () => {
        setError(null);
        setReply(null);
        setLoading(true);
        const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
        const url = tenantRouter.route('cortex.agents.youtube.run');
        try {
            const { data } = await axios.post<{ reply?: string; message?: string }>(
                url,
                { video_url: videoUrl },
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
            if (data.reply) {
                setReply(data.reply);
            } else {
                setError(data.message ?? 'Unexpected response.');
            }
        } catch (e) {
            if (axios.isAxiosError(e)) {
                const data = e.response?.data as { message?: string; errors?: Record<string, string[]> } | undefined;
                const fromErrors = data?.errors?.video_url?.[0];
                const msg = fromErrors ?? data?.message ?? e.message ?? 'Request failed.';
                setError(msg);
            } else {
                setError('Something went wrong.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="YouTube video analyst — Cortex" />
            <div className="mx-auto flex max-w-3xl flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <Button variant="ghost" size="sm" className="mb-2 -ml-2 w-fit gap-1 px-2" asChild>
                            <Link href={cortexIndexUrl}>
                                <ArrowLeft className="size-4" />
                                All agents
                            </Link>
                        </Button>
                        <div className="flex items-center gap-2">
                            <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-md">
                                <Youtube className="size-5" />
                            </div>
                            <h1 className="text-2xl font-semibold tracking-tight">YouTube video analyst</h1>
                        </div>
                        <p className="text-muted-foreground mt-2 text-sm">
                            Paste a video URL (or ID). Cortex fetches captions when available, then OpenAI summarizes and suggests improvements.
                        </p>
                    </div>
                </div>

                {!openAiConfigured && (
                    <Alert variant="destructive">
                        <AlertTitle>OpenAI not configured</AlertTitle>
                        <AlertDescription>Set OPENAI_API_KEY (and optionally OPENAI_CHAT_MODEL) in your environment, then reload.</AlertDescription>
                    </Alert>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Run analysis</CardTitle>
                        <CardDescription>Works best on videos with public captions. Rate limits may apply when YouTube throttles transcript fetches.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="video_url">YouTube URL or video ID</Label>
                            <Input
                                id="video_url"
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                                placeholder="https://www.youtube.com/watch?v=…"
                                disabled={loading || !openAiConfigured}
                            />
                        </div>
                        <Button type="button" onClick={() => void runAgent()} disabled={loading || !openAiConfigured || !videoUrl.trim()}>
                            {loading ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    Running agent…
                                </>
                            ) : (
                                'Analyze video'
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {error && (
                    <Alert variant="destructive">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {reply && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Result</CardTitle>
                            <CardDescription>Generated by your configured OpenAI model via Neuron.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-muted/50 max-h-[min(70vh,720px)] overflow-auto rounded-md border p-4">
                                <AgentMarkdown content={reply} />
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
