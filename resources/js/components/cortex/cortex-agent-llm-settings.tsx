import { useTenantRouter } from '@/hooks/use-tenant-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export type CortexLlmModelOption = { id: string; label: string };

/** Sentinel for "use .env default" in the model `Select` (Radix cannot use empty string as value). */
export const CORTEX_LLM_MODEL_DEFAULT = '__cortex_llm_default__';

export type CortexLlmInertia = {
    agent_key: string;
    llm_provider: 'openai' | 'anthropic';
    chat_model: string | null;
    default_openai_model: string;
    default_anthropic_model: string;
    openai_key_configured: boolean;
    anthropic_key_configured: boolean;
    llm_ready: boolean;
    openai_model_options: CortexLlmModelOption[];
    anthropic_model_options: CortexLlmModelOption[];
};

type Props = {
    llm: CortexLlmInertia;
    /** Called after a successful save so the parent can sync `openAiConfigured` / gating. */
    onLlmSaved?: (next: CortexLlmInertia) => void;
};

function modelOptionsForProvider(llm: CortexLlmInertia): CortexLlmModelOption[] {
    return llm.llm_provider === 'openai' ? llm.openai_model_options : llm.anthropic_model_options;
}

export function CortexAgentLlmSettingsCard({ llm: initial, onLlmSaved }: Props) {
    const tenantRouter = useTenantRouter();
    const [llm, setLlm] = useState<CortexLlmInertia>(initial);
    const [saving, setSaving] = useState(false);

    const csrf = () => document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

    const save = async () => {
        setSaving(true);
        try {
            const url = tenantRouter.route('cortex.agents.llm_settings.update');
            const { data } = await axios.patch<{
                llm: CortexLlmInertia;
            }>(
                url,
                {
                    agent_key: llm.agent_key,
                    llm_provider: llm.llm_provider,
                    chat_model: llm.chat_model,
                },
                { headers: { 'X-CSRF-TOKEN': csrf(), Accept: 'application/json' } },
            );
            setLlm(data.llm);
            onLlmSaved?.(data.llm);
            toast.success('AI model settings saved.');
        } catch (e: unknown) {
            const msg =
                axios.isAxiosError(e) && e.response?.data && typeof e.response.data === 'object' && 'message' in e.response.data
                    ? String((e.response.data as { message?: string }).message)
                    : 'Could not save settings.';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const providerNeedsKey =
        llm.llm_provider === 'openai' ? llm.openai_key_configured : llm.anthropic_key_configured;
    const defaultModel = llm.llm_provider === 'openai' ? llm.default_openai_model : llm.default_anthropic_model;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">AI model</CardTitle>
                <CardDescription>
                    Choose OpenAI or Anthropic for this agent. Keys are set once in <code className="text-xs">.env</code>{' '}
                    (<span className="font-mono text-xs">OPENAI_API_KEY</span>,{' '}
                    <span className="font-mono text-xs">ANTHROPIC_API_KEY</span>).
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <div className="grid gap-2 sm:grid-cols-2 sm:items-end">
                    <div className="space-y-2">
                        <Label htmlFor="cortex-llm-provider">Provider</Label>
                        <Select
                            value={llm.llm_provider}
                            onValueChange={(v: 'openai' | 'anthropic') =>
                                setLlm((prev) => {
                                    const opts = v === 'openai' ? prev.openai_model_options : prev.anthropic_model_options;
                                    const ids = new Set(opts.map((o) => o.id));
                                    const nextModel =
                                        prev.chat_model !== null && ids.has(prev.chat_model) ? prev.chat_model : null;
                                    return { ...prev, llm_provider: v, chat_model: nextModel };
                                })
                            }
                        >
                            <SelectTrigger id="cortex-llm-provider">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="openai">OpenAI</SelectItem>
                                <SelectItem value="anthropic">Anthropic</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="cortex-llm-model">Model override (optional)</Label>
                        <Select
                            value={llm.chat_model ?? CORTEX_LLM_MODEL_DEFAULT}
                            onValueChange={(v) =>
                                setLlm((prev) => ({
                                    ...prev,
                                    chat_model: v === CORTEX_LLM_MODEL_DEFAULT ? null : v,
                                }))
                            }
                        >
                            <SelectTrigger id="cortex-llm-model">
                                <SelectValue placeholder="Choose model" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={CORTEX_LLM_MODEL_DEFAULT}>Default ({defaultModel})</SelectItem>
                                {modelOptionsForProvider(llm).map((o) => (
                                    <SelectItem key={o.id} value={o.id}>
                                        {o.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-muted-foreground text-xs">
                            Default uses <span className="font-mono text-xs">{defaultModel}</span> from your environment when
                            override is not set.
                        </p>
                    </div>
                </div>
                {!providerNeedsKey && (
                    <p className="text-destructive text-sm">
                        Add the API key for {llm.llm_provider === 'openai' ? 'OpenAI' : 'Anthropic'} in your environment to run
                        this agent.
                    </p>
                )}
                <div>
                    <Button type="button" size="sm" onClick={() => void save()} disabled={saving}>
                        {saving ? <Loader2 className="size-4 animate-spin" /> : 'Save model settings'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
