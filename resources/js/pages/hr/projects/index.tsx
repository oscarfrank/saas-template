import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface Project {
    id: number;
    name: string;
    description: string | null;
    start_date: string | null;
    end_date: string | null;
    status: string;
    tasks_count: number;
    owner?: { user?: { first_name: string; last_name: string } };
}

interface Props {
    projects: { data: Project[]; current_page: number; last_page: number; total: number };
    filters: { search?: string; status?: string };
}

export default function HRProjectsIndex({ projects, filters }: Props) {
    const tenantRouter = useTenantRouter();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'HR', href: tenantRouter.route('hr.staff.index') },
        { title: 'Projects', href: tenantRouter.route('hr.projects.index') },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="HR – Projects" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-semibold">Projects</h1>
                    <div className="flex items-center gap-2">
                        <form
                            className="flex gap-2"
                            onSubmit={(e) => {
                                e.preventDefault();
                                const q = (e.currentTarget.querySelector('input[name="search"]') as HTMLInputElement)?.value;
                                tenantRouter.get('hr.projects.index', { search: q || undefined, ...filters });
                            }}
                        >
                            <Input name="search" placeholder="Search..." defaultValue={filters.search} className="max-w-xs" />
                            <Button type="submit" variant="secondary" size="icon">
                                <Search className="h-4 w-4" />
                            </Button>
                        </form>
                        <Button asChild>
                            <Link href={tenantRouter.route('hr.projects.create')}>
                                <Plus className="h-4 w-4 mr-2" />
                                New project
                            </Link>
                        </Button>
                    </div>
                </div>
                <Card>
                    <CardHeader>
                        <h2 className="text-lg font-medium">All projects</h2>
                    </CardHeader>
                    <CardContent>
                        {projects.data.length === 0 ? (
                            <p className="text-muted-foreground py-8 text-center">No projects yet.</p>
                        ) : (
                            <>
                                <div className="rounded-md border">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b bg-muted/50">
                                                <th className="p-3 text-left font-medium">Name</th>
                                                <th className="p-3 text-left font-medium">Status</th>
                                                <th className="p-3 text-left font-medium">Tasks</th>
                                                <th className="p-3 text-right font-medium"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {projects.data.map((p) => (
                                                <tr key={p.id} className="border-b last:border-0">
                                                    <td className="p-3">{p.name}</td>
                                                    <td className="p-3">
                                                        <Badge variant={p.status === 'active' ? 'default' : 'secondary'}>
                                                            {p.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-3">{p.tasks_count}</td>
                                                    <td className="p-3 text-right">
                                                        <Button variant="ghost" size="sm" asChild>
                                                            <Link href={tenantRouter.route('hr.projects.show', { project: p.id })}>
                                                                View
                                                            </Link>
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {projects.last_page > 1 && (
                                    <div className="mt-4 flex items-center justify-between">
                                        <p className="text-sm text-muted-foreground">
                                            Page {projects.current_page} of {projects.last_page}
                                        </p>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={projects.current_page <= 1}
                                                onClick={() =>
                                                    tenantRouter.get('hr.projects.index', { ...filters, page: projects.current_page - 1 })
                                                }
                                            >
                                                <ChevronLeft className="h-4 w-4" /> Previous
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={projects.current_page >= projects.last_page}
                                                onClick={() =>
                                                    tenantRouter.get('hr.projects.index', { ...filters, page: projects.current_page + 1 })
                                                }
                                            >
                                                Next <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
                </div>
            </div>
        </AppLayout>
    );
}
