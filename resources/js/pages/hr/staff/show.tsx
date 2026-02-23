import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Pencil,
    Download,
    ArrowLeft,
    Briefcase,
    Banknote,
    FileText,
    ListTodo,
    FolderKanban,
    User,
    Building2,
    CreditCard,
    Calendar,
    History,
    ClipboardList,
    Plus,
    AlertTriangle,
    Award,
    MessageSquare,
    Trash2,
    Printer,
    ExternalLink,
} from 'lucide-react';
import { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

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

interface StaffEventChangedBy {
    id: number;
    first_name: string;
    last_name: string;
}

interface StaffEvent {
    id: number;
    event_type: string;
    title: string | null;
    description: string | null;
    old_values: Record<string, unknown> | null;
    new_values: Record<string, unknown> | null;
    changed_by_user_id: number | null;
    position_history_id?: number | null;
    created_at: string;
    changed_by?: StaffEventChangedBy | null;
    changedBy?: StaffEventChangedBy | null;
}

interface StaffPositionHistoryItem {
    id: number;
    job_title: string | null;
    department: string | null;
    started_at: string | null;
    ended_at: string | null;
    salary: string | null;
    salary_currency: string | null;
    pay_frequency: string | null;
    created_at: string;
}

interface Staff {
    id: number;
    uuid: string;
    user_id: number;
    employee_id: string | null;
    department: string | null;
    job_title: string | null;
    salary: string | null;
    salary_currency: string;
    pay_frequency: string | null;
    salary_pay_day: number | null;
    allowances: { name: string; amount: number }[] | null;
    deductions: { name: string; amount: number }[] | null;
    passport_photo_path: string | null;
    tax_id: string | null;
    national_id: string | null;
    bank_name: string | null;
    bank_account_number: string | null;
    bank_account_name: string | null;
    started_at: string | null;
    ended_at: string | null;
    user?: User;
    documents?: StaffDocument[];
    events?: StaffEvent[];
    position_history?: StaffPositionHistoryItem[];
    positionHistory?: StaffPositionHistoryItem[];
    assigned_tasks?: { id: number; uuid: string; title: string; status: string; due_at: string | null }[];
    owned_projects?: { id: number; name: string }[];
}

interface RunItemSummary {
    run_id: number;
    item_id: number;
    period_start: string;
    period_end: string;
    amount: string;
    currency: string;
}

interface StaffPayslip {
    id: number;
    period_start: string;
    period_end: string;
    currency: string;
    net_amount: string;
}

interface Props {
    staff: Staff;
    eventTypeLabels: Record<string, string>;
    canDeleteEvents?: boolean;
    runItems?: RunItemSummary[];
    runItemsTotal?: number;
    payslipsTotal?: number;
    totalPaid?: number;
    eventsTotal?: number;
    documentsTotal?: number;
    assignedTasksTotal?: number;
}

function getInitials(staff: Staff): string {
    if (staff.user?.first_name || staff.user?.last_name) {
        const first = staff.user.first_name?.trim().charAt(0) ?? '';
        const last = staff.user.last_name?.trim().charAt(0) ?? '';
        const fromName = (first + last).toUpperCase();
        const fromEmail = staff.user?.email?.slice(0, 1).toUpperCase() ?? '';
        return fromName || fromEmail || '?';
    }
    if (staff.user?.email) {
        return staff.user.email.slice(0, 2).toUpperCase();
    }
    return '?';
}

function InfoRow({ label, value, className = '' }: { label: string; value: React.ReactNode; className?: string }) {
    return (
        <div className={className}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
        </div>
    );
}

function eventTypeIcon(type: string) {
    switch (type) {
        case 'policy_violation':
        case 'warning':
            return <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />;
        case 'commendation':
            return <Award className="h-4 w-4 shrink-0 text-emerald-500" />;
        default:
            return <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />;
    }
}

export default function HRStaffShow({ staff, eventTypeLabels, canDeleteEvents = false, runItems = [], runItemsTotal = 0, payslipsTotal = 0, totalPaid = 0, eventsTotal = 0, documentsTotal = 0, assignedTasksTotal = 0 }: Props) {
    const tenantRouter = useTenantRouter();
    const [showAddEvent, setShowAddEvent] = useState(false);
    const [eventToDelete, setEventToDelete] = useState<{ id: number; position_history_id: number | null } | null>(null);
    const [deletePositionHistoryToo, setDeletePositionHistoryToo] = useState(true);
    const [documentIdToDelete, setDocumentIdToDelete] = useState<number | null>(null);
    const eventForm = useForm({
        event_type: 'note',
        title: '',
        description: '',
    });

    const events = staff.events ?? [];
    const positionHistory = staff.position_history ?? staff.positionHistory ?? [];

    const handleAddEvent = (e: React.FormEvent) => {
        e.preventDefault();
        eventForm.post(tenantRouter.route('hr.staff.events.store', { staff: staff.uuid }), {
            preserveScroll: true,
            onSuccess: () => {
                eventForm.reset();
                setShowAddEvent(false);
            },
        });
    };
    const name = staff.user
        ? `${staff.user.first_name || ''} ${staff.user.last_name || ''}`.trim() || staff.user.email
        : 'Staff';
    const [removeHrDialogOpen, setRemoveHrDialogOpen] = useState(false);
    const [generatePayslipOpen, setGeneratePayslipOpen] = useState(false);
    const [payslipToDelete, setPayslipToDelete] = useState<number | null>(null);
    const payslipForm = useForm({
        period_start: '',
        period_end: '',
        narration: '',
        prorate: false as boolean,
        split_by_period: true as boolean,
    });
    const handleRemoveHrDetails = () => {
        router.delete(tenantRouter.route('hr.staff.destroy', { staff: staff.uuid }), {
            preserveScroll: false,
        });
        setRemoveHrDialogOpen(false);
    };

    const handleGeneratePayslip = (e: React.FormEvent) => {
        e.preventDefault();
        payslipForm.post(tenantRouter.route('hr.staff.payslips.store', { staff: staff.uuid }), {
            preserveScroll: true,
            onSuccess: () => {
                payslipForm.reset();
                setGeneratePayslipOpen(false);
            },
        });
    };

    const handleDeletePayslip = () => {
        if (!payslipToDelete) return;
        router.delete(tenantRouter.route('hr.payslips.destroy', { payslip: payslipToDelete }), {
            preserveScroll: true,
            onSuccess: () => setPayslipToDelete(null),
        });
    };

    const payslips = (staff.payslips ?? []) as StaffPayslip[];
    const initials = getInitials(staff);
    const passportUrl = staff.passport_photo_path
        ? tenantRouter.route('hr.staff.passport', { staff: staff.uuid })
        : null;

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'HR', href: tenantRouter.route('hr.staff.index') },
                { title: 'Staff', href: tenantRouter.route('hr.staff.index') },
                { title: name, href: '#' },
            ]}
        >
            <Head title={`${name} – Staff`} />
            <div className="flex flex-1 flex-col">
                {/* Profile header */}
                <div className="border-b bg-gradient-to-b from-muted/40 to-background">
                    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
                        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
                                <Avatar className="h-24 w-24 rounded-2xl border-4 border-background shadow-lg sm:h-28 sm:w-28">
                                    {passportUrl ? (
                                        <AvatarImage
                                            src={passportUrl}
                                            alt={`${name} passport`}
                                            className="object-cover"
                                        />
                                    ) : null}
                                    <AvatarFallback className="rounded-2xl bg-primary/10 text-2xl font-semibold text-primary sm:text-3xl">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="text-center sm:text-left">
                                    <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                                        {name}
                                    </h1>
                                    {staff.user?.email && (
                                        <a
                                            href={`mailto:${staff.user.email}`}
                                            className="mt-1 block text-sm text-muted-foreground hover:text-primary hover:underline"
                                        >
                                            {staff.user.email}
                                        </a>
                                    )}
                                    <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                                        {staff.job_title && (
                                            <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                                                <Briefcase className="mr-1.5 h-3.5 w-3.5" />
                                                {staff.job_title}
                                            </span>
                                        )}
                                        {staff.department && (
                                            <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                                                <Building2 className="mr-1.5 h-3.5 w-3.5" />
                                                {staff.department}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex shrink-0 flex-wrap gap-2">
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={tenantRouter.route('hr.staff.index')}>
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Back
                                    </Link>
                                </Button>
                                <Button size="sm" asChild>
                                    <Link href={tenantRouter.route('hr.staff.edit', { staff: staff.uuid })}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Edit
                                    </Link>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => setRemoveHrDialogOpen(true)}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Remove HR details
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content grid */}
                <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Employment */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    Employment
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {staff.employee_id && (
                                    <InfoRow label="Employee ID" value={staff.employee_id} />
                                )}
                                {(staff.started_at || staff.ended_at) && (
                                    <div className="flex flex-wrap gap-6">
                                        {staff.started_at && (
                                            <InfoRow
                                                label="Start date"
                                                value={
                                                    <span className="inline-flex items-center gap-1">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        {new Date(staff.started_at).toLocaleDateString(undefined, { dateStyle: 'long' })}
                                                    </span>
                                                }
                                            />
                                        )}
                                        {staff.ended_at && (
                                            <InfoRow
                                                label="End date"
                                                value={
                                                    <span className="inline-flex items-center gap-1">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        {new Date(staff.ended_at).toLocaleDateString(undefined, { dateStyle: 'long' })}
                                                    </span>
                                                }
                                            />
                                        )}
                                    </div>
                                )}
                                {!staff.employee_id && !staff.started_at && !staff.ended_at && (
                                    <p className="text-sm text-muted-foreground">No employment details yet.</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Compensation */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Banknote className="h-4 w-4 text-muted-foreground" />
                                    Compensation
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {staff.salary != null && (
                                    <InfoRow
                                        label="Base salary"
                                        value={
                                            <span>
                                                {staff.salary_currency} {Number(staff.salary).toLocaleString()}
                                                {staff.pay_frequency && (
                                                    <span className="text-muted-foreground"> · {staff.pay_frequency}</span>
                                                )}
                                            </span>
                                        }
                                    />
                                )}
                                {staff.salary_pay_day != null && (
                                    <InfoRow label="Pay day" value={`Day ${staff.salary_pay_day} of month`} />
                                )}
                                {staff.allowances && staff.allowances.length > 0 && (
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Allowances
                                        </p>
                                        <ul className="mt-1.5 space-y-1">
                                            {staff.allowances.map((a, i) => (
                                                <li
                                                    key={i}
                                                    className="flex justify-between text-sm"
                                                >
                                                    <span className="text-muted-foreground">{a.name}</span>
                                                    <span className="font-medium">
                                                        {staff.salary_currency} {Number(a.amount).toLocaleString()}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {staff.deductions && staff.deductions.length > 0 && (
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Deductions
                                        </p>
                                        <ul className="mt-1.5 space-y-1">
                                            {staff.deductions.map((d, i) => (
                                                <li
                                                    key={i}
                                                    className="flex justify-between text-sm"
                                                >
                                                    <span className="text-muted-foreground">{d.name}</span>
                                                    <span className="font-medium">
                                                        {staff.salary_currency} {Number(d.amount).toLocaleString()}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {staff.salary == null && !staff.allowances?.length && !staff.deductions?.length && (
                                    <p className="text-sm text-muted-foreground">No compensation details yet.</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Identity & banking */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                                    Identity & banking
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                    {staff.passport_photo_path ? (
                                        <InfoRow
                                            label="Passport photo"
                                            value={
                                                <a
                                                    href={passportUrl ?? '#'}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary hover:underline"
                                                >
                                                    View photo
                                                </a>
                                            }
                                        />
                                    ) : null}
                                    {staff.tax_id && <InfoRow label="Tax ID" value={staff.tax_id} />}
                                    {staff.national_id && <InfoRow label="National ID" value={staff.national_id} />}
                                    {staff.bank_name && (
                                        <InfoRow
                                            label="Bank"
                                            value={
                                                <span>
                                                    {staff.bank_name}
                                                    {staff.bank_account_name && (
                                                        <span className="block text-muted-foreground text-xs font-normal">
                                                            {staff.bank_account_name}
                                                            {staff.bank_account_number && ` · ${staff.bank_account_number}`}
                                                        </span>
                                                    )}
                                                </span>
                                            }
                                        />
                                    )}
                                    {!staff.passport_photo_path && !staff.tax_id && !staff.national_id && !staff.bank_name && (
                                        <p className="col-span-full text-sm text-muted-foreground">
                                            No identity or banking details yet.
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Payslips */}
                        <Card className="lg:col-span-2">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    Payslips
                                </CardTitle>
                                <div className="flex flex-wrap items-center gap-2">
                                    {(runItemsTotal > 5 || payslipsTotal > 5) && (
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={tenantRouter.route('hr.staff.payslips.index', { staff: staff.uuid })}>
                                                View all ({runItemsTotal + payslipsTotal})
                                            </Link>
                                        </Button>
                                    )}
                                    <Button variant="outline" size="sm" onClick={() => setGeneratePayslipOpen(true)}>
                                        <Plus className="mr-1.5 h-4 w-4" />
                                        Generate payslip
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {totalPaid > 0 && (
                                    <div className="rounded-lg border border-muted/50 bg-muted/20 px-4 py-3">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total paid (all time)</p>
                                        <p className="mt-1 text-xl font-bold tabular-nums">
                                            {staff.salary_currency ?? 'USD'} {totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                )}
                                {(runItems.length > 0 || payslips.length > 0) ? (
                                    <div className="space-y-2">
                                        {runItems.map((ri) => (
                                            <div
                                                key={`${ri.run_id}-${ri.item_id}`}
                                                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-muted/50 px-4 py-2.5"
                                            >
                                                <span className="text-sm text-muted-foreground">
                                                    {ri.period_start && ri.period_end
                                                        ? `${new Date(ri.period_start).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })} – ${new Date(ri.period_end).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}`
                                                        : 'Payment run'}
                                                </span>
                                                <span className="tabular-nums font-medium">{ri.currency} {Number(ri.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                <Button variant="ghost" size="sm" className="gap-1" asChild>
                                                    <a href={tenantRouter.route('hr.payments.slip', { paymentRun: ri.run_id, item: ri.item_id })} target="_blank" rel="noopener noreferrer">
                                                        <Printer className="h-3.5 w-3.5" />
                                                        View slip
                                                    </a>
                                                </Button>
                                            </div>
                                        ))}
                                        {payslips.map((ps) => (
                                            <div
                                                key={ps.id}
                                                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-muted/50 px-4 py-2.5"
                                            >
                                                <span className="text-sm text-muted-foreground">
                                                    {ps.period_start && ps.period_end
                                                        ? `${new Date(ps.period_start).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })} – ${new Date(ps.period_end).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}`
                                                        : 'Standalone'}
                                                </span>
                                                <span className="tabular-nums font-medium">{ps.currency} {Number(ps.net_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                <div className="flex gap-1">
                                                    <Button variant="ghost" size="sm" className="gap-1" asChild>
                                                        <Link href={tenantRouter.route('hr.payslips.show', { payslip: ps.id })} target="_blank">
                                                            <Printer className="h-3.5 w-3.5" />
                                                            View
                                                        </Link>
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="gap-1" asChild>
                                                        <Link href={tenantRouter.route('hr.payslips.edit', { payslip: ps.id })}>
                                                            <Pencil className="h-3.5 w-3.5" />
                                                            Edit
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                        onClick={() => setPayslipToDelete(ps.id)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        Delete
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        No payslips yet. Generate one for a past period (e.g. before you used this platform) or view slips from payment runs above.
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Documents */}
                        <Card className="lg:col-span-2">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    Documents
                                </CardTitle>
                                {documentsTotal > 3 && (
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={tenantRouter.route('hr.staff.documents.index', { staff: staff.uuid })}>
                                            View all ({documentsTotal})
                                        </Link>
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent>
                                {staff.documents && staff.documents.length > 0 ? (
                                    <ul className="space-y-2">
                                        {staff.documents.map((doc) => (
                                            <li
                                                key={doc.id}
                                                className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-sm font-medium">{doc.name}</p>
                                                        <p className="text-xs text-muted-foreground">{doc.type}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Button variant="ghost" size="sm" asChild>
                                                        <a
                                                            href={tenantRouter.route('hr.staff.documents.download', {
                                                                staff: staff.uuid,
                                                                document: doc.id,
                                                            })}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <Download className="mr-1.5 h-4 w-4" />
                                                            Download
                                                        </a>
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-muted-foreground hover:text-destructive"
                                                        onClick={() => setDocumentIdToDelete(doc.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Position history */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <History className="h-4 w-4 text-muted-foreground" />
                                    Position history
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {positionHistory.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b text-left text-xs text-muted-foreground">
                                                    <th className="pb-2 font-medium">Job title</th>
                                                    <th className="pb-2 font-medium">Department</th>
                                                    <th className="pb-2 font-medium">Started</th>
                                                    <th className="pb-2 font-medium">Ended</th>
                                                    <th className="pb-2 font-medium">Salary</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {positionHistory.map((p) => (
                                                    <tr key={p.id} className="border-b last:border-0">
                                                        <td className="py-2.5 font-medium">{p.job_title ?? '—'}</td>
                                                        <td className="py-2.5 text-muted-foreground">{p.department ?? '—'}</td>
                                                        <td className="py-2.5">{p.started_at ? new Date(p.started_at).toLocaleDateString(undefined, { dateStyle: 'long' }) : '—'}</td>
                                                        <td className="py-2.5">{p.ended_at ? new Date(p.ended_at).toLocaleDateString(undefined, { dateStyle: 'long' }) : '—'}</td>
                                                        <td className="py-2.5">
                                                            {p.salary != null && p.salary_currency
                                                                ? `${p.salary_currency} ${Number(p.salary).toLocaleString()}`
                                                                : '—'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        No position history yet. Changes to job title, department, or dates will be recorded here.
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Event log */}
                        <Card className="lg:col-span-2">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <ClipboardList className="h-4 w-4 text-muted-foreground" />
                                    Event log
                                </CardTitle>
                                <div className="flex flex-wrap items-center gap-2">
                                    {eventsTotal > 3 && (
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={tenantRouter.route('hr.staff.events.index', { staff: staff.uuid })}>
                                                View all ({eventsTotal})
                                            </Link>
                                        </Button>
                                    )}
                                    <Button variant="outline" size="sm" onClick={() => setShowAddEvent((v) => !v)}>
                                        <Plus className="mr-1.5 h-4 w-4" />
                                        Add event
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {showAddEvent && (
                                    <form onSubmit={handleAddEvent} className="rounded-lg border border-dashed border-muted bg-muted/20 p-4 space-y-3">
                                        <div className="space-y-2">
                                            <Label>Type</Label>
                                            <Select
                                                value={eventForm.data.event_type}
                                                onValueChange={(v) => eventForm.setData('event_type', v)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(eventTypeLabels).map(([value, label]) => (
                                                        <SelectItem key={value} value={value}>
                                                            {label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="event_title">Title (optional)</Label>
                                            <Input
                                                id="event_title"
                                                value={eventForm.data.title}
                                                onChange={(e) => eventForm.setData('title', e.target.value)}
                                                placeholder="e.g. Late to work"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="event_description">Description (optional)</Label>
                                            <textarea
                                                id="event_description"
                                                className="border-input flex min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-sm"
                                                value={eventForm.data.description}
                                                onChange={(e) => eventForm.setData('description', e.target.value)}
                                                placeholder="Details..."
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button type="submit" size="sm" disabled={eventForm.processing}>
                                                {eventForm.processing ? 'Adding…' : 'Add event'}
                                            </Button>
                                            <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddEvent(false)}>
                                                Cancel
                                            </Button>
                                        </div>
                                    </form>
                                )}
                                {events.length > 0 ? (
                                    <ul className="space-y-3">
                                        {events.map((ev) => {
                                            const loggedBy = ev.changed_by ?? ev.changedBy;
                                            const loggedByName = loggedBy
                                                ? [loggedBy.first_name, loggedBy.last_name].filter(Boolean).join(' ') || 'Unknown'
                                                : null;
                                            return (
                                                <li
                                                    key={ev.id}
                                                    className="flex gap-3 rounded-lg border border-muted/50 bg-muted/10 px-4 py-3"
                                                >
                                                    {eventTypeIcon(ev.event_type)}
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                                                {eventTypeLabels[ev.event_type] ?? ev.event_type}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {new Date(ev.created_at).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        {loggedByName && (
                                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                                Logged by: <span className="font-medium text-foreground">{loggedByName}</span>
                                                            </p>
                                                        )}
                                                        {(ev.title || ev.description) && (
                                                            <p className="mt-1 text-sm font-medium">
                                                                {ev.title}
                                                                {ev.title && ev.description ? ' — ' : ''}
                                                                {ev.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {canDeleteEvents && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="shrink-0 text-muted-foreground hover:text-destructive"
                                                            onClick={() => setEventToDelete({ id: ev.id, position_history_id: ev.position_history_id ?? null })}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No events yet. Add policy violations, warnings, commendations, or notes above.</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Assigned tasks */}
                        {(staff.assigned_tasks?.length ?? 0) > 0 || assignedTasksTotal > 0 ? (
                            <Card className="lg:col-span-2">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <ListTodo className="h-4 w-4 text-muted-foreground" />
                                        Assigned tasks
                                    </CardTitle>
                                    {assignedTasksTotal > 3 && (
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={tenantRouter.route('hr.staff.tasks.index', { staff: staff.uuid })}>
                                                View all ({assignedTasksTotal})
                                            </Link>
                                        </Button>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    {staff.assigned_tasks && staff.assigned_tasks.length > 0 ? (
                                        <ul className="space-y-2">
                                            {staff.assigned_tasks.map((t) => (
                                                <li key={t.id}>
                                                    <Link
                                                        href={tenantRouter.route('hr.tasks.show', { task: t.uuid })}
                                                        className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-2.5 text-sm transition-colors hover:bg-muted/50"
                                                    >
                                                        <span className="font-medium">{t.title}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {t.status}
                                                            {t.due_at ? ` · Due ${t.due_at}` : ''}
                                                        </span>
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No assigned tasks.</p>
                                    )}
                                </CardContent>
                            </Card>
                        ) : null}

                        {/* Projects */}
                        {staff.owned_projects && staff.owned_projects.length > 0 && (
                            <Card className="lg:col-span-2">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <FolderKanban className="h-4 w-4 text-muted-foreground" />
                                        Projects (owner)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="flex flex-wrap gap-2">
                                        {staff.owned_projects.map((p) => (
                                            <li key={p.id}>
                                                <Link
                                                    href={tenantRouter.route('hr.projects.show', { project: p.id })}
                                                    className="inline-flex items-center rounded-lg border bg-muted/30 px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/50"
                                                >
                                                    {p.name}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            <AlertDialog open={removeHrDialogOpen} onOpenChange={setRemoveHrDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove HR details?</AlertDialogTitle>
                        <AlertDialogDescription>
                            All HR data for this person (employment, compensation, documents, event log) will be removed. They will remain in the organization but will no longer have a staff record. You can add HR details again later from the Staff list. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleRemoveHrDetails}
                        >
                            Remove HR details
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={generatePayslipOpen} onOpenChange={setGeneratePayslipOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Generate payslip</DialogTitle>
                        <DialogDescription>
                            Create payslips for a date range. With &quot;Split by pay period&quot; on (default), one slip is generated per month (or per week/bi-week from their profile); narration is set to e.g. &quot;Salary January 2022&quot;. Turn it off to create a single slip for the exact range with your own narration. You cannot generate for a period that already has a payslip (delete it first).
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleGeneratePayslip} className="space-y-4">
                        {payslipForm.errors.period && (
                            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                                {payslipForm.errors.period}
                            </div>
                        )}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="ps_period_start">Period start</Label>
                                <Input
                                    id="ps_period_start"
                                    type="date"
                                    required
                                    value={payslipForm.data.period_start}
                                    onChange={(e) => payslipForm.setData('period_start', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ps_period_end">Period end</Label>
                                <Input
                                    id="ps_period_end"
                                    type="date"
                                    required
                                    value={payslipForm.data.period_end}
                                    onChange={(e) => payslipForm.setData('period_end', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="ps_split"
                                checked={payslipForm.data.split_by_period}
                                onChange={(e) => payslipForm.setData('split_by_period', e.target.checked)}
                                className="h-4 w-4 rounded border-muted-foreground"
                            />
                            <Label htmlFor="ps_split" className="font-normal">
                                Split by pay period (e.g. one slip per month for monthly pay)
                            </Label>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ps_narration">Reference / narration (optional)</Label>
                            <Input
                                id="ps_narration"
                                placeholder={payslipForm.data.split_by_period ? "Auto per period (e.g. Salary January 2022)" : "e.g. Salary Q1 2022"}
                                value={payslipForm.data.narration}
                                onChange={(e) => payslipForm.setData('narration', e.target.value)}
                            />
                            {!payslipForm.data.split_by_period && (
                                <p className="text-xs text-muted-foreground">Used for the single slip when not splitting by period.</p>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="ps_prorate"
                                checked={payslipForm.data.prorate}
                                onChange={(e) => payslipForm.setData('prorate', e.target.checked)}
                                className="h-4 w-4 rounded border-muted-foreground"
                            />
                            <Label htmlFor="ps_prorate" className="font-normal">Prorate by days in period</Label>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setGeneratePayslipOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={payslipForm.processing}>
                                {payslipForm.processing ? 'Generating…' : 'Generate'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={payslipToDelete !== null} onOpenChange={(open) => !open && setPayslipToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this payslip?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This standalone payslip will be permanently removed. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-white hover:bg-destructive/90 hover:text-white"
                            onClick={handleDeletePayslip}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={eventToDelete !== null} onOpenChange={(open) => !open && setEventToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete event?</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-2">
                                <p>This event log entry will be removed. This cannot be undone.</p>
                                {eventToDelete?.position_history_id != null && (
                                    <label className="flex cursor-pointer items-center gap-2 pt-2">
                                        <input
                                            type="checkbox"
                                            checked={deletePositionHistoryToo}
                                            onChange={(e) => setDeletePositionHistoryToo(e.target.checked)}
                                            className="h-4 w-4 rounded border-input"
                                        />
                                        <span className="text-sm">Also delete the related position history entry</span>
                                    </label>
                                )}
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                                if (eventToDelete !== null) {
                                    let url = tenantRouter.route('hr.staff.events.destroy', {
                                        staff: staff.uuid,
                                        event: eventToDelete.id,
                                    });
                                    if (deletePositionHistoryToo && eventToDelete.position_history_id != null) {
                                        url += '?delete_position_history=1';
                                    }
                                    router.delete(url, {
                                        preserveScroll: true,
                                        onSuccess: () => setEventToDelete(null),
                                    });
                                }
                            }}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={documentIdToDelete !== null} onOpenChange={(open) => !open && setDocumentIdToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete document?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This document will be permanently removed. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                                if (documentIdToDelete !== null) {
                                    router.delete(
                                        tenantRouter.route('hr.staff.documents.destroy', {
                                            staff: staff.uuid,
                                            document: documentIdToDelete,
                                        }),
                                        { preserveScroll: true, onSuccess: () => setDocumentIdToDelete(null) }
                                    );
                                }
                            }}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
