import { usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { type PageProps } from '@/types';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { ImagePlus, Loader2, Star, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { toast } from 'sonner';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ACCEPT = 'image/jpeg,image/png,image/gif,image/webp';

export type MirageReferenceKind = 'face' | 'style';

type AssetRow = {
    id: number;
    kind: string;
    label: string;
    is_default: boolean;
    created_at?: string | null;
};

function blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = reject;
        r.readAsDataURL(blob);
    });
}

interface MiragePickerPageProps extends PageProps {
    tenant: {
        slug: string;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

interface MirageReferencePickerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    kind: MirageReferenceKind;
    title: string;
    description?: string;
    disabled?: boolean;
    /** When true, "Use for this run" is blocked (e.g. style slots full). */
    selectDisabled?: boolean;
    onSelectDataUrl: (dataUrl: string) => void;
}

export function MirageReferencePickerDialog({
    open,
    onOpenChange,
    kind,
    title,
    description = 'Your personal library in this organization — only you see these. Upload new images or pick a saved one. Defaults apply to you only.',
    disabled = false,
    selectDisabled = false,
    onSelectDataUrl,
}: MirageReferencePickerDialogProps) {
    const { tenant } = usePage<MiragePickerPageProps>().props;
    const uploadInputId = useId();
    const uploadInputRef = useRef<HTMLInputElement>(null);

    const [assets, setAssets] = useState<AssetRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [busyId, setBusyId] = useState<number | null>(null);

    const csrf = () => document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const url = route('cortex.agents.mirage.reference_assets.index', { tenant: tenant.slug });
            const { data } = await axios.get<{ assets: AssetRow[] }>(url, {
                params: { kind },
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrf(),
                },
            });
            setAssets(data.assets ?? []);
        } catch {
            toast.error('Could not load the reference library.');
        } finally {
            setLoading(false);
        }
    }, [kind, tenant.slug]);

    useEffect(() => {
        if (open) {
            void load();
        }
    }, [open, load]);

    const fileUrl = (id: number) =>
        route('cortex.agents.mirage.reference_assets.file', {
            tenant: tenant.slug,
            mirageReferenceAsset: id,
        });

    const fetchAsDataUrl = async (id: number): Promise<string> => {
        const res = await fetch(fileUrl(id), {
            credentials: 'same-origin',
            headers: { Accept: 'image/*', 'X-Requested-With': 'XMLHttpRequest' },
        });
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }
        const blob = await res.blob();
        return blobToDataUrl(blob);
    };

    const handleUse = async (id: number) => {
        if (selectDisabled) {
            toast.error('Remove a sample first — the maximum for this run is reached.');
            return;
        }
        setBusyId(id);
        try {
            const dataUrl = await fetchAsDataUrl(id);
            if (!dataUrl.startsWith('data:image/')) {
                toast.error('Could not read that image.');
                return;
            }
            onSelectDataUrl(dataUrl);
            onOpenChange(false);
        } catch {
            toast.error('Could not load that image.');
        } finally {
            setBusyId(null);
        }
    };

    const handleSetDefault = async (id: number) => {
        setBusyId(id);
        try {
            await axios.patch(
                route('cortex.agents.mirage.reference_assets.default', {
                    tenant: tenant.slug,
                    mirageReferenceAsset: id,
                }),
                {},
                {
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrf(),
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                },
            );
            await load();
        } catch {
            toast.error('Could not update the default.');
        } finally {
            setBusyId(null);
        }
    };

    const handleDelete = async (id: number) => {
        setBusyId(id);
        try {
            await axios.delete(
                route('cortex.agents.mirage.reference_assets.destroy', {
                    tenant: tenant.slug,
                    mirageReferenceAsset: id,
                }),
                {
                    headers: {
                        Accept: 'application/json',
                        'X-CSRF-TOKEN': csrf(),
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                },
            );
            await load();
        } catch {
            toast.error('Could not delete that item.');
        } finally {
            setBusyId(null);
        }
    };

    const validateFile = (file: File): boolean => {
        if (!/^image\/(jpeg|png|gif|webp)$/i.test(file.type)) {
            toast.error('Use a JPEG, PNG, GIF, or WebP image.');
            return false;
        }
        if (file.size > MAX_UPLOAD_BYTES) {
            toast.error('Each file must be 5MB or smaller.');
            return false;
        }
        return true;
    };

    const handleUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file || disabled) {
            return;
        }
        if (!validateFile(file)) {
            return;
        }
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('kind', kind);
            fd.append('file', file);
            await axios.post(route('cortex.agents.mirage.reference_assets.store', { tenant: tenant.slug }), fd, {
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'multipart/form-data',
                    'X-CSRF-TOKEN': csrf(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            await load();
            toast.success('Saved to your library.');
        } catch (err: unknown) {
            const ax = err as { response?: { data?: { message?: string } } };
            toast.error(ax.response?.data?.message ?? 'Upload failed.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[min(85vh,640px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
                <DialogHeader className="shrink-0 border-b px-4 py-3 text-left">
                    <DialogTitle className="text-base">{title}</DialogTitle>
                    <DialogDescription className="text-xs">{description}</DialogDescription>
                </DialogHeader>

                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
                    {loading ? (
                        <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                            <Loader2 className="size-5 animate-spin" />
                            <span className="text-sm">Loading…</span>
                        </div>
                    ) : assets.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">No saved references yet. Upload one below.</p>
                    ) : (
                        <ul className="space-y-2">
                            {assets.map((a) => {
                                const busy = busyId === a.id;
                                return (
                                    <li
                                        key={a.id}
                                        className="flex gap-2 rounded-md border bg-card p-2 text-left shadow-sm"
                                    >
                                        <div className="bg-muted/60 relative size-14 shrink-0 overflow-hidden rounded border">
                                            <img src={fileUrl(a.id)} alt="" className="size-full object-cover" loading="lazy" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-1">
                                                <span className="truncate text-xs font-medium" title={a.label}>
                                                    {a.label || 'Reference'}
                                                </span>
                                                {a.is_default ? (
                                                    <Badge variant="secondary" className="h-5 gap-0.5 px-1.5 text-[10px]">
                                                        <Star className="size-3" />
                                                        Default
                                                    </Badge>
                                                ) : null}
                                            </div>
                                            <div className="mt-1 flex flex-wrap gap-1">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    className="h-7 gap-1 text-[10px]"
                                                    disabled={disabled || busy || uploading}
                                                    onClick={() => void handleUse(a.id)}
                                                >
                                                    {busy ? (
                                                        <Loader2 className="size-3.5 animate-spin" />
                                                    ) : (
                                                        'Use for this run'
                                                    )}
                                                </Button>
                                                {!a.is_default ? (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-7 text-[10px]"
                                                        disabled={disabled || busy || uploading}
                                                        onClick={() => void handleSetDefault(a.id)}
                                                    >
                                                        Set default
                                                    </Button>
                                                ) : null}
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 px-2 text-destructive hover:text-destructive"
                                                    disabled={disabled || busy || uploading}
                                                    aria-label="Delete from library"
                                                    onClick={() => void handleDelete(a.id)}
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                <div className="shrink-0 border-t bg-muted/30 px-4 py-3">
                    <input
                        ref={uploadInputRef}
                        id={uploadInputId}
                        type="file"
                        accept={ACCEPT}
                        className="sr-only"
                        disabled={disabled || uploading}
                        onChange={(e) => void handleUploadChange(e)}
                    />
                    <Button
                        type="button"
                        variant="secondary"
                        className={cn('w-full gap-2', uploading && 'pointer-events-none opacity-70')}
                        disabled={disabled}
                        onClick={() => uploadInputRef.current?.click()}
                    >
                        {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
                        Upload to library
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
