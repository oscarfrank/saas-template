import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, Upload, ArrowLeft } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: route('admin.dashboard') },
    { title: 'Export / Import', href: route('admin.export-import') },
];

export interface ExportImportSection {
    key: string;
    label: string;
    group: 'central' | 'tenant';
}

interface Props {
    sections: ExportImportSection[];
    success?: string;
    error?: string;
}

const defaultSelectedKeys = (
    sections: ExportImportSection[]
): string[] => sections.map((s) => s.key);

export default function ExportImportPage({ sections, success, error }: Props) {
    const { flash } = usePage().props as { flash?: { success?: string; error?: string } };
    const message = success ?? flash?.success;
    const errMsg = error ?? flash?.error;

    const exportForm = useForm<{ format: string; include: string[] }>({
        format: 'json',
        include: defaultSelectedKeys(sections),
    });
    const importForm = useForm<{ file: File | null; include: string[] }>({
        file: null,
        include: defaultSelectedKeys(sections),
    });

    const centralSections = sections.filter((s) => s.group === 'central');
    const tenantSections = sections.filter((s) => s.group === 'tenant');

    const toggleExportSection = (key: string, checked: boolean) => {
        if (checked) {
            exportForm.setData('include', [...exportForm.data.include, key]);
        } else {
            exportForm.setData('include', exportForm.data.include.filter((k) => k !== key));
        }
    };
    const toggleImportSection = (key: string, checked: boolean) => {
        if (checked) {
            importForm.setData('include', [...importForm.data.include, key]);
        } else {
            importForm.setData('include', importForm.data.include.filter((k) => k !== key));
        }
    };

    const handleExport = () => {
        const format = exportForm.data.format;
        const include = exportForm.data.include;
        const params = new URLSearchParams({ format });
        include.forEach((k) => params.append('include[]', k));
        window.location.href = route('admin.export') + '?' + params.toString();
    };

    const handleImportSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!importForm.data.file) return;
        importForm.post(route('admin.import'), {
            forceFormData: true,
            onSuccess: () => importForm.reset('file'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Export / Import - Admin" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <a href={route('admin.dashboard')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to dashboard
                        </a>
                    </Button>
                </div>

                {message && (
                    <div className="rounded-md bg-green-50 dark:bg-green-950/30 px-4 py-3 text-sm text-green-800 dark:text-green-200">
                        {message}
                    </div>
                )}
                {errMsg && (
                    <div className="rounded-md bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-800 dark:text-red-200">
                        {errMsg}
                    </div>
                )}

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Download className="h-5 w-5" />
                                Export
                            </CardTitle>
                            <CardDescription>
                                Choose what to include in the export, then download as JSON or XML. Exporting &quot;Tenants&quot; includes each organization&apos;s sidebar page order and visibility.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <div className="space-y-3">
                                <Label>Include in export</Label>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Central</p>
                                        {centralSections.map((s) => (
                                            <div key={s.key} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={'export-' + s.key}
                                                    checked={exportForm.data.include.includes(s.key)}
                                                    onCheckedChange={(checked) => toggleExportSection(s.key, !!checked)}
                                                />
                                                <label htmlFor={'export-' + s.key} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                    {s.label}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Per tenant</p>
                                        {tenantSections.map((s) => (
                                            <div key={s.key} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={'export-t-' + s.key}
                                                    checked={exportForm.data.include.includes(s.key)}
                                                    onCheckedChange={(checked) => toggleExportSection(s.key, !!checked)}
                                                />
                                                <label htmlFor={'export-t-' + s.key} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                    {s.label}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Format</Label>
                                <Select
                                    value={exportForm.data.format}
                                    onValueChange={(v) => exportForm.setData('format', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="json">JSON</SelectItem>
                                        <SelectItem value="xml">XML</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleExport} disabled={exportForm.processing}>
                                <Download className="mr-2 h-4 w-4" />
                                Download export
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Upload className="h-5 w-5" />
                                Import
                            </CardTitle>
                            <CardDescription>
                                Upload a file and choose which sections to import. Only selected types will be applied.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleImportSubmit} className="flex flex-col gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="import-file">File (.json or .xml)</Label>
                                    <input
                                        id="import-file"
                                        type="file"
                                        accept=".json,.xml"
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            importForm.setData('file', file ?? null);
                                        }}
                                    />
                                    {importForm.errors.file && (
                                        <p className="text-sm text-destructive">{importForm.errors.file}</p>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <Label>Import only</Label>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Central</p>
                                            {centralSections.map((s) => (
                                                <div key={s.key} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={'import-' + s.key}
                                                        checked={importForm.data.include.includes(s.key)}
                                                        onCheckedChange={(checked) => toggleImportSection(s.key, !!checked)}
                                                    />
                                                    <label htmlFor={'import-' + s.key} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                        {s.label}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Per tenant</p>
                                            {tenantSections.map((s) => (
                                                <div key={s.key} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={'import-t-' + s.key}
                                                        checked={importForm.data.include.includes(s.key)}
                                                        onCheckedChange={(checked) => toggleImportSection(s.key, !!checked)}
                                                    />
                                                    <label htmlFor={'import-t-' + s.key} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                        {s.label}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <Button type="submit" disabled={!importForm.data.file || importForm.processing}>
                                    <Upload className="mr-2 h-4 w-4" />
                                    {importForm.processing ? 'Importing…' : 'Import'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
