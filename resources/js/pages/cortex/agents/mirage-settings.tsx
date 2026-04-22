import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import { FormEventHandler, useMemo } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { ArrowLeft, Settings2 } from 'lucide-react';

type ProviderOption = {
    value: string;
    label: string;
    description: string;
};

interface Props {
    imageProvider: string;
    openAiImageModel: string;
    providers: ProviderOption[];
    openAiModels: ProviderOption[];
}

export default function MirageSettingsPage({ imageProvider, openAiImageModel, providers, openAiModels }: Props) {
    const tenantRouter = useTenantRouter();

    const breadcrumbs: BreadcrumbItem[] = useMemo(
        () => [
            { title: 'Cortex', href: tenantRouter.route('cortex.index') },
            { title: 'Mirage', href: tenantRouter.route('cortex.agents.mirage') },
            { title: 'Image settings', href: '' },
        ],
        [tenantRouter],
    );

    const form = useForm({
        image_provider: imageProvider,
        openai_image_model: openAiImageModel,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.patch(tenantRouter.route('cortex.agents.mirage.settings.update'), {
            preserveScroll: true,
            onSuccess: () => toast.success('Settings saved.'),
        });
    };

    const selectedMeta = providers.find((p) => p.value === form.data.image_provider);
    const selectedOpenAiModelMeta = openAiModels.find((m) => m.value === form.data.openai_image_model);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mirage image settings - Cortex" />
            <div className="relative min-h-[calc(100vh-8rem)]">
                <div className="pointer-events-none absolute inset-x-0 -top-px h-32 bg-gradient-to-b from-primary/12 via-primary/5 to-transparent" />
                <div className="relative mx-auto max-w-lg space-y-6 p-4 md:p-6">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="shrink-0" asChild>
                            <Link href={tenantRouter.route('cortex.agents.mirage')} aria-label="Back to Mirage">
                                <ArrowLeft className="size-5" />
                            </Link>
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/15 text-primary flex size-11 items-center justify-center rounded-2xl ring-1 ring-primary/20">
                                <Settings2 className="size-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight">Mirage image settings</h1>
                                <p className="text-muted-foreground text-sm">Choose which engine creates thumbnail images.</p>
                                <p className="text-muted-foreground mt-1 text-xs">
                                    Chat and JSON ideas use the{' '}
                                    <Link
                                        href={tenantRouter.route('cortex.agents.agent_settings.show', { agent: 'mirage' })}
                                        className="text-primary font-medium underline-offset-4 hover:underline"
                                    >
                                        Mirage agent settings
                                    </Link>{' '}
                                    page (LLM provider).
                                </p>
                            </div>
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Image provider</CardTitle>
                            <CardDescription>
                                OpenAI provider uses your OpenAI API key (with selectable models). Midjourney uses a separate HTTP endpoint you configure in{' '}
                                <code className="rounded bg-muted px-1 py-0.5 text-xs">.env</code> (for third-party MJ APIs or proxies).
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="image_provider">Provider</Label>
                                    <Select
                                        value={form.data.image_provider}
                                        onValueChange={(v) => form.setData('image_provider', v)}
                                        disabled={form.processing}
                                    >
                                        <SelectTrigger id="image_provider" className="w-full">
                                            <SelectValue placeholder="Select a provider" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {providers.map((p) => (
                                                <SelectItem key={p.value} value={p.value}>
                                                    {p.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {selectedMeta ? <p className="text-muted-foreground text-sm leading-relaxed">{selectedMeta.description}</p> : null}
                                    <InputError message={form.errors.image_provider} />
                                </div>
                                {form.data.image_provider === 'openai' ? (
                                    <div className="space-y-2">
                                        <Label htmlFor="openai_image_model">OpenAI model</Label>
                                        <Select
                                            value={form.data.openai_image_model}
                                            onValueChange={(v) => form.setData('openai_image_model', v)}
                                            disabled={form.processing}
                                        >
                                            <SelectTrigger id="openai_image_model" className="w-full">
                                                <SelectValue placeholder="Select a model" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {openAiModels.map((m) => (
                                                    <SelectItem key={m.value} value={m.value}>
                                                        {m.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {selectedOpenAiModelMeta ? <p className="text-muted-foreground text-sm leading-relaxed">{selectedOpenAiModelMeta.description}</p> : null}
                                        <InputError message={form.errors.openai_image_model} />
                                    </div>
                                ) : null}

                                <Button type="submit" disabled={form.processing}>
                                    Save
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <div className="text-muted-foreground space-y-2 text-xs leading-relaxed">
                        <p>
                            <strong className="text-foreground">OpenAI:</strong> set <code className="rounded bg-muted px-1">OPENAI_API_KEY</code>. Optional:{' '}
                            <code className="rounded bg-muted px-1">OPENAI_IMAGE_SIZE</code>, <code className="rounded bg-muted px-1">OPENAI_GPT_IMAGE_SIZE</code>,{' '}
                            <code className="rounded bg-muted px-1">OPENAI_GPT_IMAGE_MODEL</code>.
                        </p>
                        <p>
                            <strong className="text-foreground">Midjourney-compatible API:</strong> set <code className="rounded bg-muted px-1">MIDJOURNEY_API_URL</code>{' '}
                            to your provider’s POST URL (JSON body <code className="rounded bg-muted px-1">{`{ "prompt": "..." }`}</code>
                            ). Optional: <code className="rounded bg-muted px-1">MIDJOURNEY_API_KEY</code> as Bearer token.
                        </p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
