import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BookMarked, Globe2, LayoutGrid, Map, Search, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

type RouteRow = {
    methods: string[];
    uri: string;
    name: string | null;
    action: string;
    middleware: string[];
    area: string;
    title: string | null;
    description: string | null;
    documented: boolean;
};

type Stats = {
    total: number;
    documented: number;
    undocumented: number;
    by_area: Record<string, number>;
};

interface Props {
    routes: RouteRow[];
    stats: Stats;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Route catalog', href: '/admin/route-catalog' },
];

const areaMeta: Record<string, { label: string; icon: typeof Globe2; className: string }> = {
    app: {
        label: 'App (central)',
        icon: Globe2,
        className: 'border-sky-500/30 bg-sky-500/5 text-sky-700 dark:text-sky-300',
    },
    admin: {
        label: 'Admin',
        icon: Shield,
        className: 'border-violet-500/30 bg-violet-500/5 text-violet-700 dark:text-violet-300',
    },
    tenant: {
        label: 'Tenant',
        icon: LayoutGrid,
        className: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300',
    },
};

function methodBadgeClass(m: string): string {
    if (m === 'GET') return 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200';
    if (m === 'POST') return 'bg-amber-500/15 text-amber-900 dark:text-amber-200';
    if (m === 'PUT' || m === 'PATCH') return 'bg-sky-500/15 text-sky-900 dark:text-sky-200';
    if (m === 'DELETE') return 'bg-rose-500/15 text-rose-900 dark:text-rose-200';
    return 'bg-muted text-muted-foreground';
}

export default function AdminRouteCatalog({ routes, stats }: Props) {
    const [query, setQuery] = useState('');
    const [area, setArea] = useState<string>('all');
    const [docFilter, setDocFilter] = useState<string>('all');

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return routes.filter((r) => {
            if (area !== 'all' && r.area !== area) return false;
            if (docFilter === 'documented' && !r.documented) return false;
            if (docFilter === 'undocumented' && r.documented) return false;
            if (!q) return true;
            const hay = [
                r.uri,
                r.name ?? '',
                r.action,
                r.title ?? '',
                r.description ?? '',
                ...r.methods,
                ...r.middleware,
            ]
                .join(' ')
                .toLowerCase();
            return hay.includes(q);
        });
    }, [routes, query, area, docFilter]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Route catalog" />

            <div className="mx-auto flex max-w-7xl flex-col gap-8 p-4 pb-12">
                <header className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-muted/40 via-background to-background p-6 shadow-sm sm:p-8">
                    <div
                        className="pointer-events-none absolute inset-0 opacity-[0.12] dark:opacity-[0.08]"
                        style={{
                            backgroundImage: `radial-gradient(circle at 20% 20%, hsl(var(--primary)) 0, transparent 45%), radial-gradient(circle at 80% 0%, hsl(var(--primary)) 0, transparent 40%)`,
                        }}
                    />
                    <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
                                <Map className="size-3.5" aria-hidden />
                                Code-first registry
                            </div>
                            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Route catalog</h1>
                            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                                One row per registered route (not per user-generated record). Add{' '}
                                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">#[RouteCatalogEntry]</code> on
                                controller actions to document purpose; everything else stays discoverable here.
                            </p>
                        </div>
                        <Badge variant="secondary" className="w-fit shrink-0 gap-1.5 px-3 py-1.5 text-xs font-normal">
                            <BookMarked className="size-3.5" />
                            {stats.documented} / {stats.total} documented
                        </Badge>
                    </div>

                    <div className="relative mt-6 grid gap-3 sm:grid-cols-3">
                        <Card className="border-border/80 bg-background/70 shadow-none backdrop-blur">
                            <CardHeader className="pb-2">
                                <CardDescription>Total routes</CardDescription>
                                <CardTitle className="text-3xl tabular-nums">{stats.total}</CardTitle>
                            </CardHeader>
                        </Card>
                        <Card className="border-border/80 bg-background/70 shadow-none backdrop-blur">
                            <CardHeader className="pb-2">
                                <CardDescription>By surface</CardDescription>
                                <div className="mt-2 flex flex-wrap gap-2 text-sm">
                                    <span className="rounded-md bg-muted px-2 py-0.5">App {stats.by_area.app ?? 0}</span>
                                    <span className="rounded-md bg-muted px-2 py-0.5">Admin {stats.by_area.admin ?? 0}</span>
                                    <span className="rounded-md bg-muted px-2 py-0.5">Tenant {stats.by_area.tenant ?? 0}</span>
                                </div>
                            </CardHeader>
                        </Card>
                        <Card className="border-border/80 bg-background/70 shadow-none backdrop-blur">
                            <CardHeader className="pb-2">
                                <CardDescription>Documentation</CardDescription>
                                <CardTitle className="text-base font-medium text-muted-foreground">
                                    {stats.undocumented} without{' '}
                                    <code className="font-mono text-xs">RouteCatalogEntry</code>
                                </CardTitle>
                            </CardHeader>
                        </Card>
                    </div>
                </header>

                <Card className="border-border/80 shadow-sm">
                    <CardHeader className="space-y-4 pb-4">
                        <CardTitle className="text-lg">Filters</CardTitle>
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                            <div className="min-w-0 flex-1 space-y-2">
                                <Label htmlFor="route-search">Search</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="route-search"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="URI, name, middleware, action…"
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                            <div className="grid w-full gap-4 sm:grid-cols-2 lg:w-auto lg:min-w-[420px]">
                                <div className="space-y-2">
                                    <Label>Area</Label>
                                    <Select value={area} onValueChange={setArea}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All areas</SelectItem>
                                            <SelectItem value="app">App (central)</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                            <SelectItem value="tenant">Tenant</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Docs</Label>
                                    <Select value={docFilter} onValueChange={setDocFilter}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All</SelectItem>
                                            <SelectItem value="documented">Documented only</SelectItem>
                                            <SelectItem value="undocumented">Undocumented only</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <Button type="button" variant="outline" className="shrink-0" onClick={() => { setQuery(''); setArea('all'); setDocFilter('all'); }}>
                                Reset
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Showing <span className="font-medium text-foreground">{filtered.length}</span> of {routes.length} routes.
                        </p>
                    </CardHeader>
                    <CardContent className="px-0 pb-4">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-[100px]">Area</TableHead>
                                        <TableHead className="min-w-[120px]">Methods</TableHead>
                                        <TableHead className="min-w-[220px]">URI</TableHead>
                                        <TableHead className="min-w-[160px]">Name</TableHead>
                                        <TableHead className="min-w-[280px]">What it is</TableHead>
                                        <TableHead className="min-w-[200px]">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map((r, i) => {
                                        const meta = areaMeta[r.area] ?? areaMeta.app;
                                        const Icon = meta.icon;
                                        return (
                                            <TableRow key={`${r.uri}-${r.methods.join(',')}-${i}`} className="align-top">
                                                <TableCell>
                                                    <span
                                                        className={cn(
                                                            'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
                                                            meta.className,
                                                        )}
                                                    >
                                                        <Icon className="size-3" aria-hidden />
                                                        {meta.label}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {r.methods.map((m) => (
                                                            <Badge
                                                                key={m}
                                                                variant="secondary"
                                                                className={cn('font-mono text-[10px]', methodBadgeClass(m))}
                                                            >
                                                                {m}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs text-foreground">{r.uri}</TableCell>
                                                <TableCell className="font-mono text-xs text-muted-foreground">{r.name ?? '—'}</TableCell>
                                                <TableCell>
                                                    {r.documented && r.title ? (
                                                        <div>
                                                            <p className="font-medium text-foreground">{r.title}</p>
                                                            {r.description ? (
                                                                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{r.description}</p>
                                                            ) : null}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground italic">Add #[RouteCatalogEntry] on the action</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="max-w-[320px] break-all font-mono text-[11px] text-muted-foreground">
                                                    {r.action}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
