import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ChevronDown, Sparkles } from 'lucide-react';

import { useTenantRouter } from '@/hooks/use-tenant-router';

import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Organization', href: '/settings/organization' },
    { title: 'AI prompts', href: '/settings/organization/ai-prompts' },
];

interface BuiltInPrompt {
    key: string;
    label: string;
    description: string;
    group: string;
    variables: string[];
    default: string;
    effective: string;
    uses_override: boolean;
}

interface CustomPrompt {
    key: string;
    label: string;
    system_prompt: string;
}

interface Props {
    built_in_prompts: BuiltInPrompt[];
    custom_prompts: CustomPrompt[];
    can_manage_ai_prompts: boolean;
    custom_key_prefix: string;
}

export default function OrganizationAiPrompts({
    built_in_prompts,
    custom_prompts,
    can_manage_ai_prompts,
    custom_key_prefix,
}: Props) {
    const tenantRouter = useTenantRouter();
    const [drafts, setDrafts] = useState<Record<string, string>>(() =>
        Object.fromEntries(built_in_prompts.map((p) => [p.key, p.effective])),
    );
    const [expandedBuiltinKey, setExpandedBuiltinKey] = useState<string | null>(null);
    const [editingCustom, setEditingCustom] = useState<CustomPrompt | null>(null);

    useEffect(() => {
        setDrafts(Object.fromEntries(built_in_prompts.map((p) => [p.key, p.effective])));
    }, [built_in_prompts]);

    const grouped = useMemo(() => {
        const m = new Map<string, BuiltInPrompt[]>();
        for (const p of built_in_prompts) {
            const g = p.group || 'Other';
            if (!m.has(g)) m.set(g, []);
            m.get(g)!.push(p);
        }
        return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    }, [built_in_prompts]);

    const newCustomForm = useForm({
        slug: '',
        label: '',
        system_prompt: '',
    });

    const editCustomForm = useForm({
        key: '',
        label: '',
        system_prompt: '',
    });

    const syncDraft = (key: string, value: string) => {
        setDrafts((prev) => ({ ...prev, [key]: value }));
    };

    const saveBuiltin = (key: string) => {
        const system_prompt = drafts[key];
        if (system_prompt === undefined) return;
        tenantRouter.patch(
            'settings.organization.ai-prompts.update',
            { key, system_prompt },
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Prompt saved'),
                onError: () => toast.error('Could not save prompt'),
            },
        );
    };

    const resetBuiltin = (key: string) => {
        tenantRouter.post(
            'settings.organization.ai-prompts.reset',
            { key },
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    const def = built_in_prompts.find((p) => p.key === key)?.default ?? '';
                    syncDraft(key, def);
                    toast.success('Reset to default');
                },
                onError: () => toast.error('Could not reset prompt'),
            },
        );
    };

    const submitNewCustom = (e: React.FormEvent) => {
        e.preventDefault();
        newCustomForm.post(tenantRouter.route('settings.organization.ai-prompts.custom.store'), {
            preserveScroll: true,
            onSuccess: () => {
                newCustomForm.reset();
                toast.success('Custom prompt created');
            },
            onError: () => toast.error('Check the form and try again'),
        });
    };

    const saveCustomEdit = (e: React.FormEvent) => {
        e.preventDefault();
        editCustomForm.patch(tenantRouter.route('settings.organization.ai-prompts.custom.update'), {
            preserveScroll: true,
            onSuccess: () => {
                editCustomForm.reset();
                setEditingCustom(null);
                toast.success('Custom prompt updated');
            },
            onError: () => toast.error('Could not update'),
        });
    };

    const deleteCustom = (key: string) => {
        if (!confirm('Delete this custom prompt? This cannot be undone.')) return;
        tenantRouter.post(
            'settings.organization.ai-prompts.custom.destroy',
            { key },
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Deleted'),
                onError: () => toast.error('Could not delete'),
            },
        );
    };

    const startEditCustom = (p: CustomPrompt) => {
        editCustomForm.setData({ key: p.key, label: p.label, system_prompt: p.system_prompt });
        setEditingCustom(p);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="AI prompts" />
            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="AI prompts"
                        description="Override system prompts for script writing, analysis, and transcripts. Owners and admins can edit; other members use the effective prompts automatically."
                    />

                    {!can_manage_ai_prompts && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">View only</CardTitle>
                                <CardDescription>
                                    Only organization owners and admins can change prompts. Script and AI features still use your
                                    organization&apos;s saved overrides.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    )}

                    {grouped.map(([groupName, prompts]) => (
                        <Card key={groupName}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Sparkles className="h-5 w-5 text-muted-foreground" />
                                    {groupName}
                                </CardTitle>
                                <CardDescription>Built-in prompts for this section of the product.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {prompts.map((p) => (
                                    <Collapsible
                                        key={p.key}
                                        open={expandedBuiltinKey === p.key}
                                        onOpenChange={(o) => setExpandedBuiltinKey(o ? p.key : null)}
                                        className="rounded-lg border bg-card"
                                    >
                                        <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium hover:bg-muted/50">
                                            <span className="flex flex-wrap items-center gap-2">
                                                {p.label}
                                                <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-normal text-muted-foreground">
                                                    {p.key}
                                                </code>
                                                {p.uses_override ? (
                                                    <Badge variant="secondary">Customized</Badge>
                                                ) : (
                                                    <Badge variant="outline">Default</Badge>
                                                )}
                                            </span>
                                            <ChevronDown className="h-4 w-4 shrink-0 transition-transform [[data-state=open]_&]:rotate-180" />
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <div className="space-y-3 border-t px-4 py-3">
                                                {p.description ? (
                                                    <p className="text-sm text-muted-foreground">{p.description}</p>
                                                ) : null}
                                                {p.variables.length > 0 ? (
                                                    <p className="text-xs text-muted-foreground">
                                                        Placeholders:{' '}
                                                        {p.variables.map((v) => (
                                                            <code key={v} className="mx-0.5 rounded bg-muted px-1">
                                                                {`{{${v}}}`}
                                                            </code>
                                                        ))}
                                                    </p>
                                                ) : null}
                                                <div className="space-y-2">
                                                    <Label htmlFor={`prompt-${p.key}`}>System prompt</Label>
                                                    <Textarea
                                                        id={`prompt-${p.key}`}
                                                        className="min-h-[220px] font-mono text-xs"
                                                        value={drafts[p.key] ?? p.effective}
                                                        onChange={(e) => syncDraft(p.key, e.target.value)}
                                                        readOnly={!can_manage_ai_prompts}
                                                        disabled={!can_manage_ai_prompts}
                                                    />
                                                </div>
                                                {can_manage_ai_prompts && (
                                                    <div className="flex flex-wrap gap-2">
                                                        <Button type="button" size="sm" onClick={() => saveBuiltin(p.key)}>
                                                            Save
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => resetBuiltin(p.key)}
                                                        >
                                                            Reset to default
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </CollapsibleContent>
                                    </Collapsible>
                                ))}
                            </CardContent>
                        </Card>
                    ))}

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Custom prompts</CardTitle>
                            <CardDescription>
                                Create named prompts for use in your own code via{' '}
                                <code className="rounded bg-muted px-1 text-xs">TenantAiPromptResolver</code> and key{' '}
                                <code className="rounded bg-muted px-1 text-xs">{custom_key_prefix}</code>
                                <span className="font-mono text-xs">your_slug</span>.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            {custom_prompts.length > 0 && (
                                <ul className="space-y-2">
                                    {custom_prompts.map((p) => (
                                        <li
                                            key={p.key}
                                            className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
                                        >
                                            <div>
                                                <p className="font-medium">{p.label}</p>
                                                <code className="text-xs text-muted-foreground">{p.key}</code>
                                            </div>
                                            {can_manage_ai_prompts && (
                                                <div className="flex gap-2">
                                                    <Button type="button" size="sm" variant="outline" onClick={() => startEditCustom(p)}>
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => deleteCustom(p.key)}
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {can_manage_ai_prompts && editingCustom && (
                                <form onSubmit={saveCustomEdit} className="space-y-4 rounded-lg border bg-muted/30 p-4">
                                    <p className="text-sm font-medium">Edit custom prompt</p>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-custom-label">Label</Label>
                                        <Input
                                            id="edit-custom-label"
                                            value={editCustomForm.data.label}
                                            onChange={(e) => editCustomForm.setData('label', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-custom-body">System prompt</Label>
                                        <Textarea
                                            id="edit-custom-body"
                                            className="min-h-[180px] font-mono text-xs"
                                            value={editCustomForm.data.system_prompt}
                                            onChange={(e) => editCustomForm.setData('system_prompt', e.target.value)}
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button type="submit" size="sm" disabled={editCustomForm.processing}>
                                            Save changes
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                                editCustomForm.reset();
                                                setEditingCustom(null);
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            )}

                            {can_manage_ai_prompts && (
                                <form onSubmit={submitNewCustom} className="space-y-4">
                                    <p className="text-sm font-medium">Add custom prompt</p>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="custom-slug">Key slug</Label>
                                            <div className="flex items-center gap-1 text-sm">
                                                <span className="text-muted-foreground">{custom_key_prefix}</span>
                                                <Input
                                                    id="custom-slug"
                                                    placeholder="e.g. email_outreach"
                                                    value={newCustomForm.data.slug}
                                                    onChange={(e) => newCustomForm.setData('slug', e.target.value.toLowerCase())}
                                                    className="font-mono text-xs"
                                                />
                                            </div>
                                            {newCustomForm.errors.slug && (
                                                <p className="text-sm text-destructive">{newCustomForm.errors.slug}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="custom-label">Display label</Label>
                                            <Input
                                                id="custom-label"
                                                value={newCustomForm.data.label}
                                                onChange={(e) => newCustomForm.setData('label', e.target.value)}
                                            />
                                            {newCustomForm.errors.label && (
                                                <p className="text-sm text-destructive">{newCustomForm.errors.label}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="custom-body">System prompt</Label>
                                        <Textarea
                                            id="custom-body"
                                            className="min-h-[160px] font-mono text-xs"
                                            value={newCustomForm.data.system_prompt}
                                            onChange={(e) => newCustomForm.setData('system_prompt', e.target.value)}
                                        />
                                        {newCustomForm.errors.system_prompt && (
                                            <p className="text-sm text-destructive">{newCustomForm.errors.system_prompt}</p>
                                        )}
                                    </div>
                                    <Button type="submit" size="sm" disabled={newCustomForm.processing}>
                                        Create prompt
                                    </Button>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
