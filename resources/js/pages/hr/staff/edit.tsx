import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { HR_CURRENCIES, STAFF_DOCUMENT_TYPES } from '../constants';
import { PassportPhotoUpload } from './PassportPhotoUpload';
import {
    ArrowLeft,
    Briefcase,
    Banknote,
    CreditCard,
    FileText,
    ImageIcon,
    Plus,
    Trash2,
    Download,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
}

interface StaffDocument {
    id: number;
    name: string;
    type: string;
    description: string | null;
}

interface AllowanceDeduction {
    name: string;
    amount: number | string;
}

interface Staff {
    id: number;
    uuid: string;
    user?: User;
    employee_id: string | null;
    department: string | null;
    job_title: string | null;
    salary: string | null;
    salary_currency: string;
    pay_frequency: string | null;
    salary_pay_day: number | null;
    allowances: AllowanceDeduction[] | null;
    deductions: AllowanceDeduction[] | null;
    passport_photo_path: string | null;
    tax_id: string | null;
    national_id: string | null;
    bank_name: string | null;
    bank_account_number: string | null;
    bank_account_name: string | null;
    started_at: string | null;
    ended_at: string | null;
    documents?: StaffDocument[];
}

interface Props {
    staff: Staff;
}

function toFormAllowance(a: AllowanceDeduction): { name: string; amount: string } {
    return { name: a.name, amount: typeof a.amount === 'number' ? String(a.amount) : (a.amount || '') };
}

/** Normalize date to YYYY-MM-DD for input[type="date"] (handles ISO strings from API). */
function toDateInputValue(value: string | null | undefined): string {
    if (value == null || value === '') return '';
    const s = String(value);
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
}

function StaffEditForm({ staff }: Props) {
    const tenantRouter = useTenantRouter();
    const name = staff.user
        ? `${staff.user.first_name || ''} ${staff.user.last_name || ''}`.trim() || staff.user.email
        : `Staff`;

    const { data, setData, processing, errors } = useForm({
        employee_id: staff.employee_id ?? '',
        department: staff.department ?? '',
        job_title: staff.job_title ?? '',
        salary: staff.salary ?? '',
        salary_currency: staff.salary_currency || 'USD',
        pay_frequency: staff.pay_frequency ?? '',
        salary_pay_day: (staff.salary_pay_day ?? '') as number | '',
        allowances: (staff.allowances || []).map(toFormAllowance),
        deductions: (staff.deductions || []).map(toFormAllowance),
        tax_id: staff.tax_id ?? '',
        national_id: staff.national_id ?? '',
        bank_name: staff.bank_name ?? '',
        bank_account_number: staff.bank_account_number ?? '',
        bank_account_name: staff.bank_account_name ?? '',
        started_at: toDateInputValue(staff.started_at ?? (staff as { startedAt?: string }).startedAt),
        ended_at: toDateInputValue(staff.ended_at ?? (staff as { endedAt?: string }).endedAt),
    });

    const [docType, setDocType] = useState('other');
    const [docDescription, setDocDescription] = useState('');
    const [docFile, setDocFile] = useState<File | null>(null);
    const [docUploading, setDocUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const pageErrors = (usePage().props as { errors?: Record<string, string> }).errors ?? {};
    const allErrors = { ...pageErrors, ...errors };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (processing || saving) return;
        setSaving(true);
        const filteredAllowances = data.allowances.filter((a) => a.name.trim() && a.amount !== '' && Number(a.amount) >= 0);
        const filteredDeductions = data.deductions.filter((d) => d.name.trim() && d.amount !== '' && Number(d.amount) >= 0);
        const toDateOnly = (v: string) => (v && v !== '' ? String(v).slice(0, 10) : null);
        const payload: Record<string, unknown> = {
            _method: 'PUT',
            ...data,
            allowances: filteredAllowances,
            deductions: filteredDeductions,
            salary: data.salary === '' ? null : data.salary,
            salary_pay_day: data.salary_pay_day === '' ? null : data.salary_pay_day,
            started_at: toDateOnly(data.started_at),
            ended_at: toDateOnly(data.ended_at),
        };
        router.post(tenantRouter.route('hr.staff.update', { staff: staff.uuid }), payload as Record<string, string | number | null | { name: string; amount: string }[]>, {
            preserveScroll: true,
            onSuccess: () => toast.success('Staff updated.'),
            onFinish: () => setSaving(false),
        });
    };

    const addAllowance = () => setData('allowances', [...data.allowances, { name: '', amount: '' }]);
    const removeAllowance = (i: number) => setData('allowances', data.allowances.filter((_, idx) => idx !== i));
    const addDeduction = () => setData('deductions', [...data.deductions, { name: '', amount: '' }]);
    const removeDeduction = (i: number) => setData('deductions', data.deductions.filter((_, idx) => idx !== i));

    const handleUploadDocument = (e: React.FormEvent) => {
        e.preventDefault();
        if (!docFile) return;
        setDocUploading(true);
        const formData = new FormData();
        formData.append('file', docFile);
        formData.append('type', docType);
        formData.append('description', docDescription);
        router.post(tenantRouter.route('hr.staff.documents.upload', { staff: staff.uuid }), formData, {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => {
                setDocUploading(false);
                setDocFile(null);
                setDocDescription('');
            },
        });
    };

    const handleDeleteDocument = (documentId: number) => {
        if (!confirm('Delete this document?')) return;
        router.delete(tenantRouter.route('hr.staff.documents.destroy', { staff: staff.uuid, document: documentId }), {
            preserveScroll: true,
        });
    };

    const documents = staff.documents || [];

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'HR', href: tenantRouter.route('hr.staff.index') },
                { title: 'Staff', href: tenantRouter.route('hr.staff.index') },
                { title: name, href: tenantRouter.route('hr.staff.show', { staff: staff.uuid }) },
                { title: 'Edit', href: '#' },
            ]}
        >
            <Head title={`Edit – ${name}`} />
            <div className="flex flex-1 flex-col">
                {/* Header */}
                <div className="border-b bg-gradient-to-b from-muted/30 to-background">
                    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <Button variant="ghost" size="icon" className="shrink-0" asChild>
                                    <Link href={tenantRouter.route('hr.staff.show', { staff: staff.uuid })}>
                                        <ArrowLeft className="h-4 w-4" />
                                    </Link>
                                </Button>
                                <div>
                                    <h1 className="text-xl font-semibold tracking-tight">Edit staff</h1>
                                    <p className="text-sm text-muted-foreground">{name}</p>
                                </div>
                            </div>
                            <Button asChild variant="outline" size="sm">
                                <Link href={tenantRouter.route('hr.staff.show', { staff: staff.uuid })}>
                                    View profile
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {Object.keys(allErrors).length > 0 && (
                            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                                <p className="font-medium">Please fix the following errors:</p>
                                <ul className="mt-1.5 list-inside list-disc space-y-0.5">
                                    {Object.entries(allErrors).map(([key, msg]) => (
                                        <li key={key}>{msg}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="grid gap-6 lg:grid-cols-3">
                            {/* Left column: form sections */}
                            <div className="space-y-6 lg:col-span-2">
                                <Card className="border-muted/50 shadow-sm">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                <Briefcase className="h-4 w-4" />
                                            </span>
                                            Employment
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="employee_id">Employee ID</Label>
                                                <Input
                                                    id="employee_id"
                                                    value={data.employee_id}
                                                    onChange={(e) => setData('employee_id', e.target.value)}
                                                    className="bg-background"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="department">Department</Label>
                                                <Input
                                                    id="department"
                                                    value={data.department}
                                                    onChange={(e) => setData('department', e.target.value)}
                                                    className="bg-background"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="job_title">Job title</Label>
                                            <Input
                                                id="job_title"
                                                value={data.job_title}
                                                onChange={(e) => setData('job_title', e.target.value)}
                                                className="bg-background"
                                            />
                                        </div>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="started_at">Start date</Label>
                                                <Input
                                                    id="started_at"
                                                    type="date"
                                                    value={data.started_at}
                                                    onChange={(e) => setData('started_at', e.target.value)}
                                                    className="bg-background"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="ended_at">End date</Label>
                                                <Input
                                                    id="ended_at"
                                                    type="date"
                                                    value={data.ended_at}
                                                    onChange={(e) => setData('ended_at', e.target.value)}
                                                    className="bg-background"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-muted/50 shadow-sm">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                <Banknote className="h-4 w-4" />
                                            </span>
                                            Compensation
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="salary">Salary</Label>
                                                <Input
                                                    id="salary"
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={data.salary}
                                                    onChange={(e) => setData('salary', e.target.value)}
                                                    className="bg-background"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="salary_currency">Currency</Label>
                                                <Select
                                                    value={data.salary_currency}
                                                    onValueChange={(v) => setData('salary_currency', v)}
                                                >
                                                    <SelectTrigger id="salary_currency" className="bg-background">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {HR_CURRENCIES.map((c) => (
                                                            <SelectItem key={c.code} value={c.code}>
                                                                {c.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="pay_frequency">Pay frequency</Label>
                                                <Select
                                                    value={data.pay_frequency || undefined}
                                                    onValueChange={(v) => setData('pay_frequency', v)}
                                                >
                                                    <SelectTrigger id="pay_frequency" className="bg-background">
                                                        <SelectValue placeholder="Select" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="weekly">Weekly</SelectItem>
                                                        <SelectItem value="bi_weekly">Bi-weekly</SelectItem>
                                                        <SelectItem value="monthly">Monthly</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="salary_pay_day">Pay day (day of month)</Label>
                                                <Input
                                                    id="salary_pay_day"
                                                    type="number"
                                                    min={1}
                                                    max={31}
                                                    placeholder="e.g. 25"
                                                    value={data.salary_pay_day === '' ? '' : data.salary_pay_day}
                                                    onChange={(e) => setData('salary_pay_day', e.target.value === '' ? '' : Number(e.target.value))}
                                                    className="bg-background"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Allowances</Label>
                                            {data.allowances.map((a, i) => (
                                                <div key={i} className="flex items-end gap-2">
                                                    <Input
                                                        placeholder="Name (e.g. Housing)"
                                                        value={a.name}
                                                        onChange={(e) => {
                                                            const next = [...data.allowances];
                                                            next[i] = { ...next[i], name: e.target.value };
                                                            setData('allowances', next);
                                                        }}
                                                        className="bg-background"
                                                    />
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        placeholder="Amount"
                                                        className="w-28 bg-background"
                                                        value={a.amount}
                                                        onChange={(e) => {
                                                            const next = [...data.allowances];
                                                            next[i] = { ...next[i], amount: e.target.value };
                                                            setData('allowances', next);
                                                        }}
                                                    />
                                                    <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeAllowance(i)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button type="button" variant="outline" size="sm" onClick={addAllowance} className="mt-1">
                                                <Plus className="mr-1.5 h-4 w-4" /> Add allowance
                                            </Button>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Deductions</Label>
                                            {data.deductions.map((d, i) => (
                                                <div key={i} className="flex items-end gap-2">
                                                    <Input
                                                        placeholder="Name (e.g. Tax, Pension)"
                                                        value={d.name}
                                                        onChange={(e) => {
                                                            const next = [...data.deductions];
                                                            next[i] = { ...next[i], name: e.target.value };
                                                            setData('deductions', next);
                                                        }}
                                                        className="bg-background"
                                                    />
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        placeholder="Amount"
                                                        className="w-28 bg-background"
                                                        value={d.amount}
                                                        onChange={(e) => {
                                                            const next = [...data.deductions];
                                                            next[i] = { ...next[i], amount: e.target.value };
                                                            setData('deductions', next);
                                                        }}
                                                    />
                                                    <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeDeduction(i)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button type="button" variant="outline" size="sm" onClick={addDeduction} className="mt-1">
                                                <Plus className="mr-1.5 h-4 w-4" /> Add deduction
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-muted/50 shadow-sm">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                <CreditCard className="h-4 w-4" />
                                            </span>
                                            Identity & banking
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="tax_id">Tax ID</Label>
                                                <Input
                                                    id="tax_id"
                                                    value={data.tax_id}
                                                    onChange={(e) => setData('tax_id', e.target.value)}
                                                    className="bg-background"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="national_id">National ID</Label>
                                                <Input
                                                    id="national_id"
                                                    value={data.national_id}
                                                    onChange={(e) => setData('national_id', e.target.value)}
                                                    className="bg-background"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="bank_name">Bank name</Label>
                                            <Input
                                                id="bank_name"
                                                value={data.bank_name}
                                                onChange={(e) => setData('bank_name', e.target.value)}
                                                className="bg-background"
                                            />
                                        </div>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="bank_account_number">Account number</Label>
                                                <Input
                                                    id="bank_account_number"
                                                    type="number"
                                                    inputMode="numeric"
                                                    min={0}
                                                    value={data.bank_account_number}
                                                    onChange={(e) => setData('bank_account_number', e.target.value)}
                                                    className="bg-background"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="bank_account_name">Account name</Label>
                                                <Input
                                                    id="bank_account_name"
                                                    value={data.bank_account_name}
                                                    onChange={(e) => setData('bank_account_name', e.target.value)}
                                                    className="bg-background"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="flex flex-wrap gap-3">
                                    <Button type="submit" disabled={processing || saving} aria-busy={processing || saving}>
                                        {processing || saving ? 'Saving…' : 'Save changes'}
                                    </Button>
                                    <Button type="button" variant="outline" asChild>
                                        <Link href={tenantRouter.route('hr.staff.show', { staff: staff.uuid })}>
                                            Cancel
                                        </Link>
                                    </Button>
                                </div>
                            </div>

                            {/* Right column: photo + documents */}
                            <div className="space-y-6 lg:col-span-1">
                                <Card className="border-muted/50 shadow-sm">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                <ImageIcon className="h-4 w-4" />
                                            </span>
                                            Passport photo
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <PassportPhotoUpload
                                            staffUuid={staff.uuid}
                                            currentPhotoUrl={staff.passport_photo_path ? tenantRouter.route('hr.staff.passport', { staff: staff.uuid }) : null}
                                        />
                                    </CardContent>
                                </Card>

                                <Card className="border-muted/50 shadow-sm">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                <FileText className="h-4 w-4" />
                                            </span>
                                            Documents
                                        </CardTitle>
                                        <p className="text-sm font-normal text-muted-foreground">Contracts, ID, certificates</p>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {documents.length > 0 ? (
                                            <ul className="space-y-2">
                                                {documents.map((doc) => (
                                                    <li
                                                        key={doc.id}
                                                        className="flex items-center justify-between gap-2 rounded-lg border border-muted/50 bg-muted/20 px-3 py-2"
                                                    >
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-sm font-medium">{doc.name}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {doc.type}
                                                                {doc.description ? ` · ${doc.description}` : ''}
                                                            </p>
                                                        </div>
                                                        <div className="flex shrink-0 gap-1">
                                                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" asChild>
                                                                <a
                                                                    href={tenantRouter.route('hr.staff.documents.download', {
                                                                        staff: staff.uuid,
                                                                        document: doc.id,
                                                                    })}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    <Download className="h-4 w-4" />
                                                                </a>
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                                onClick={() => handleDeleteDocument(doc.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">No documents yet.</p>
                                        )}
                                        <form onSubmit={handleUploadDocument} className="space-y-3 rounded-lg border border-dashed border-muted/50 bg-muted/10 p-3">
                                            <Select value={docType} onValueChange={setDocType}>
                                                <SelectTrigger className="bg-background">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {STAFF_DOCUMENT_TYPES.map((t) => (
                                                        <SelectItem key={t.value} value={t.value}>
                                                            {t.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Input
                                                type="file"
                                                className="bg-background"
                                                onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                                            />
                                            <Input
                                                placeholder="Description (optional)"
                                                value={docDescription}
                                                onChange={(e) => setDocDescription(e.target.value)}
                                                className="bg-background"
                                            />
                                            <Button type="submit" disabled={!docFile || docUploading} size="sm" className="w-full">
                                                {docUploading ? 'Uploading…' : 'Upload'}
                                            </Button>
                                        </form>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}

export default function HRStaffEdit(props: Props) {
    return <StaffEditForm key={props.staff.uuid} {...props} />;
}
