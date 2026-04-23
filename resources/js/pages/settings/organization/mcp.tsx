import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Copy, Plug, Trash2 } from 'lucide-react';

import { useTenantRouter } from '@/hooks/use-tenant-router';

import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Organization', href: '/settings/organization' },
    { title: 'MCP & agents', href: '/settings/organization/mcp' },
];

interface McpClientRow {
    id: number;
    name: string;
    client_key: string;
    is_active: boolean;
    allowed_tools: string[] | null;
    last_used_at: string | null;
    created_at: string | null;
}

interface McpIntegrationRow {
    id: number;
    provider: string;
    status: string;
    scopes: string[];
    has_credentials: boolean;
    last_sync_at: string | null;
    updated_at: string | null;
}

interface ToolCatalogEntry {
    key: string;
    label: string;
    description: string;
    integration: string | null;
}

interface PageFlash {
    success?: string | null;
    error?: string | null;
    org_mcp_client_secret?: string | null;
    org_mcp_client_key?: string | null;
}

interface Props {
    can_manage_org_mcp: boolean;
    tenant_id: string;
    clients: McpClientRow[];
    integrations: McpIntegrationRow[];
    tool_catalog: ToolCatalogEntry[];
    session_base_url: string;
}

type SupportedProvider = 'gmail' | 'google_sheets' | 'slack' | 'notion' | 'hubspot' | 'linear';

const PROVIDERS: { id: SupportedProvider; label: string; description: string }[] = [
    {
        id: 'gmail',
        label: 'Gmail',
        description: 'Connector for org-scoped email tools (OAuth or service credentials JSON).',
    },
    {
        id: 'google_sheets',
        label: 'Google Sheets',
        description: 'Connector for reading spreadsheet ranges via the Google API.',
    },
    {
        id: 'slack',
        label: 'Slack',
        description: 'Connector for team channels, messages, and conversation context.',
    },
    {
        id: 'notion',
        label: 'Notion',
        description: 'Connector for internal wiki pages and team documentation.',
    },
    {
        id: 'hubspot',
        label: 'HubSpot',
        description: 'Connector for CRM entities like contacts and deals.',
    },
    {
        id: 'linear',
        label: 'Linear',
        description: 'Connector for issues, projects, and engineering workflows.',
    },
];

export default function OrganizationMcp({
    can_manage_org_mcp,
    tenant_id,
    clients,
    integrations,
    tool_catalog,
    session_base_url,
}: Props) {
    const tenantRouter = useTenantRouter();
    const page = usePage<{ flash: PageFlash }>();
    const flash = page.props.flash;

    const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
    const [revealedKey, setRevealedKey] = useState<string | null>(null);

    useEffect(() => {
        if (flash?.org_mcp_client_secret) {
            setRevealedSecret(flash.org_mcp_client_secret);
            setRevealedKey(flash.org_mcp_client_key ?? null);
            toast.message('Client secret shown once — copy it now.');
        }
    }, [flash?.org_mcp_client_secret, flash?.org_mcp_client_key]);

    const newClientForm = useForm({
        name: '',
        restrict_tools: false,
        allowed_tools: [] as string[],
    });

    const submitNewClient = (e: React.FormEvent) => {
        e.preventDefault();
        if (newClientForm.data.restrict_tools && newClientForm.data.allowed_tools.length === 0) {
            toast.error('Select at least one tool, or leave “All tools” enabled.');
            return;
        }
        const payload: { name: string; allowed_tools?: string[] } = {
            name: newClientForm.data.name,
        };
        if (newClientForm.data.restrict_tools && newClientForm.data.allowed_tools.length > 0) {
            payload.allowed_tools = newClientForm.data.allowed_tools;
        }
        router.post(tenantRouter.route('settings.organization.mcp.clients.store'), payload, {
            preserveScroll: true,
            onSuccess: () => {
                newClientForm.reset();
                newClientForm.clearErrors();
            },
            onError: (errors) => {
                newClientForm.clearErrors();
                for (const key of Object.keys(errors)) {
                    const val = errors[key];
                    const msg = Array.isArray(val) ? val.join(' ') : String(val);
                    (newClientForm as { setError: (k: string, m: string) => void }).setError(key, msg);
                }
                toast.error('Could not create client');
            },
        });
    };

    const toggleToolForNewClient = (key: string, checked: boolean) => {
        const set = new Set(newClientForm.data.allowed_tools);
        if (checked) {
            set.add(key);
        } else {
            set.delete(key);
        }
        newClientForm.setData('allowed_tools', Array.from(set));
    };

    const integrationByProvider = useMemo(() => {
        const m = new Map<string, McpIntegrationRow>();
        for (const i of integrations) {
            m.set(i.provider, i);
        }
        return m;
    }, [integrations]);

    const connectedIntegrations = useMemo(
        () =>
            PROVIDERS.map((provider) => ({
                provider,
                row: integrationByProvider.get(provider.id) ?? null,
            })).filter((entry) => entry.row !== null) as Array<{
                provider: (typeof PROVIDERS)[number];
                row: McpIntegrationRow;
            }>,
        [integrationByProvider],
    );

    const availableProviders = useMemo(
        () => PROVIDERS.filter((provider) => !integrationByProvider.has(provider.id)),
        [integrationByProvider],
    );

    const copyText = async (label: string, text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success(`${label} copied`);
        } catch {
            toast.error('Could not copy');
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="MCP & agents" />
            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="MCP & external agents"
                        description="Create API clients for machine access and configure data sources (Gmail, Sheets) used by organization-scoped MCP tools. Owners and admins can manage this page."
                    />

                    {!can_manage_org_mcp && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">View only</CardTitle>
                                <CardDescription>
                                    Only organization owners and admins can change MCP clients and integrations.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Plug className="h-5 w-5 text-muted-foreground" />
                                API usage
                            </CardTitle>
                            <CardDescription>
                                Outside agents authenticate with a client key and secret, then call the MCP endpoints with a
                                short-lived bearer token.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div>
                                <span className="text-muted-foreground">Organization ID (tenant_id for session): </span>
                                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{tenant_id}</code>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="ml-2 h-7"
                                    onClick={() => copyText('Tenant ID', tenant_id)}
                                >
                                    <Copy className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Base URL: </span>
                                <code className="rounded bg-muted px-1.5 py-0.5 text-xs break-all">{session_base_url}</code>
                            </div>
                            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                                <li>
                                    <code className="text-xs">POST /session</code> — exchange client credentials for{' '}
                                    <code className="text-xs">access_token</code>
                                </li>
                                <li>
                                    <code className="text-xs">GET /tools</code> — list tools allowed for this client
                                </li>
                                <li>
                                    <code className="text-xs">POST /tools/invoke</code> — run a tool
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    {revealedSecret && (
                        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
                            <CardHeader>
                                <CardTitle className="text-base text-amber-900 dark:text-amber-100">New client credentials</CardTitle>
                                <CardDescription>Copy these now. The secret will not be shown again.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                {revealedKey && (
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-muted-foreground">Client key</span>
                                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs break-all">{revealedKey}</code>
                                        <Button type="button" variant="outline" size="sm" onClick={() => copyText('Client key', revealedKey)}>
                                            <Copy className="mr-1 h-3.5 w-3.5" />
                                            Copy
                                        </Button>
                                    </div>
                                )}
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-muted-foreground">Client secret</span>
                                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs break-all">{revealedSecret}</code>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyText('Client secret', revealedSecret)}
                                    >
                                        <Copy className="mr-1 h-3.5 w-3.5" />
                                        Copy
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {can_manage_org_mcp && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">MCP clients</CardTitle>
                                <CardDescription>Credentials for Hermes, automation, or other external callers.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={submitNewClient} className="space-y-4 max-w-xl">
                                    <div className="space-y-2">
                                        <Label htmlFor="mcp-client-name">Name</Label>
                                        <Input
                                            id="mcp-client-name"
                                            value={newClientForm.data.name}
                                            onChange={(e) => newClientForm.setData('name', e.target.value)}
                                            placeholder="Hermes production"
                                            required
                                        />
                                        {newClientForm.errors.name && (
                                            <p className="text-sm text-destructive">{newClientForm.errors.name}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            id="mcp-restrict-tools"
                                            checked={!newClientForm.data.restrict_tools}
                                            onCheckedChange={(v) => newClientForm.setData('restrict_tools', !v)}
                                        />
                                        <Label htmlFor="mcp-restrict-tools" className="font-normal">
                                            Allow all registered tools
                                        </Label>
                                    </div>
                                    {newClientForm.data.restrict_tools && (
                                        <div className="space-y-2 rounded-lg border p-3">
                                            <p className="text-sm text-muted-foreground">Allowed tools</p>
                                            <div className="grid gap-2 sm:grid-cols-2">
                                                {tool_catalog.map((t) => (
                                                    <label key={t.key} className="flex items-start gap-2 text-sm">
                                                        <Checkbox
                                                            checked={newClientForm.data.allowed_tools.includes(t.key)}
                                                            onCheckedChange={(c) => toggleToolForNewClient(t.key, c === true)}
                                                        />
                                                        <span>
                                                            <span className="font-medium">{t.label}</span>
                                                            <code className="ml-1 text-xs text-muted-foreground">{t.key}</code>
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <Button type="submit" disabled={newClientForm.processing}>
                                        Create client
                                    </Button>
                                </form>

                                <div className="mt-8 space-y-4">
                                    {clients.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No clients yet.</p>
                                    ) : (
                                        clients.map((c) => (
                                            <ClientRow key={c.id} client={c} tool_catalog={tool_catalog} tenantRouter={tenantRouter} />
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {can_manage_org_mcp && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Data sources</CardTitle>
                                <CardDescription>
                                    Configure connectors referenced by MCP tools. Secrets are stored encrypted; the UI never shows
                                    existing credential payloads.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <h3 className="text-sm font-medium">Connected sources</h3>
                                        <p className="text-xs text-muted-foreground">
                                            Only configured integrations are shown here.
                                        </p>
                                    </div>
                                    <AddDataSourceDialog
                                        tenantRouter={tenantRouter}
                                        availableProviders={availableProviders}
                                    />
                                </div>

                                {connectedIntegrations.length === 0 ? (
                                    <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                                        No data sources connected yet. Use “Add data source” to connect one.
                                    </div>
                                ) : (
                                    connectedIntegrations.map(({ provider, row }) => (
                                        <IntegrationSection
                                            key={`${provider.id}-${row.id}-${row.updated_at ?? ''}`}
                                            provider={provider}
                                            row={row}
                                            tenantRouter={tenantRouter}
                                        />
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}

function ClientRow({
    client,
    tool_catalog,
    tenantRouter,
}: {
    client: McpClientRow;
    tool_catalog: ToolCatalogEntry[];
    tenantRouter: ReturnType<typeof useTenantRouter>;
}) {
    const [restrict, setRestrict] = useState<boolean>(
        Array.isArray(client.allowed_tools) && client.allowed_tools.length > 0,
    );
    const [selected, setSelected] = useState<string[]>(
        Array.isArray(client.allowed_tools) ? client.allowed_tools : [],
    );

    const patchClient = (data: Record<string, unknown>) => {
        tenantRouter.patch(
            'settings.organization.mcp.clients.update',
            data,
            { client: client.id },
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Saved'),
                onError: () => toast.error('Could not update client'),
            },
        );
    };

    const onToggleActive = (active: boolean) => {
        patchClient({ is_active: active });
    };

    const saveTools = () => {
        if (restrict && selected.length === 0) {
            toast.error('Pick at least one tool or disable restriction.');
            return;
        }
        patchClient({
            allowed_tools: restrict ? selected : null,
        });
    };

    return (
        <div className="rounded-lg border p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <div className="font-medium">{client.name}</div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <code className="rounded bg-muted px-1 py-0.5">{client.client_key}</code>
                        {client.is_active ? (
                            <Badge variant="secondary">Active</Badge>
                        ) : (
                            <Badge variant="outline">Inactive</Badge>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Active</Label>
                    <Switch checked={client.is_active} onCheckedChange={onToggleActive} />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => {
                            if (!confirm('Delete this MCP client? External callers using it will stop working.')) return;
                            tenantRouter.delete(
                                'settings.organization.mcp.clients.destroy',
                                { client: client.id },
                                {
                                    preserveScroll: true,
                                    onSuccess: () => toast.success('Client removed'),
                                    onError: () => toast.error('Could not remove'),
                                },
                            );
                        }}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Switch
                    checked={!restrict}
                    onCheckedChange={(v) => {
                        setRestrict(!v);
                        if (v) {
                            setSelected([]);
                            patchClient({ allowed_tools: null });
                        }
                    }}
                />
                <span className="text-sm text-muted-foreground">Allow all tools</span>
            </div>
            {restrict && (
                <div className="space-y-2">
                    <div className="grid gap-2 sm:grid-cols-2">
                        {tool_catalog.map((t) => (
                            <label key={t.key} className="flex items-start gap-2 text-sm">
                                <Checkbox
                                    checked={selected.includes(t.key)}
                                    onCheckedChange={(c) => {
                                        if (c === true) {
                                            setSelected((s) => [...s, t.key]);
                                        } else {
                                            setSelected((s) => s.filter((k) => k !== t.key));
                                        }
                                    }}
                                />
                                <span>{t.label}</span>
                            </label>
                        ))}
                    </div>
                    <Button type="button" size="sm" variant="secondary" onClick={saveTools}>
                        Save tool access
                    </Button>
                </div>
            )}
        </div>
    );
}

function IntegrationSection({
    provider,
    row,
    tenantRouter,
}: {
    provider: (typeof PROVIDERS)[number];
    row: McpIntegrationRow;
    tenantRouter: ReturnType<typeof useTenantRouter>;
}) {
    const editForm = useForm({
        status: row.status as 'active' | 'inactive',
        credentials_json: '',
        clear_credentials: false,
    });

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        const url = tenantRouter.route('settings.organization.mcp.integrations.update', { integration: row.id });
        const payload: {
            status: 'active' | 'inactive';
            credentials_json?: string;
            clear_credentials: boolean;
        } = {
            status: editForm.data.status,
            clear_credentials: editForm.data.clear_credentials,
        };
        if (editForm.data.credentials_json.trim() !== '') {
            payload.credentials_json = editForm.data.credentials_json;
        }
        router.patch(url, payload, {
            preserveScroll: true,
            onSuccess: () => {
                editForm.setData('credentials_json', '');
                editForm.setData('clear_credentials', false);
                toast.success('Updated');
            },
            onError: (errors) => {
                editForm.clearErrors();
                for (const key of Object.keys(errors)) {
                    const val = errors[key];
                    const msg = Array.isArray(val) ? val.join(' ') : String(val);
                    (editForm as { setError: (k: string, m: string) => void }).setError(key, msg);
                }
                toast.error('Could not update');
            },
        });
    };

    return (
        <div className="rounded-lg border p-4 space-y-3">
            <div>
                <h3 className="font-medium">{provider.label}</h3>
                <p className="text-sm text-muted-foreground">{provider.description}</p>
            </div>
            <form onSubmit={submitEdit} className="space-y-3 max-w-xl">
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge variant={row.has_credentials ? 'secondary' : 'outline'}>
                        {row.has_credentials ? 'Credentials on file' : 'No credentials stored'}
                    </Badge>
                    {row.updated_at && <span>Updated {row.updated_at}</span>}
                </div>
                <div className="space-y-2">
                    <Label>Status</Label>
                    <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                        value={editForm.data.status}
                        onChange={(e) =>
                            editForm.setData('status', e.target.value as 'active' | 'inactive')
                        }
                    >
                        <option value="inactive">Inactive</option>
                        <option value="active">Active</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <Label>Replace credentials (JSON)</Label>
                    <Textarea
                        value={editForm.data.credentials_json}
                        onChange={(e) => editForm.setData('credentials_json', e.target.value)}
                        placeholder="Leave empty to keep existing. Paste new JSON to replace."
                        rows={5}
                        className="font-mono text-xs"
                    />
                </div>
                <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                        checked={editForm.data.clear_credentials}
                        onCheckedChange={(c) => editForm.setData('clear_credentials', c === true)}
                    />
                    Clear stored credentials
                </label>
                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                            tenantRouter.post(
                                'settings.organization.mcp.integrations.test',
                                {},
                                { integration: row.id },
                                {
                                    preserveScroll: true,
                                    onSuccess: (page: { props?: { flash?: { success?: string; error?: string } } }) => {
                                        const flash = (page.props as { flash?: { success?: string; error?: string } }).flash;
                                        if (flash?.error) {
                                            toast.error(flash.error);
                                            return;
                                        }
                                        if (flash?.success) {
                                            toast.success(flash.success);
                                            return;
                                        }
                                        toast.message('Connection test finished.');
                                    },
                                    onError: () => toast.error('Connection test failed'),
                                },
                            );
                        }}
                    >
                        Test connection
                    </Button>
                    <Button type="submit" size="sm" disabled={editForm.processing}>
                        Update
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            if (!confirm('Remove this data source configuration?')) return;
                            tenantRouter.delete(
                                'settings.organization.mcp.integrations.destroy',
                                { integration: row.id },
                                {
                                    preserveScroll: true,
                                    onSuccess: () => toast.success('Removed'),
                                    onError: () => toast.error('Could not remove'),
                                },
                            );
                        }}
                    >
                        Remove
                    </Button>
                </div>
            </form>
        </div>
    );
}

function AddDataSourceDialog({
    tenantRouter,
    availableProviders,
}: {
    tenantRouter: ReturnType<typeof useTenantRouter>;
    availableProviders: Array<(typeof PROVIDERS)[number]>;
}) {
    const [open, setOpen] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<SupportedProvider | ''>(availableProviders[0]?.id ?? '');
    const form = useForm({
        status: 'inactive' as 'active' | 'inactive',
        credentials_json: '',
    });

    useEffect(() => {
        const nextDefault = availableProviders[0]?.id ?? '';
        setSelectedProvider(nextDefault);
    }, [availableProviders]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedProvider === '') {
            toast.error('No available providers left to add.');
            return;
        }

        router.post(tenantRouter.route('settings.organization.mcp.integrations.store'), {
            provider: selectedProvider,
            status: form.data.status,
            credentials_json: form.data.credentials_json,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                setOpen(false);
                toast.success('Data source added');
            },
            onError: () => toast.error('Could not add data source'),
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button type="button" size="sm" disabled={availableProviders.length === 0}>
                    Add data source
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[min(92vw,42rem)] max-h-[85vh] overflow-y-auto overflow-x-hidden">
                <DialogHeader>
                    <DialogTitle>Add data source</DialogTitle>
                    <DialogDescription>
                        Connect a new provider for organization-level MCP tools.
                    </DialogDescription>
                </DialogHeader>

                {availableProviders.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                        All supported providers are already connected.
                    </div>
                ) : (
                    <form onSubmit={submit} className="space-y-3">
                        <div className="space-y-2">
                            <Label>Provider</Label>
                            <select
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                value={selectedProvider}
                                onChange={(e) => {
                                    const next = e.target.value as SupportedProvider;
                                    setSelectedProvider(next);
                                }}
                            >
                                {availableProviders.map((provider) => (
                                    <option key={provider.id} value={provider.id}>
                                        {provider.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label>Status</Label>
                            <select
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                value={form.data.status}
                                onChange={(e) =>
                                    form.setData('status', e.target.value as 'active' | 'inactive')
                                }
                            >
                                <option value="inactive">Inactive</option>
                                <option value="active">Active</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label>Credentials (JSON)</Label>
                            <Textarea
                                value={form.data.credentials_json}
                                onChange={(e) => form.setData('credentials_json', e.target.value)}
                                placeholder='{"api_key": "..."}'
                                rows={5}
                                className="w-full min-w-0 font-mono text-xs max-h-64 min-h-24 resize-y overflow-auto break-all"
                            />
                        </div>

                        <DialogFooter>
                            <Button type="submit" disabled={form.processing}>
                                Add source
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
