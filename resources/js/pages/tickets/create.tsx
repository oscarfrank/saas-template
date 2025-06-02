import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useTenantRouter } from '@/hooks/use-tenant-router';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Tickets',
        href: '/tickets',
    },
    {
        title: 'Create Ticket',
        href: '#',
    },
];

export default function Create() {
    const tenantRouter = useTenantRouter();
    const [formData, setFormData] = useState({
        subject: '',
        description: '',
        priority: 'medium',
        category: 'general',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.subject.trim()) {
            toast.error('Please enter a subject');
            return;
        }

        if (!formData.description.trim()) {
            toast.error('Please enter a description');
            return;
        }

        tenantRouter.post('tickets.store', formData, {}, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Ticket created successfully');
            },
            onError: () => {
                toast.error('Failed to create ticket');
            }
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Ticket" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-between">
                    <Link href={tenantRouter.route('tickets.user')}>
                        <Button variant="outline" className="cursor-pointer">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Tickets
                        </Button>
                    </Link>
                </div>

                <Card className="p-6">
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-2xl font-semibold">Create New Ticket</h2>
                            <p className="text-muted-foreground">Fill in the details below to create a new ticket</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="subject" className="block text-sm font-medium text-muted-foreground mb-1">
                                    Subject
                                </label>
                                <input
                                    type="text"
                                    id="subject"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    className="w-full rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter ticket subject"
                                />
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-muted-foreground mb-1">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={6}
                                    placeholder="Enter ticket description"
                                />
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                <div>
                                    <label htmlFor="priority" className="block text-sm font-medium text-muted-foreground mb-1">
                                        Priority
                                    </label>
                                    <select
                                        id="priority"
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                        className="w-full rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="category" className="block text-sm font-medium text-muted-foreground mb-1">
                                        Category
                                    </label>
                                    <select
                                        id="category"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="technical">Technical</option>
                                        <option value="billing">Billing</option>
                                        <option value="account">Account</option>
                                        <option value="general">General</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button type="submit">
                                    <Save className="h-4 w-4 mr-2" />
                                    Create Ticket
                                </Button>
                            </div>
                        </form>
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
}
