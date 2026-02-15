import { useState, useMemo, useEffect, useRef } from 'react';
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
    MoreVertical,
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
    Download,
    ArrowDownAZ,
    Filter,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Scripts', href: '/script' },
];

/** Script item – from DB */
export interface ScriptItem {
    id: number;
    uuid: string;
    title: string;
    excerpt: string;
    platform: 'long-form' | 'shorts';
    updatedAt: string;
    script_type_id?: number | null;
    status?: string | null;
    production_status?: string | null;
    created_at?: string | null;
    scheduled_at?: string | null;
    deleted_at?: string;
    deleted_at_human?: string;
}

export interface ScriptTypeOption {
    id: number;
    name: string;
    slug: string;
}

export interface ScriptFilters {
    search: string | null;
    script_type_id: number[];
    status: string[];
    production_status: string[];
    date_field: string | null;
    date_from: string | null;
    date_to: string | null;
}

const SORT_OPTIONS = [
    { value: 'updated_desc', label: 'Newest updated' },
    { value: 'updated_asc', label: 'Oldest updated' },
    { value: 'created_desc', label: 'Newest first' },
    { value: 'created_asc', label: 'Oldest first' },
    { value: 'title_asc', label: 'Title A–Z' },
    { value: 'title_desc', label: 'Title Z–A' },
    { value: 'scheduled_desc', label: 'Scheduled (latest)' },
    { value: 'scheduled_asc', label: 'Scheduled (earliest)' },
] as const;

const TRASHED_SORT_OPTIONS = [
    { value: 'deleted_desc', label: 'Deleted (newest)' },
    { value: 'deleted_asc', label: 'Deleted (oldest)' },
];

const STATUS_OPTIONS: { value: string; label: string }[] = [
    { value: 'draft', label: 'Draft' },
    { value: 'writing', label: 'Writing' },
    { value: 'completed', label: 'Completed' },
    { value: 'published', label: 'Published' },
    { value: 'in_review', label: 'In review' },
    { value: 'archived', label: 'Archived' },
];

const PRODUCTION_OPTIONS: { value: string; label: string }[] = [
    { value: 'not_shot', label: 'Not shot' },
    { value: 'shot', label: 'Shot' },
    { value: 'editing', label: 'Editing' },
    { value: 'edited', label: 'Edited' },
];

const DATE_FIELD_OPTIONS: { value: string; label: string }[] = [
    { value: 'created_at', label: 'Created' },
    { value: 'updated_at', label: 'Updated' },
    { value: 'scheduled_at', label: 'Scheduled' },
];

function ensureNumberArray(v: unknown): number[] {
    if (Array.isArray(v)) return v.map((x) => Number(x)).filter((n) => !Number.isNaN(n));
    if (typeof v === 'number' && !Number.isNaN(v)) return [v];
    return [];
}
function ensureStringArray(v: unknown): string[] {
    if (Array.isArray(v)) return v.filter((x) => typeof x === 'string');
    if (typeof v === 'string' && v !== '') return [v];
    return [];
}

function FilterPopover({
    scriptTypes,
    filters,
    trashed,
    onApply,
}: {
    scriptTypes: ScriptTypeOption[];
    filters: ScriptFilters;
    trashed: boolean;
    onApply: (next: Record<string, unknown>) => void;
    hasActiveFilters: boolean;
}) {
    const appliedCategoryIds = useMemo(() => ensureNumberArray(filters.script_type_id), [filters.script_type_id]);
    const appliedStatuses = useMemo(() => ensureStringArray(filters.status), [filters.status]);
    const appliedProductionStatuses = useMemo(() => ensureStringArray(filters.production_status), [filters.production_status]);

    const [open, setOpen] = useState(false);
    const [categoryIds, setCategoryIds] = useState<number[]>(appliedCategoryIds);
    const [statuses, setStatuses] = useState<string[]>(appliedStatuses);
    const [productionStatuses, setProductionStatuses] = useState<string[]>(appliedProductionStatuses);
    const [dateField, setDateField] = useState<string | null>(filters.date_field ?? null);
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo, setDateTo] = useState(filters.date_to ?? '');

    useEffect(() => {
        if (open) {
            setCategoryIds(appliedCategoryIds);
            setStatuses(appliedStatuses);
            setProductionStatuses(appliedProductionStatuses);
            setDateField(filters.date_field ?? null);
            setDateFrom(filters.date_from ?? '');
            setDateTo(filters.date_to ?? '');
        }
    }, [open, appliedCategoryIds, appliedStatuses, appliedProductionStatuses, filters.date_field, filters.date_from, filters.date_to]);

    const toggleCategory = (id: number) => {
        setCategoryIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };
    const toggleStatus = (value: string) => {
        setStatuses((prev) => (prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]));
    };
    const toggleProduction = (value: string) => {
        setProductionStatuses((prev) => (prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]));
    };

    const handleApply = () => {
        onApply({
            script_type_id: categoryIds,
            status: statuses,
            production_status: productionStatuses,
            date_field: dateField || null,
            date_from: dateFrom || null,
            date_to: dateTo || null,
        });
        setOpen(false);
    };

    if (trashed) return null;

    const activeCount =
        (appliedCategoryIds.length > 0 ? 1 : 0) +
        (appliedStatuses.length > 0 ? 1 : 0) +
        (appliedProductionStatuses.length > 0 ? 1 : 0) +
        (filters.date_field && (filters.date_from || filters.date_to) ? 1 : 0);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5" aria-label="Filter">
                    <Filter className="h-4 w-4" />
                    Filter
                    {activeCount > 0 && (
                        <span className="bg-primary text-primary-foreground rounded-full px-1.5 py-0 text-xs">
                            {activeCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-80">
                <div className="space-y-4">
                    {scriptTypes.length > 0 && (
                        <div className="space-y-2">
                            <Label className="text-xs font-medium">Category</Label>
                            <div className="flex flex-wrap gap-2">
                                {scriptTypes.map((t) => (
                                    <label key={t.id} className="flex cursor-pointer items-center gap-2">
                                        <Checkbox
                                            checked={categoryIds.includes(t.id)}
                                            onCheckedChange={() => toggleCategory(t.id)}
                                        />
                                        <span className="text-sm">{t.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label className="text-xs font-medium">Status</Label>
                        <div className="flex flex-wrap gap-2">
                            {STATUS_OPTIONS.map((o) => (
                                <label key={o.value} className="flex cursor-pointer items-center gap-2">
                                    <Checkbox
                                        checked={statuses.includes(o.value)}
                                        onCheckedChange={() => toggleStatus(o.value)}
                                    />
                                    <span className="text-sm">{o.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-medium">Production</Label>
                        <div className="flex flex-wrap gap-2">
                            {PRODUCTION_OPTIONS.map((o) => (
                                <label key={o.value} className="flex cursor-pointer items-center gap-2">
                                    <Checkbox
                                        checked={productionStatuses.includes(o.value)}
                                        onCheckedChange={() => toggleProduction(o.value)}
                                    />
                                    <span className="text-sm">{o.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-medium">Date range</Label>
                        <select
                            className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                            value={dateField ?? ''}
                            onChange={(e) => setDateField(e.target.value || null)}
                        >
                            <option value="">Any date</option>
                            {DATE_FIELD_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                        {(dateField ?? '') !== '' && (
                            <div className="flex gap-2">
                                <Input
                                    type="date"
                                    placeholder="From"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="text-sm"
                                />
                                <Input
                                    type="date"
                                    placeholder="To"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="text-sm"
                                />
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button size="sm" onClick={handleApply}>
                            Apply
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

/** Skeleton for one script card in grid view */
function ScriptCardSkeleton() {
    return (
        <Card className="overflow-hidden">
            <CardHeader className="space-y-2 pb-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-5 w-16 rounded-full" />
            </CardHeader>
            <CardContent className="pt-0">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="mt-3 h-3 w-24" />
            </CardContent>
        </Card>
    );
}

/** Skeleton for one script row in list view */
function ScriptListRowSkeleton() {
    return (
        <Card>
            <CardContent className="flex flex-row items-center gap-4 py-4">
                <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
            </CardContent>
        </Card>
    );
}

const platformConfig: Record<string, { label: string; icon: typeof Youtube; className: string }> = {
    'long-form': { label: 'Long Form', icon: FileText, className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
    shorts: { label: 'Shorts', icon: Video, className: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20' },
};

interface Props {
    scripts: ScriptItem[];
    trashed?: boolean;
    scriptTypes?: ScriptTypeOption[];
    filters?: ScriptFilters;
    sort?: string;
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
    const platform = platformConfig[script.platform] ?? platformConfig['long-form'];
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
                                    className="cursor-pointer gap-2"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        const url = tenantRouter.route('script.export', { script: script.uuid, format: 'json' });
                                        window.location.href = url;
                                    }}
                                >
                                    <Download className="h-4 w-4" />
                                    Export JSON
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="cursor-pointer gap-2"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        const url = tenantRouter.route('script.export', { script: script.uuid, format: 'csv' });
                                        window.location.href = url;
                                    }}
                                >
                                    <Download className="h-4 w-4" />
                                    Export CSV
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

const defaultFilters: ScriptFilters = {
    search: null,
    script_type_id: [],
    status: [],
    production_status: [],
    date_field: null,
    date_from: null,
    date_to: null,
};

export default function ScriptIndex({
    scripts: scriptsFromServer = [],
    trashed = false,
    scriptTypes = [],
    filters: filtersFromServer,
    sort: sortFromServer = 'updated_desc',
}: Props) {
    const tenantRouter = useTenantRouter();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [deleteAllOpen, setDeleteAllOpen] = useState(false);
    const [emptyTrashOpen, setEmptyTrashOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastSentSearchRef = useRef<string | undefined>(undefined);

    const filters = filtersFromServer ?? defaultFilters;
    const sort = trashed ? (sortFromServer === 'updated_desc' || sortFromServer === 'updated_asc' ? 'deleted_desc' : sortFromServer) : sortFromServer;

    const [searchInput, setSearchInput] = useState(filters.search ?? '');
    useEffect(() => {
        const serverSearch = filters.search ?? '';
        if (lastSentSearchRef.current === undefined) {
            lastSentSearchRef.current = serverSearch;
            setSearchInput(serverSearch);
        } else if (serverSearch === lastSentSearchRef.current) {
            setSearchInput(serverSearch);
        }
    }, [filters.search]);

    const scripts = Array.isArray(scriptsFromServer) ? scriptsFromServer : [];
    const isEmpty = scripts.length === 0;
    const hasActiveFilters =
        (filters.search != null && filters.search !== '') ||
        (filters.script_type_id?.length ?? 0) > 0 ||
        (filters.status?.length ?? 0) > 0 ||
        (filters.production_status?.length ?? 0) > 0 ||
        (filters.date_field != null && (filters.date_from != null || filters.date_to != null));
    const scriptCount = scripts.length;
    const noSearchResults = hasActiveFilters && isEmpty;
    const scriptsIndexUrl = tenantRouter.route('script.index');
    const recycleBinUrl = tenantRouter.route('script.index', { trashed: 1 });

    const buildQuery = (overrides: Record<string, unknown> = {}) => {
        const trashedParam = trashed ? { trashed: 1 } : {};
        const search = overrides.search !== undefined ? (overrides.search as string) : (filters.search ?? '');
        const scriptTypeId = overrides.script_type_id !== undefined ? (overrides.script_type_id as number[]) : (filters.script_type_id ?? []);
        const status = overrides.status !== undefined ? (overrides.status as string[]) : (filters.status ?? []);
        const productionStatus = overrides.production_status !== undefined ? (overrides.production_status as string[]) : (filters.production_status ?? []);
        const dateField = overrides.date_field !== undefined ? (overrides.date_field as string | null) : (filters.date_field ?? null);
        const dateFrom = overrides.date_from !== undefined ? (overrides.date_from as string | null) : (filters.date_from ?? null);
        const dateTo = overrides.date_to !== undefined ? (overrides.date_to as string | null) : (filters.date_to ?? null);
        const sortParam = overrides.sort !== undefined ? (overrides.sort as string) : sort;

        const params: Record<string, unknown> = { ...trashedParam, sort: sortParam };
        if (search) params.search = search;
        if (scriptTypeId.length > 0) params.script_type_id = scriptTypeId;
        if (status.length > 0) params.status = status;
        if (productionStatus.length > 0) params.production_status = productionStatus;
        if (dateField && (dateFrom || dateTo)) {
            params.date_field = dateField;
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo) params.date_to = dateTo;
        }
        return params;
    };

    const applyQuery = (overrides: Record<string, unknown> = {}) => {
        const url = tenantRouter.route('script.index');
        const params = buildQuery(overrides);
        const searchSent = (params.search as string) ?? '';
        lastSentSearchRef.current = searchSent;
        router.get(url, params as Record<string, string | number | number[] | string[]>, {
            preserveState: true,
            preserveScroll: true,
            only: ['scripts', 'filters', 'sort', 'scriptTypes'],
            onStart: () => setIsLoading(true),
            onFinish: () => setIsLoading(false),
        });
    };

    const handleSearchChange = (value: string) => {
        const trimmed = value.trim() || '';
        lastSentSearchRef.current = trimmed;
        setSearchInput(value);
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = setTimeout(() => {
            applyQuery({ search: trimmed || undefined });
        }, 350);
    };

    const clearFilters = () => {
        setSearchInput('');
        applyQuery({
            search: '',
            script_type_id: [],
            status: [],
            production_status: [],
            date_field: null,
            date_from: null,
            date_to: null,
        });
    };

    const currentSortLabel = useMemo(() => {
        const opts = trashed ? TRASHED_SORT_OPTIONS : SORT_OPTIONS;
        const found = opts.find((o) => o.value === sort);
        return found?.label ?? 'Sort';
    }, [sort, trashed]);

    const handleImportCsv = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv,text/csv';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            const formData = new FormData();
            formData.append('file', file);
            router.post(tenantRouter.route('script.import-csv'), formData, {
                forceFormData: true,
                preserveScroll: true,
            });
        };
        input.click();
    };

    const handleExportAllCsv = () => {
        const url = tenantRouter.route('script.export-all');
        window.location.href = url;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={trashed ? 'Recycle bin' : 'Scripts'} />
            <div className="relative flex h-full flex-1 flex-col gap-8 p-4 md:p-6 lg:p-8">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                                {trashed ? 'Recycle bin' : 'Scripts'}
                                {scriptCount > 0 && (
                                    <span className="text-muted-foreground ml-1.5 text-base font-normal md:text-lg">
                                        ({scriptCount})
                                    </span>
                                )}
                            </h1>
                            {trashed && (
                                <Link href={scriptsIndexUrl}>
                                    <Button variant="ghost" size="sm">Back to Scripts</Button>
                                </Link>
                            )}
                        </div>
                        <p className="text-muted-foreground max-w-xl text-sm md:text-base">
                            {trashed
                                ? 'Restore or permanently delete scripts. Items here are automatically removed after 30 days.'
                                : 'Write, refine, and export scripts. Long form and shorts in one place.'}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {!trashed && (
                            <Link href={tenantRouter.route('script.create')}>
                                <Button className="cursor-pointer gap-2 shadow-sm">
                                    <Plus className="h-4 w-4" />
                                    New script
                                </Button>
                            </Link>
                        )}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" aria-label="Page menu">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-[10rem]">
                                {!trashed && (
                                    <>
                                        <DropdownMenuItem className="cursor-pointer gap-2" onClick={handleImportCsv}>
                                            <FileText className="h-4 w-4" />
                                            Import CSV
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="cursor-pointer gap-2" onClick={handleExportAllCsv}>
                                            <Download className="h-4 w-4" />
                                            Export all CSV
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="cursor-pointer gap-2" asChild>
                                            <Link href={tenantRouter.route('script.calendar')}>
                                                <CalendarDays className="h-4 w-4" />
                                                Calendar
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="cursor-pointer gap-2" asChild>
                                            <Link href={tenantRouter.route('script.transcripts')}>
                                                <Youtube className="h-4 w-4" />
                                                YouTube transcripts
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="cursor-pointer gap-2" asChild>
                                            <Link href={recycleBinUrl}>
                                                <Trash2 className="h-4 w-4" />
                                                Recycle bin
                                            </Link>
                                        </DropdownMenuItem>
                                        {scripts.length > 0 && (
                                            <>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                                                    onSelect={() => {
                                                        setTimeout(() => setDeleteAllOpen(true), 0);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    Delete all
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                    </>
                                )}
                                {trashed && (
                                    <>
                                        <DropdownMenuItem className="cursor-pointer gap-2" asChild>
                                            <Link href={scriptsIndexUrl}>
                                                <ScrollText className="h-4 w-4" />
                                                Back to Scripts
                                            </Link>
                                        </DropdownMenuItem>
                                        {scripts.length > 0 && (
                                            <DropdownMenuItem
                                                className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                                                onSelect={() => {
                                                    setTimeout(() => setEmptyTrashOpen(true), 0);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Empty recycle bin
                                            </DropdownMenuItem>
                                        )}
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Search, sort, filter + view toggle (show when has scripts OR when filters active so user can clear/change) */}
                {(!isEmpty || hasActiveFilters) && (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-1 flex-wrap items-center gap-2">
                            <div className="relative min-w-0 flex-1 sm:max-w-xs lg:max-w-sm">
                                <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                                <Input
                                    type="search"
                                    placeholder="Search scripts..."
                                    value={searchInput}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="gap-1.5" aria-label="Sort">
                                        <ArrowDownAZ className="h-4 w-4" />
                                        {currentSortLabel}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="min-w-[11rem]">
                                    {(trashed ? TRASHED_SORT_OPTIONS : SORT_OPTIONS).map((opt) => (
                                        <DropdownMenuItem
                                            key={opt.value}
                                            className="cursor-pointer"
                                            onSelect={() => applyQuery({ sort: opt.value })}
                                        >
                                            {opt.label}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <FilterPopover
                                scriptTypes={scriptTypes}
                                filters={filters}
                                trashed={trashed}
                                onApply={(next) => applyQuery(next)}
                                hasActiveFilters={hasActiveFilters}
                            />
                            {hasActiveFilters && (
                                <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={clearFilters}>
                                    Clear filters
                                </Button>
                            )}
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
                {isLoading ? (
                    /* Skeleton loaders while fetching (filter/sort/search) */
                    viewMode === 'grid' ? (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <ScriptCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <ScriptListRowSkeleton key={i} />
                            ))}
                        </div>
                    )
                ) : isEmpty ? (
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
                                <h3 className="font-medium">No scripts match your filters</h3>
                                <p className="text-muted-foreground text-sm">
                                    Try changing or clearing the search and filters to see more scripts.
                                </p>
                            </div>
                            <Button variant="outline" size="sm" onClick={clearFilters}>
                                Clear filters
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
                        {scripts.map((script) => (
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
{scripts.map((script) => (
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

            <AlertDialog open={deleteAllOpen} onOpenChange={setDeleteAllOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete all scripts?</AlertDialogTitle>
                        <AlertDialogDescription>
                            All scripts will be moved to the recycle bin. You can restore them from there before they are permanently removed after 30 days.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => router.post(tenantRouter.route('script.delete-all'))}
                        >
                            Delete all
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={emptyTrashOpen} onOpenChange={setEmptyTrashOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Empty recycle bin?</AlertDialogTitle>
                        <AlertDialogDescription>
                            All scripts in the recycle bin will be permanently deleted. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => router.post(tenantRouter.route('script.empty-trash'))}
                        >
                            Empty recycle bin
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
