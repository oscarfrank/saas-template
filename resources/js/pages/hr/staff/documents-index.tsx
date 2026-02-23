import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import { ArrowLeft, Download, FileText, Trash2 } from 'lucide-react';
import { useState } from 'react';
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
    user?: StaffUser;
}

interface DocumentItem {
    id: number;
    name: string;
    type: string;
    description: string | null;
    created_at: string;
}

interface PaginatedDocuments {
    data: DocumentItem[];
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
    documents: PaginatedDocuments;
}

function staffName(staff: Staff): string {
    const u = staff.user;
    if (!u) return 'Staff';
    const name = `${u.first_name || ''} ${u.last_name || ''}`.trim();
    return name || u.email || 'Staff';
}

export default function HRStaffDocumentsIndex({ staff, documents }: Props) {
    const tenantRouter = useTenantRouter();
    const [documentIdToDelete, setDocumentIdToDelete] = useState<number | null>(null);
    const name = staffName(staff);
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'HR', href: tenantRouter.route('hr.staff.index') },
        { title: 'Staff', href: tenantRouter.route('hr.staff.index') },
        { title: name, href: tenantRouter.route('hr.staff.show', { staff: staff.uuid }) },
        { title: 'Documents', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Documents – ${name}`} />
            <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
                <div className="mb-6 flex items-center gap-2">
                    <Link href={tenantRouter.route('hr.staff.show', { staff: staff.uuid })}>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-semibold">Documents</h1>
                        <p className="text-sm text-muted-foreground">{name}</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            All documents ({documents.total})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {documents.data.length === 0 ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">No documents uploaded yet.</p>
                        ) : (
                            <>
                                <ul className="space-y-2">
                                    {documents.data.map((doc) => (
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
                                {documents.last_page > 1 && (
                                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-muted/50 pt-4">
                                        <p className="text-sm text-muted-foreground">
                                            Showing {documents.from ?? 0}–{documents.to ?? 0} of {documents.total}
                                        </p>
                                        <div className="flex gap-1">
                                            {documents.links.map((link, i) => (
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
                            className="bg-destructive text-white hover:bg-destructive/90 hover:text-white"
                            onClick={() => {
                                if (documentIdToDelete !== null) {
                                    router.delete(
                                        tenantRouter.route('hr.staff.documents.destroy', {
                                            staff: staff.uuid,
                                            document: documentIdToDelete,
                                        }),
                                        { preserveScroll: false, onSuccess: () => setDocumentIdToDelete(null) }
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
