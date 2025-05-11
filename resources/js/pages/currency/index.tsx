import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Table } from './components/table';
import { createColumns } from './components/table-columns';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin',
        href: '/admin/dashboard',
    },
    {
        title: 'Currencies',
        href: '/admin/currencies',
    },
];

interface Props {
    currencies: any[];
    types: Record<string, string>;
    riskLevels: Record<string, string>;
}

export default function Index({ currencies, types, riskLevels }: Props) {
    const columns = createColumns();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Currencies" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-between">
                    <h1 className="text-2xl font-semibold">Currencies</h1>
                    <Button
                        onClick={() => router.visit(route('currencies.create'))}
                        className="cursor-pointer"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Create Currency
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Currency Types</CardTitle>
                            <CardDescription>
                                Different types of currencies supported
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
                    <Table columns={columns} data={currencies} />
                </div>
            </div>
        </AppLayout>
    );
}
