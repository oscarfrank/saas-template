import { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import {
    Plus,
    ScrollText,
    MoreHorizontal,
    Pencil,
    Copy,
    Trash2,
    Youtube,
    Video,
    FileText,
    Search,
    LayoutGrid,
    List,
    RotateCcw,
    CalendarDays,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Scripts', href: '/script' },
];

/** Script item – from DB */
export interface ScriptItem {
    id: number;
    uuid: string;
    title: string;
    excerpt: string;
    platform: 'youtube' | 'tiktok' | 'instagram' | 'general' | 'podcast';
    updatedAt: string;
    script_type_id?: number | null;
    deleted_at?: string;
    deleted_at_human?: string;
}

const platformConfig: Record<string, { label: string; icon: typeof Youtube; className: string }> = {
    youtube: { label: 'YouTube', icon: Youtube, className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' },
    tiktok: { label: 'TikTok', icon: Video, className: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20' },
    instagram: { label: 'Instagram', icon: Video, className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
    podcast: { label: 'Podcast', icon: FileText, className: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20' },
    general: { label: 'General', icon: ScrollText, className: 'bg-muted text-muted-foreground border-border' },
};

interface Props {
    scripts: ScriptItem[];
    trashed?: boolean;
}

function filterScripts(scripts: ScriptItem[], query: string): ScriptItem[] {
    const q = query.trim().toLowerCase();
    if (!q) return scripts;
    return scripts.filter((s) => {
        const label = platformConfig[s.platform].label.toLowerCase();
        return (
            s.title.toLowerCase().includes(q) ||
            s.excerpt.toLowerCase().includes(q) ||
            label.includes(q)
        );
    });
}

function ScriptCard({
    script,
    tenantRouter,
    trashed,
}: {
    script: ScriptItem;
    tenantRouter: ReturnType<typeof useTenantRouter>;
    trashed?: boolean;
}) {
    const platform = platformConfig[script.platform] ?? platformConfig.general;
    const PlatformIcon = platform.icon;
    const editUrl = tenantRouter.route('script.edit', { script: script.uuid });
    const card = (
        <Card className={`group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md ${!trashed ? 'cursor-pointer' : ''}`}>
            <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
                <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="font-semibold leading-tight line-clamp-2">{script.title}</h3>
                    <Badge variant="outline" className={`w-fit text-xs ${platform.className}`}>
                        <PlatformIcon className="mr-1 h-3 w-3" />
                        {platform.label}
                    </Badge>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {trashed ? (
                            <>
                                <DropdownMenuItem
                                    className="cursor-pointer gap-2"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        router.post(tenantRouter.route('script.restore', { script: script.uuid }));
                                    }}
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    Restore
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (window.confirm('Permanently delete this script? This cannot be undone and will remove all title options, thumbnails, and content.')) {
                                            router.delete(tenantRouter.route('script.force-destroy', { script: script.uuid }));
                                        }
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete permanently
                                </DropdownMenuItem>
                            </>
                        ) : (
                            <>
                                <DropdownMenuItem className="cursor-pointer gap-2" asChild>
                                    <Link href={editUrl}>
                                        <Pencil className="h-4 w-4" />
                                        Edit
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer gap-2">
                                    <Copy className="h-4 w-4" />
                                    Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (window.confirm('Move this script to the recycle bin? You can restore it later.')) {
                                            router.delete(tenantRouter.route('script.destroy', { script: script.uuid }));
                                        }
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent className="flex-1 pt-0">
                <p className="text-muted-foreground line-clamp-3 text-sm">{script.excerpt}</p>
                <p className="text-muted-foreground/80 mt-3 text-xs">
                    {trashed && script.deleted_at_human ? `Deleted ${script.deleted_at_human}` : `Updated ${script.updatedAt}`}
                </p>
            </CardContent>
        </Card>
    );
    if (trashed) return card;
    return <Link href={editUrl}>{card}</Link>;
}

export default function ScriptIndex({ scripts: scriptsFromServer = [], trashed = false }: Props) {
    const tenantRouter = useTenantRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const scripts = Array.isArray(scriptsFromServer) ? scriptsFromServer : [];
    const filteredScripts = useMemo(() => filterScripts(scripts, searchQuery), [scripts, searchQuery]);
    const isEmpty = scripts.length === 0;
    const noSearchResults = !isEmpty && filteredScripts.length === 0;
    const scriptsIndexUrl = tenantRouter.route('script.index');
    const recycleBinUrl = tenantRouter.route('script.index', { trashed: 1 });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={trashed ? 'Recycle bin' : 'Scripts'} />
            <div className="flex h-full flex-1 flex-col gap-8 p-4 md:p-6 lg:p-8">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                                {trashed ? 'Recycle bin' : 'Scripts'}
                            </h1>
                            {trashed ? (
                                <Link href={scriptsIndexUrl}>
                                    <Button variant="ghost" size="sm">Back to Scripts</Button>
                                </Link>
                            ) : (
                                <Link href={recycleBinUrl}>
                                    <Button variant="outline" size="sm" className="gap-1.5">
                                        <Trash2 className="h-4 w-4" />
                                        Recycle bin
                                    </Button>
                                </Link>
                            )}
                        </div>
                        <p className="text-muted-foreground max-w-xl text-sm md:text-base">
                            {trashed
                                ? 'Restore or permanently delete scripts. Items here are automatically removed after 30 days.'
                                : 'Write, refine, and export scripts for YouTube, TikTok, podcasts, and more. One place for all your content.'}
                        </p>
                    </div>
                    {!trashed && (
                        <div className="flex flex-wrap items-center gap-2">
                            <Link href={tenantRouter.route('script.create')}>
                                <Button className="cursor-pointer gap-2 shadow-sm">
                                    <Plus className="h-4 w-4" />
                                    New script
                                </Button>
                            </Link>
                            <Link href={tenantRouter.route('script.calendar')}>
                                <Button variant="outline" size="sm" className="cursor-pointer gap-1.5">
                                    <CalendarDays className="h-4 w-4" />
                                    Calendar
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Search + view toggle */}
                {!isEmpty && (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative flex-1 sm:max-w-xs lg:max-w-sm">
                            <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                            <Input
                                type="search"
                                placeholder="Search scripts..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <ToggleGroup
                            type="single"
                            value={viewMode}
                            onValueChange={(v) => v && setViewMode(v as 'grid' | 'list')}
                            className="justify-start"
                        >
                            <ToggleGroupItem value="grid" aria-label="Grid view">
                                <LayoutGrid className="h-4 w-4" />
                            </ToggleGroupItem>
                            <ToggleGroupItem value="list" aria-label="List view">
                                <List className="h-4 w-4" />
                            </ToggleGroupItem>
                        </ToggleGroup>
                    </div>
                )}

                {/* Content */}
                {isEmpty ? (
                    /* Empty state */
                    <Card className="border-dashed bg-muted/30">
                        <CardContent className="flex flex-col items-center justify-center gap-6 py-16 px-6 text-center">
                            <div className="rounded-full bg-primary/10 p-4">
                                {trashed ? (
                                    <Trash2 className="h-10 w-10 text-muted-foreground" />
                                ) : (
                                    <ScrollText className="h-10 w-10 text-primary" />
                                )}
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-lg font-semibold">
                                    {trashed ? 'No deleted scripts' : 'No scripts yet'}
                                </h2>
                                <p className="text-muted-foreground max-w-sm text-sm">
                                    {trashed
                                        ? 'Deleted scripts are removed automatically after 30 days.'
                                        : 'Create your first script to get started. Use the editor to write, generate title ideas, and export descriptions.'}
                                </p>
                            </div>
                            {!trashed && (
                                <Link href={tenantRouter.route('script.create')}>
                                    <Button size="lg" className="cursor-pointer gap-2">
                                        <Plus className="h-4 w-4" />
                                        Create your first script
                                    </Button>
                                </Link>
                            )}
                            {trashed && (
                                <Link href={scriptsIndexUrl}>
                                    <Button variant="outline" size="lg">Back to Scripts</Button>
                                </Link>
                            )}
                        </CardContent>
                    </Card>
                ) : noSearchResults ? (
                    <Card className="border-dashed bg-muted/20">
                        <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                            <Search className="text-muted-foreground h-10 w-10" />
                            <div className="space-y-1">
                                <h3 className="font-medium">No scripts match your search</h3>
                                <p className="text-muted-foreground text-sm">
                                    Try a different term or clear the search to see all scripts.
                                </p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>
                                Clear search
                            </Button>
                        </CardContent>
                    </Card>
                ) : viewMode === 'grid' ? (
                    /* Grid of script cards */
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {!trashed && (
                        <Link href={tenantRouter.route('script.create')} className="block">
                            <Card className="h-full cursor-pointer border-dashed bg-muted/20 transition-colors hover:border-primary/40 hover:bg-muted/40">
                                <CardContent className="flex flex-col items-center justify-center gap-3 py-12">
                                    <div className="rounded-full border-2 border-dashed border-muted-foreground/30 p-4">
                                        <Plus className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <span className="font-medium text-muted-foreground">New script</span>
                                    <span className="text-center text-sm text-muted-foreground">Start from scratch</span>
                                </CardContent>
                            </Card>
                        </Link>
                        )}
                        {filteredScripts.map((script) => (
                            <ScriptCard key={script.id} script={script} tenantRouter={tenantRouter} trashed={trashed} />
                        ))}
                    </div>
                ) : (
                    /* List view */
                    <div className="flex flex-col gap-2">
                        {!trashed && (
                        <Link href={tenantRouter.route('script.create')}>
                            <Card className="cursor-pointer border-dashed bg-muted/20 transition-colors hover:border-primary/40 hover:bg-muted/40">
                                <CardContent className="flex flex-row items-center gap-4 py-4">
                                    <div className="rounded-full border-2 border-dashed border-muted-foreground/30 p-3">
                                        <Plus className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-muted-foreground">New script</p>
                                        <p className="text-sm text-muted-foreground">Start from scratch</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                        )}
                        {filteredScripts.map((script) => (
                            <ScriptCard
                                key={script.id}
                                script={script}
                                tenantRouter={tenantRouter}
                                trashed={trashed}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
