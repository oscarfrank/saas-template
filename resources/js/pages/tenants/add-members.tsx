import { Head, Link, router } from '@inertiajs/react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Search, Mail, X, Loader2, Building2 } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Organizations', href: '/organizations' },
    { title: 'Add members', href: '/organizations/add-members' },
];

type PendingUser = { type: 'user'; id: number; name: string; email: string };
type PendingEmail = { type: 'email'; email: string };
type PendingEntry = PendingUser | PendingEmail;

interface TenantOption {
    id: string;
    name: string;
    slug: string;
}

interface RoleOption {
    value: string;
    label: string;
}

interface SearchUser {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    name: string;
}

interface Props {
    tenants: TenantOption[];
    roles: RoleOption[];
}

export default function AddMembers({ tenants, roles }: Props) {
    const [tenantId, setTenantId] = useState<string>('');
    const [role, setRole] = useState<string>('member');
    const [pending, setPending] = useState<PendingEntry[]>([]);

    // User search
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Bulk emails
    const [emailInput, setEmailInput] = useState('');

    // Submit
    const [submitting, setSubmitting] = useState(false);

    const searchUsers = useCallback(async (q: string) => {
        const trimmed = q.trim();
        if (trimmed.length < 2) {
            setSearchResults([]);
            return;
        }
        setSearchLoading(true);
        try {
            const url = `${route('tenants.add-members.search-users')}?q=${encodeURIComponent(trimmed)}`;
            const res = await fetch(url, { headers: { Accept: 'application/json' } });
            const data = await res.json();
            setSearchResults(Array.isArray(data.users) ? data.users : []);
        } catch {
            setSearchResults([]);
        } finally {
            setSearchLoading(false);
        }
    }, []);

    useEffect(() => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => {
            searchUsers(searchQuery);
        }, 300);
        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, [searchQuery, searchUsers]);

    const addUser = (u: SearchUser) => {
        const exists = pending.some(
            (p) => p.type === 'user' && p.id === u.id
        );
        if (exists) return;
        setPending((prev) => [
            ...prev,
            { type: 'user', id: u.id, name: u.name, email: u.email },
        ]);
        setSearchQuery('');
        setSearchResults([]);
    };

    const addEmailsFromText = () => {
        const raw = emailInput
            .split(/[\n,;]+/)
            .map((s) => s.trim().toLowerCase())
            .filter((s) => s.length > 0);
        const validEmails = raw.filter((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s));
        const newEntries: PendingEmail[] = validEmails.map((email) => ({ type: 'email', email }));
        const existingEmails = new Set(
            pending.filter((p): p is PendingEmail => p.type === 'email').map((p) => p.email)
        );
        const existingIds = new Set(
            pending.filter((p): p is PendingUser => p.type === 'user').map((p) => p.email.toLowerCase())
        );
        const toAdd = newEntries.filter(
            (e) => !existingEmails.has(e.email) && !existingIds.has(e.email)
        );
        setPending((prev) => [...prev, ...toAdd]);
        setEmailInput('');
        if (validEmails.length !== raw.length) {
            toast.info('Some lines were not valid emails and were skipped.');
        }
    };

    const removePending = (index: number) => {
        setPending((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!tenantId || pending.length === 0) {
            toast.error('Select an organization and add at least one user or email.');
            return;
        }
        const userIds = pending
            .filter((p): p is PendingUser => p.type === 'user')
            .map((p) => p.id);
        const emails = pending
            .filter((p): p is PendingEmail => p.type === 'email')
            .map((p) => p.email);
        if (userIds.length === 0 && emails.length === 0) {
            toast.error('Add at least one user or email.');
            return;
        }
        setSubmitting(true);
        router.post(route('tenants.add-members.store'), {
            tenant_id: tenantId,
            role,
            user_ids: userIds,
            emails,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setPending([]);
                setSubmitting(false);
                toast.success('Members added successfully.');
            },
            onError: (errors) => {
                setSubmitting(false);
                toast.error(errors.tenant_id || errors.role || 'Failed to add members.');
            },
        });
    };

    const [tenantFilter, setTenantFilter] = useState('');
    const filteredTenants = tenantFilter.trim()
        ? tenants.filter(
            (t) =>
                t.name.toLowerCase().includes(tenantFilter.toLowerCase()) ||
                t.slug.toLowerCase().includes(tenantFilter.toLowerCase())
        )
        : tenants;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Add members to organization" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 max-w-2xl mx-auto">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Add members</h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            Add existing users to an organization with a role. No invites or emails are sent.
                        </p>
                    </div>
                    <Link href={route('tenants.index')}>
                        <Button variant="outline" size="sm">Back to organizations</Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5" />
                            Add to organization
                        </CardTitle>
                        <CardDescription>
                            Choose an organization and role, then add users by search or by pasting emails.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="tenant">Organization</Label>
                                    {tenants.length > 3 && (
                                        <Input
                                            placeholder="Search organizations..."
                                            value={tenantFilter}
                                            onChange={(e) => setTenantFilter(e.target.value)}
                                            className="mb-2"
                                        />
                                    )}
                                    <Select value={tenantId} onValueChange={setTenantId} required>
                                        <SelectTrigger id="tenant" className="w-full">
                                            <SelectValue placeholder="Select organization" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredTenants.length === 0 ? (
                                                <div className="py-4 text-center text-sm text-muted-foreground">
                                                    No organizations match.
                                                </div>
                                            ) : (
                                                filteredTenants.map((t) => (
                                                    <SelectItem key={t.id} value={t.id}>
                                                        <span className="flex items-center gap-2">
                                                            <Building2 className="h-4 w-4 text-muted-foreground" />
                                                            {t.name}
                                                        </span>
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="role">Role</Label>
                                    <Select value={role} onValueChange={setRole}>
                                        <SelectTrigger id="role" className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roles.map((r) => (
                                                <SelectItem key={r.value} value={r.value}>
                                                    {r.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Users to add</Label>
                                <Tabs defaultValue="search" className="w-full">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="search" className="flex items-center gap-2">
                                            <Search className="h-4 w-4" />
                                            Search user
                                        </TabsTrigger>
                                        <TabsTrigger value="emails" className="flex items-center gap-2">
                                            <Mail className="h-4 w-4" />
                                            Paste emails
                                        </TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="search" className="space-y-2 mt-2">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search by name or email (min 2 chars)..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-9"
                                            />
                                            {searchLoading && (
                                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                                            )}
                                        </div>
                                        {searchResults.length > 0 && (
                                            <ul className="border rounded-md divide-y max-h-48 overflow-auto">
                                                {searchResults.map((u) => (
                                                    <li key={u.id}>
                                                        <button
                                                            type="button"
                                                            onClick={() => addUser(u)}
                                                            className="w-full px-3 py-2 text-left text-sm hover:bg-muted/60 flex items-center justify-between"
                                                        >
                                                            <span>{u.name} <span className="text-muted-foreground">({u.email})</span></span>
                                                            <UserPlus className="h-4 w-4 text-muted-foreground" />
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </TabsContent>
                                    <TabsContent value="emails" className="space-y-2 mt-2">
                                        <textarea
                                            placeholder="One email per line, or comma/semicolon separated"
                                            value={emailInput}
                                            onChange={(e) => setEmailInput(e.target.value)}
                                            className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                            rows={4}
                                        />
                                        <Button type="button" variant="secondary" size="sm" onClick={addEmailsFromText}>
                                            Add from list
                                        </Button>
                                    </TabsContent>
                                </Tabs>
                            </div>

                            {pending.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Pending ({pending.length})</Label>
                                    <ul className="border rounded-md divide-y max-h-40 overflow-auto">
                                        {pending.map((p, i) => (
                                            <li key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                                                {p.type === 'user' ? (
                                                    <span>{p.name} <span className="text-muted-foreground">({p.email})</span></span>
                                                ) : (
                                                    <span className="text-muted-foreground">{p.email}</span>
                                                )}
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => removePending(i)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="flex gap-2 pt-2">
                                <Button type="submit" disabled={submitting || !tenantId || pending.length === 0}>
                                    {submitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Adding…
                                        </>
                                    ) : (
                                        <>Add to organization</>
                                    )}
                                </Button>
                                <Link href={route('tenants.index')}>
                                    <Button type="button" variant="outline">Cancel</Button>
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
