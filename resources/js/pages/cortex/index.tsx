import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { CORTEX_LLM_MODEL_DEFAULT } from '@/components/cortex/cortex-agent-llm-settings';
import { Label } from '@/components/ui/label';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { Brain, Image, LayoutGrid, Loader2, PenLine, Search, Settings, Sparkles, Type, Youtube } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

export interface CortexAgentDefinition {
    id: string;
    name: string;
    description: string;
    route: string;
}

type CortexLlmMeta = {
    default_openai_model: string;
    default_anthropic_model: string;
    openai_key_configured: boolean;
    anthropic_key_configured: boolean;
    openai_model_options: { id: string; label: string }[];
    anthropic_model_options: { id: string; label: string }[];
};

interface Props {
    agents: CortexAgentDefinition[];
    cortexLlm: CortexLlmMeta;
}

const CORTEX_DASHBOARD_THEME_KEY = 'cortex-dashboard-theme';

export type CortexDashboardTheme = 'minimal' | 'futuristic';

function CortexDashboardTitle({ variant }: { variant: CortexDashboardTheme }) {
    const futuristic = variant === 'futuristic';
    return (
        <div className={cn(futuristic && 'space-y-1')}>
            {futuristic && (
                <p className="text-[10px] font-medium tracking-[0.28em] text-violet-600 uppercase dark:text-cyan-400/95">
                    Workspace · Agent network
                </p>
            )}
            <h1
                className={cn(
                    'font-semibold tracking-tight',
                    futuristic
                        ? 'bg-gradient-to-r from-violet-700 via-fuchsia-600 to-cyan-600 bg-clip-text text-3xl text-transparent dark:from-cyan-200 dark:via-violet-300 dark:to-fuchsia-200'
                        : 'text-2xl',
                )}
            >
                Cortex
            </h1>
            <p
                className={cn(
                    'text-muted-foreground text-sm',
                    futuristic ? 'mt-2 max-w-xl leading-relaxed' : 'mt-1',
                )}
            >
                AI agents for your workspace. Pick one to run a guided task.
            </p>
        </div>
    );
}

function CortexDashboardToolbar({
    dashboardTheme,
    onThemeChange,
    onOpenBulk,
    variant,
}: {
    dashboardTheme: CortexDashboardTheme;
    onThemeChange: (value: CortexDashboardTheme) => void;
    onOpenBulk: () => void;
    variant: CortexDashboardTheme;
}) {
    const futuristic = variant === 'futuristic';
    return (
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <ToggleGroup
                type="single"
                value={dashboardTheme}
                onValueChange={(v) => {
                    if (v === 'minimal' || v === 'futuristic') {
                        onThemeChange(v);
                    }
                }}
                variant="outline"
                size="sm"
                className={cn(
                    'shrink-0',
                    futuristic &&
                        'border-violet-300/50 bg-white/50 shadow-inner backdrop-blur-sm dark:border-white/10 dark:bg-black/35',
                )}
            >
                <ToggleGroupItem value="minimal" aria-label="Minimal layout" className="gap-1.5 px-2.5 text-xs">
                    <LayoutGrid className="size-3.5" />
                    Minimal
                </ToggleGroupItem>
                <ToggleGroupItem value="futuristic" aria-label="Futuristic layout" className="gap-1.5 px-2.5 text-xs">
                    <Sparkles className="size-3.5" />
                    Futuristic
                </ToggleGroupItem>
            </ToggleGroup>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={cn(
                            'gap-2 shrink-0',
                            futuristic &&
                                'border-violet-300/50 bg-white/50 shadow-inner backdrop-blur-sm dark:border-white/10 dark:bg-black/35',
                        )}
                    >
                        <Settings className="size-4" />
                        Settings
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Workspace</DropdownMenuLabel>
                    <DropdownMenuItem
                        onSelect={(e) => {
                            e.preventDefault();
                            onOpenBulk();
                        }}
                    >
                        Apply API &amp; model to all agents…
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

function agentIcon(id: string) {
    const map: Record<string, typeof Youtube> = {
        'youtube-video': Youtube,
        'youtube-doc': Youtube,
        'nexus-planner': Brain,
        pulse: Sparkles,
        quill: PenLine,
        bait: Type,
        mirage: Image,
    };
    return map[id] ?? Youtube;
}

export default function CortexIndex({ agents, cortexLlm }: Props) {
    const tenantRouter = useTenantRouter();
    const resolvedBreadcrumbs: BreadcrumbItem[] = [{ title: 'Cortex', href: tenantRouter.route('cortex.index') }];

    const [bulkOpen, setBulkOpen] = useState(false);
    const [provider, setProvider] = useState<'openai' | 'anthropic'>('openai');
    const [chatModel, setChatModel] = useState('');
    const [saving, setSaving] = useState(false);
    const [dashboardTheme, setDashboardTheme] = useState<CortexDashboardTheme>('minimal');
    const [agentQuery, setAgentQuery] = useState('');

    useEffect(() => {
        try {
            const raw = localStorage.getItem(CORTEX_DASHBOARD_THEME_KEY);
            if (raw === 'minimal' || raw === 'futuristic') {
                setDashboardTheme(raw);
            }
        } catch {
            /* private mode or unavailable */
        }
    }, []);

    const setDashboardThemePersist = (value: CortexDashboardTheme) => {
        setDashboardTheme(value);
        try {
            localStorage.setItem(CORTEX_DASHBOARD_THEME_KEY, value);
        } catch {
            /* ignore */
        }
    };

    const isFuturistic = dashboardTheme === 'futuristic';

    const filteredAgents = useMemo(() => {
        const q = agentQuery.trim().toLowerCase();
        if (q === '') {
            return agents;
        }
        return agents.filter((a) => {
            const haystack = `${a.name} ${a.description} ${a.id}`.toLowerCase();
            return haystack.includes(q);
        });
    }, [agents, agentQuery]);

    const csrf = () => document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

    const defaultModel = provider === 'openai' ? cortexLlm.default_openai_model : cortexLlm.default_anthropic_model;
    const keyOk = provider === 'openai' ? cortexLlm.openai_key_configured : cortexLlm.anthropic_key_configured;
    const modelOptions = provider === 'openai' ? cortexLlm.openai_model_options : cortexLlm.anthropic_model_options;

    const applyBulk = async () => {
        setSaving(true);
        try {
            await axios.post(
                tenantRouter.route('cortex.agents.llm_settings.bulk'),
                {
                    llm_provider: provider,
                    chat_model: chatModel.trim() === '' ? null : chatModel.trim(),
                },
                {
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrf(),
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                },
            );
            toast.success('All Cortex agents now use this API and model.');
            setBulkOpen(false);
        } catch (e) {
            const msg =
                axios.isAxiosError(e) && e.response?.data && typeof e.response.data === 'object' && 'message' in e.response.data
                    ? String((e.response.data as { message?: string }).message)
                    : 'Could not update agents.';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <AppLayout breadcrumbs={resolvedBreadcrumbs}>
            <Head title="Cortex" />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                {isFuturistic ? (
                    <section className="relative overflow-hidden rounded-2xl border border-violet-300/40 bg-gradient-to-br from-violet-50/90 via-background to-cyan-50/70 p-6 shadow-[0_0_60px_-18px_rgba(124,58,237,0.28)] md:p-8 dark:border-cyan-500/25 dark:from-slate-950 dark:via-violet-950/35 dark:to-slate-950 dark:shadow-[0_0_80px_-24px_rgba(34,211,238,0.22)]">
                        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent dark:via-cyan-400/45" />
                        <div
                            className="pointer-events-none absolute inset-0 opacity-[0.55] [background-image:linear-gradient(rgba(124,58,237,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(124,58,237,0.07)_1px,transparent_1px)] [background-size:28px_28px] dark:opacity-[0.35] dark:[background-image:linear-gradient(rgba(34,211,238,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.06)_1px,transparent_1px)]"
                            aria-hidden
                        />
                        <div className="pointer-events-none absolute inset-0 opacity-[0.2] [background-image:radial-gradient(circle_at_1px_1px,_hsl(var(--border))_1px,_transparent_0)] [background-size:20px_20px] mix-blend-overlay dark:opacity-[0.15]" />
                        <div
                            className="animate-cortex-blob-drift pointer-events-none absolute -top-28 -right-16 h-72 w-[22rem] rounded-full bg-gradient-to-br from-violet-500/35 to-fuchsia-400/25 blur-3xl dark:from-cyan-500/30 dark:to-violet-600/25"
                            aria-hidden
                        />
                        <div
                            className="animate-cortex-blob-drift pointer-events-none absolute -bottom-20 -left-12 h-64 w-64 rounded-full bg-gradient-to-tr from-cyan-400/25 to-violet-500/20 blur-3xl [animation-delay:-11s] dark:from-violet-600/35 dark:to-cyan-400/20"
                            aria-hidden
                        />
                        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <CortexDashboardTitle variant="futuristic" />
                            <CortexDashboardToolbar
                                dashboardTheme={dashboardTheme}
                                onThemeChange={setDashboardThemePersist}
                                onOpenBulk={() => setBulkOpen(true)}
                                variant="futuristic"
                            />
                        </div>
                    </section>
                ) : (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <CortexDashboardTitle variant="minimal" />
                        <CortexDashboardToolbar
                            dashboardTheme={dashboardTheme}
                            onThemeChange={setDashboardThemePersist}
                            onOpenBulk={() => setBulkOpen(true)}
                            variant="minimal"
                        />
                    </div>
                )}

                <div className="max-w-md">
                    <Label htmlFor="cortex-agent-search" className="sr-only">
                        Search agents
                    </Label>
                    <div className="relative">
                        <Search
                            className={cn(
                                'pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground',
                                isFuturistic && 'text-violet-500/75 dark:text-cyan-400/65',
                            )}
                            aria-hidden
                        />
                        <Input
                            id="cortex-agent-search"
                            type="search"
                            placeholder="Search agents…"
                            value={agentQuery}
                            onChange={(e) => setAgentQuery(e.target.value)}
                            autoComplete="off"
                            className={cn(
                                'pl-9',
                                isFuturistic &&
                                    'border-violet-200/90 bg-white/90 shadow-[inset_0_0_0_1px_rgba(124,58,237,0.06)] backdrop-blur-sm placeholder:text-muted-foreground/80 focus-visible:border-cyan-500/55 focus-visible:ring-cyan-500/25 dark:border-cyan-500/25 dark:bg-slate-950/55 dark:shadow-[inset_0_0_24px_-10px_rgba(34,211,238,0.12)] dark:focus-visible:border-cyan-400/50 dark:focus-visible:ring-cyan-400/20',
                            )}
                            aria-label="Search agents by name or description"
                        />
                    </div>
                </div>

                <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Apply to all agents</DialogTitle>
                            <DialogDescription>
                                Updates every Cortex agent at once. Choose &quot;Default&quot; to use your{' '}
                                <code className="text-xs">.env</code> value for the chosen provider.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-2">
                            {!keyOk && (
                                <Alert variant="destructive">
                                    <AlertTitle>API key missing</AlertTitle>
                                    <AlertDescription>
                                        Add{' '}
                                        {provider === 'openai' ? (
                                            <code className="text-xs">OPENAI_API_KEY</code>
                                        ) : (
                                            <code className="text-xs">ANTHROPIC_API_KEY</code>
                                        )}{' '}
                                        to your environment before agents can run.
                                    </AlertDescription>
                                </Alert>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="cortex-bulk-provider">Provider</Label>
                                <Select
                                    value={provider}
                                    onValueChange={(v: 'openai' | 'anthropic') => {
                                        setProvider(v);
                                        setChatModel('');
                                    }}
                                >
                                    <SelectTrigger id="cortex-bulk-provider">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="openai">OpenAI</SelectItem>
                                        <SelectItem value="anthropic">Anthropic</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cortex-bulk-model">Model override (optional)</Label>
                                <Select
                                    value={chatModel === '' ? CORTEX_LLM_MODEL_DEFAULT : chatModel}
                                    onValueChange={(v) => setChatModel(v === CORTEX_LLM_MODEL_DEFAULT ? '' : v)}
                                >
                                    <SelectTrigger id="cortex-bulk-model">
                                        <SelectValue placeholder="Choose model" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={CORTEX_LLM_MODEL_DEFAULT}>Default ({defaultModel})</SelectItem>
                                        {modelOptions.map((o) => (
                                            <SelectItem key={o.id} value={o.id}>
                                                {o.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-muted-foreground text-xs">
                                    Default uses <span className="font-mono text-xs">{defaultModel}</span> from your environment.
                                </p>
                            </div>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button type="button" variant="outline" onClick={() => setBulkOpen(false)} disabled={saving}>
                                Cancel
                            </Button>
                            <Button type="button" onClick={() => void applyBulk()} disabled={saving}>
                                {saving ? <Loader2 className="size-4 animate-spin" /> : 'Apply to all agents'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {filteredAgents.length === 0 ? (
                    <p className="text-muted-foreground py-10 text-center text-sm">
                        {agentQuery.trim() === ''
                            ? 'No agents available.'
                            : `No agents match “${agentQuery.trim()}”. Try a different search.`}
                    </p>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredAgents.map((agent) => {
                            const Icon = agentIcon(agent.id);
                            return (
                                <Link
                                    key={agent.id}
                                    href={tenantRouter.route(agent.route)}
                                    className={cn(
                                        'block rounded-lg outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring',
                                        isFuturistic && 'group',
                                    )}
                                >
                                    <Card
                                        className={cn(
                                            'h-full transition-colors',
                                            isFuturistic
                                                ? 'relative overflow-hidden rounded-xl border border-violet-200/70 bg-gradient-to-b from-card via-card to-violet-50/40 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/45 hover:shadow-[0_16px_48px_-14px_rgba(124,58,237,0.35)] dark:border-cyan-500/20 dark:from-slate-900/98 dark:via-slate-900/95 dark:to-slate-950 dark:hover:border-cyan-400/45 dark:hover:shadow-[0_0_36px_-6px_rgba(34,211,238,0.28)]'
                                                : 'hover:bg-muted/40',
                                        )}
                                    >
                                        {isFuturistic && (
                                            <div
                                                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent opacity-70 dark:via-cyan-400/30"
                                                aria-hidden
                                            />
                                        )}
                                        <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                                            <div
                                                className={cn(
                                                    'flex size-10 shrink-0 items-center justify-center rounded-lg',
                                                    isFuturistic
                                                        ? 'bg-gradient-to-br from-violet-600/20 via-fuchsia-500/15 to-cyan-500/25 text-violet-700 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] ring-1 ring-violet-400/30 dark:from-cyan-500/25 dark:via-violet-500/20 dark:to-fuchsia-500/15 dark:text-cyan-300 dark:ring-cyan-500/35'
                                                        : 'bg-primary/10 text-primary',
                                                )}
                                            >
                                                <Icon className="size-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <CardTitle className="text-base leading-tight">{agent.name}</CardTitle>
                                                <CardDescription className="mt-1.5 line-clamp-3">{agent.description}</CardDescription>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <span
                                                className={cn(
                                                    'text-sm font-medium',
                                                    isFuturistic
                                                        ? 'text-violet-700 transition-transform duration-300 group-hover:translate-x-0.5 dark:text-cyan-400/95'
                                                        : 'text-primary',
                                                )}
                                            >
                                                Open agent →
                                            </span>
                                        </CardContent>
                                    </Card>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
