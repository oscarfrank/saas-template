import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Table } from './components/table';
import { createColumns } from './components/table-columns';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { CustomAlertDialog } from '@/components/ui/custom-alert-dialog';
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin',
        href: '/admin/dashboard',
    },
    {
        title: 'Email Templates',
        href: '/admin/email-templates',
    },
];

interface Props {
    templates: any[];
    types: Record<string, string>;
    placeholders: Record<string, string>;
}

export default function Index({ templates, types, placeholders }: Props) {
    const columns = createColumns();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Email Templates" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-between">
                    <h1 className="text-2xl font-semibold">Email Templates</h1>
                    <Button
                        onClick={() => router.visit(route('email-templates.create'))}
                        className="cursor-pointer"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Create Email Template
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Available Placeholders</CardTitle>
                            <CardDescription>
                                Use these placeholders in your email templates
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(placeholders).map(([key, value]) => (
                                    <Badge key={key} variant="secondary">
                                        {`{{${key}}}`}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Template Types</CardTitle>
                            <CardDescription>
                                Different types of email templates
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(types).map(([key, value]) => (
                                    <Badge key={key} variant="outline">
                                        {value}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-4">
                    <Table columns={columns} data={templates} />
                </div>
            </div>
        </AppLayout>
    );
}
