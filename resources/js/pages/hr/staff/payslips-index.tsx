import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import { ArrowLeft, FileText, Pencil, Printer, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { router } from '@inertiajs/react';
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

interface StaffUser {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
}

interface Staff {
    id: number;
    uuid: string;
    salary_currency?: string;
    user?: StaffUser;
}

interface SlipEntry {
    type: 'run' | 'standalone';
    period_start: string;
    period_end: string;
    amount: string;
    currency: string;
    run_id?: number;
    item_id?: number;
    payslip_id?: number;
}

interface PaginatedEntries {
    data: SlipEntry[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    staff: Staff;
    entries: PaginatedEntries;
    totalPaid: number;
}

function staffName(staff: Staff): string {
    const u = staff.user;
    if (!u) return 'Staff';
    const name = `${u.first_name || ''} ${u.last_name || ''}`.trim();
    return name || u.email || 'Staff';
}

export default function HRStaffPayslipsIndex({ staff, entries, totalPaid }: Props) {
    const tenantRouter = useTenantRouter();
    const [deletePayslipId, setDeletePayslipId] = useState<number | null>(null);

    const name = staffName(staff);
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'HR', href: tenantRouter.route('hr.staff.index') },
        { title: 'Staff', href: tenantRouter.route('hr.staff.index') },
        { title: name, href: tenantRouter.route('hr.staff.show', { staff: staff.uuid }) },
        { title: 'Payslips', href: '#' },
    ];

    const handleDeletePayslip = () => {
        if (!deletePayslipId) return;
        router.delete(tenantRouter.route('hr.payslips.destroy', { payslip: deletePayslipId }), {
            preserveScroll: false,
            onSuccess: () => setDeletePayslipId(null),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Payslips – ${name}`} />
            <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={tenantRouter.route('hr.staff.show', { staff: staff.uuid })}>
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-xl font-semibold">Payslips</h1>
                            <p className="text-sm text-muted-foreground">{name}</p>
                        </div>
                    </div>
                    {totalPaid > 0 && (
                        <div className="rounded-lg border border-muted/50 bg-muted/20 px-4 py-2">
                            <p className="text-xs font-medium text-muted-foreground">Total paid (all time)</p>
                            <p className="text-lg font-semibold tabular-nums">
                                {staff.salary_currency ?? 'USD'} {totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            All payslips ({entries.total})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {entries.data.length === 0 ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">No payslips yet.</p>
                        ) : (
                            <>
                                <ul className="divide-y divide-muted/50">
                                    {entries.data.map((entry) => (
                                        <li
                                            key={entry.type === 'run' ? `run-${entry.run_id}-${entry.item_id}` : `ps-${entry.payslip_id}`}
                                            className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0"
                                        >
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-sm text-muted-foreground">
                                                    {entry.period_start && entry.period_end
                                                        ? `${new Date(entry.period_start).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })} – ${new Date(entry.period_end).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}`
                                                        : '—'}
                                                </span>
                                                {entry.type === 'run' && (
                                                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">Run</span>
                                                )}
                                                {entry.type === 'standalone' && (
                                                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">Standalone</span>
                                                )}
                                            </div>
                                            <span className="tabular-nums font-medium">
                                                {entry.currency} {Number(entry.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                            <div className="flex gap-1">
                                                {entry.type === 'run' && entry.run_id != null && entry.item_id != null && (
                                                    <Button variant="ghost" size="sm" className="gap-1" asChild>
                                                        <a
                                                            href={tenantRouter.route('hr.payments.slip', { paymentRun: entry.run_id, item: entry.item_id })}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <Printer className="h-3.5 w-3.5" />
                                                            View slip
                                                        </a>
                                                    </Button>
                                                )}
                                                {entry.type === 'standalone' && entry.payslip_id != null && (
                                                    <>
                                                        <Button variant="ghost" size="sm" className="gap-1" asChild>
                                                            <Link href={tenantRouter.route('hr.payslips.show', { payslip: entry.payslip_id })} target="_blank">
                                                                <Printer className="h-3.5 w-3.5" />
                                                                View
                                                            </Link>
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="gap-1" asChild>
                                                            <Link href={tenantRouter.route('hr.payslips.edit', { payslip: entry.payslip_id })}>
                                                                <Pencil className="h-3.5 w-3.5" />
                                                                Edit
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                            onClick={() => setDeletePayslipId(entry.payslip_id!)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                            Delete
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                                {entries.last_page > 1 && (
                                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-muted/50 pt-4">
                                        <p className="text-sm text-muted-foreground">
                                            Showing {entries.from ?? 0}–{entries.to ?? 0} of {entries.total}
                                        </p>
                                        <div className="flex gap-1">
                                            {entries.links.map((link, i) => (
                                                <Button
                                                    key={i}
                                                    variant={link.active ? 'secondary' : 'outline'}
                                                    size="sm"
                                                    disabled={!link.url}
                                                    asChild={!!link.url && !link.active}
                                                >
                                                    {link.url && !link.active ? (
                                                        <Link href={link.url}>{link.label}</Link>
                                                    ) : (
                                                        <span>{link.label}</span>
                                                    )}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            <AlertDialog open={deletePayslipId !== null} onOpenChange={(open) => !open && setDeletePayslipId(null)}>
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
        </AppLayout>
    );
}
