import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import { toast } from 'sonner';
import { ArrowLeft, Upload, Download, FileSpreadsheet } from 'lucide-react';
import { useEffect } from 'react';

interface Props {
    statusOptions: Record<string, string>;
    currencyOptions: Record<string, string>;
    flash?: { success?: string; warning?: string; error?: string };
    import_errors?: string[] | null;
}

export default function AssetsImport({ statusOptions, currencyOptions, flash, import_errors }: Props) {
    const tenantRouter = useTenantRouter();
    const { data, setData, post, processing, errors } = useForm({
        file: null as File | null,
    });

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.warning) toast.warning(flash.warning);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.success, flash?.warning, flash?.error]);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Assets', href: tenantRouter.route('assets.index') },
        { title: 'Import', href: tenantRouter.route('assets.import') },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.file) return;
        post(tenantRouter.route('assets.import.process'), {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Import assets" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={tenantRouter.route('assets.index')}>
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                            <Upload className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">Import assets</h1>
                            <p className="text-muted-foreground text-sm">Upload a CSV file to create assets in bulk.</p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="overflow-hidden rounded-2xl border shadow-sm">
                        <CardHeader className="border-b bg-muted/30 pb-4">
                            <div className="flex items-center gap-2">
                                <Download className="h-5 w-5 text-primary" />
                                <h2 className="font-semibold">Template</h2>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-5">
                            <p className="text-muted-foreground text-sm mb-4">
                                Download a CSV template with the required columns. Fill in your data and upload below.
                            </p>
                            <Button variant="outline" asChild>
                                <a href={tenantRouter.route('assets.import.template')} download className="gap-2">
                                    <FileSpreadsheet className="h-4 w-4" />
                                    Download template
                                </a>
                            </Button>
                            <p className="text-muted-foreground text-xs mt-3">
                                Columns: Name, Asset tag, Serial number, Category, Status, Purchase price, Currency, Purchase date, Location, Condition.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden rounded-2xl border shadow-sm">
                        <CardHeader className="border-b bg-muted/30 pb-4">
                            <div className="flex items-center gap-2">
                                <Upload className="h-5 w-5 text-primary" />
                                <h2 className="font-semibold">Upload CSV</h2>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-5">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="file">CSV file</Label>
                                    <Input
                                        id="file"
                                        type="file"
                                        accept=".csv,.txt"
                                        onChange={(e) => setData('file', e.target.files?.[0] ?? null)}
                                    />
                                    {errors.file && <p className="text-destructive text-sm">{errors.file}</p>}
                                </div>
                                <Button type="submit" disabled={processing || !data.file} className="gap-2">
                                    <Upload className="h-4 w-4" />
                                    {processing ? 'Importing…' : 'Import'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {import_errors && import_errors.length > 0 && (
                    <Card className="overflow-hidden rounded-2xl border-destructive/30 border shadow-sm">
                        <CardHeader className="border-b bg-destructive/5 pb-4">
                            <h2 className="font-semibold text-destructive">Import errors</h2>
                        </CardHeader>
                        <CardContent className="pt-5">
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground max-h-60 overflow-y-auto">
                                {import_errors.map((msg, i) => (
                                    <li key={i}>{msg}</li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}

                <Button variant="ghost" size="sm" asChild>
                    <Link href={tenantRouter.route('assets.index')}>← Back to assets</Link>
                </Button>
            </div>
        </AppLayout>
    );
}
