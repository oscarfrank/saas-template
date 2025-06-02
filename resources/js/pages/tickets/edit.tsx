import { PageProps } from '@/types';
import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useTenantRouter } from '@/hooks/use-tenant-router';

interface Props extends PageProps {
    ticket: {
        id: number;
        subject: string;
        description: string;
        status: string;
        priority: string;
        category: string;
        assigned_to: number | null;
    };
    users: Array<{
        id: number;
        first_name: string;
        last_name: string;
    }>;
}

export default function Edit({ ticket, users }: Props) {
    const tenantRouter = useTenantRouter();
    const [formData, setFormData] = useState({
        subject: ticket.subject,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        assigned_to: ticket.assigned_to,
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

        tenantRouter.put('tickets.update', formData, { ticket: ticket.id }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Ticket updated successfully');
            },
            onError: () => {
                toast.error('Failed to update ticket');
            }
        });
    };

    return (
        <>
            <Head title={`Edit Ticket #${ticket.id}`} />

            <div className="container mx-auto py-6">
                <div className="mb-6">
                    <Button variant="ghost" asChild>
                        <Link href={tenantRouter.route('admin.tickets.show', { ticket: ticket.id })}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Ticket
                        </Link>
                    </Button>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <h1 className="text-2xl font-bold mb-6">Edit Ticket</h1>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
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
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
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

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                </label>
                                <select
                                    id="status"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="open">Open</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
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
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
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

                            <div>
                                <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700 mb-1">
                                    Assign To
                                </label>
                                <select
                                    id="assigned_to"
                                    value={formData.assigned_to || ''}
                                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value ? Number(e.target.value) : null })}
                                    className="w-full rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Unassigned</option>
                                    {users.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.first_name} {user.last_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit">
                                <Save className="h-4 w-4 mr-2" />
                                Update Ticket
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
} 