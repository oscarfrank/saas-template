import { Head, router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import { GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    SIDEBAR_PAGE_DEFINITIONS,
    SIDEBAR_PAGE_IDS,
    type SidebarPagesConfig,
} from '@/config/sidebar-pages';
import { useEffectiveTenant } from '@/hooks/use-effective-tenant';
import { type BreadcrumbItem } from '@/types';

interface Props {
    sidebarConfig: SidebarPagesConfig;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Settings', href: '/settings/profile' },
    { title: 'Organization', href: '/settings/organization' },
    { title: 'Sidebar pages', href: '#' },
];

export default function OrganizationSidebarPage({ sidebarConfig }: Props) {
    const { effectiveTenant } = useEffectiveTenant();
    const { flash } = usePage().props as { flash?: { success?: string; error?: string } };

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.success, flash?.error]);

    const [order, setOrder] = useState<string[]>(() => {
        const fromConfig = sidebarConfig?.order?.length ? sidebarConfig.order : [];
        const valid = fromConfig.filter((id) => SIDEBAR_PAGE_IDS.includes(id as any));
        const missing = SIDEBAR_PAGE_IDS.filter((id) => !valid.includes(id));
        return [...valid, ...missing];
    });
    const [enabled, setEnabled] = useState<Record<string, boolean>>(() => {
        const fromConfig = sidebarConfig?.enabled ?? {};
        const out: Record<string, boolean> = {};
        for (const id of SIDEBAR_PAGE_IDS) {
            out[id] = fromConfig[id] !== false;
        }
        return out;
    });

    const [saving, setSaving] = useState(false);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const slug = effectiveTenant?.slug;
        if (!slug) return;
        setSaving(true);
        router.patch(route('settings.organization.sidebar.update', { tenant: slug }), { order, enabled }, {
            preserveScroll: true,
            onFinish: () => setSaving(false),
            onSuccess: () => toast.success('Sidebar saved. Changes will appear on the next page load.'),
            onError: (errors) => toast.error(typeof errors === 'string' ? errors : 'Failed to save sidebar.'),
        });
    };

    const moveItem = useCallback((fromIndex: number, toIndex: number) => {
        if (fromIndex === toIndex) return;
        setOrder((prev) => {
            const next = [...prev];
            const [removed] = next.splice(fromIndex, 1);
            next.splice(toIndex, 0, removed);
            return next;
        });
    }, []);

    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };
    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverIndex(index);
    };
    const handleDragLeave = () => {
        setDragOverIndex(null);
    };
    const handleDrop = (e: React.DragEvent, toIndex: number) => {
        e.preventDefault();
        setDragOverIndex(null);
        if (draggedIndex === null) return;
        setDraggedIndex(null);
        moveItem(draggedIndex, toIndex);
    };
    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const orderedDefinitions = order
        .map((id) => SIDEBAR_PAGE_DEFINITIONS.find((d) => d.id === id))
        .filter(Boolean) as typeof SIDEBAR_PAGE_DEFINITIONS;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sidebar pages - Organization" />
            <SettingsLayout>
                <div className="space-y-6">
                    <div>
                        <h2 className="text-lg font-semibold">Sidebar pages</h2>
                        <p className="text-sm text-muted-foreground">
                            Choose which pages appear in the sidebar and drag to reorder. Only the &quot;Pages&quot; section is affected; notifications and your profile at the bottom stay the same.
                        </p>
                    </div>
                    <form onSubmit={handleSave} className="space-y-4">
                        <Label>Order and visibility</Label>
                        <ul className="space-y-1 rounded-md border border-border bg-muted/30 p-2">
                            {orderedDefinitions.map((def, index) => (
                                <li
                                    key={def.id}
                                    draggable
                                    onDragStart={() => handleDragStart(index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, index)}
                                    onDragEnd={handleDragEnd}
                                    className={`flex items-center gap-3 rounded-md border px-3 py-2 transition-colors ${
                                        dragOverIndex === index
                                            ? 'border-primary bg-primary/10'
                                            : draggedIndex === index
                                              ? 'opacity-60'
                                              : 'border-transparent bg-background hover:bg-muted/50'
                                    }`}
                                >
                                    <span
                                        className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
                                        aria-label="Drag to reorder"
                                    >
                                        <GripVertical className="h-4 w-4" />
                                    </span>
                                    <def.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    <span className="flex-1 font-medium">{def.title}</span>
                                    <Switch
                                        checked={enabled[def.id] !== false}
                                        onCheckedChange={(checked) =>
                                            setEnabled((prev) => ({ ...prev, [def.id]: checked }))
                                        }
                                    />
                                </li>
                            ))}
                        </ul>
                        <Button type="submit" disabled={saving}>
                            {saving ? 'Saving…' : 'Save changes'}
                        </Button>
                    </form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
