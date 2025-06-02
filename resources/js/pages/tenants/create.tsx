import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Building2, Globe, Upload, X, Plus, Mail } from 'lucide-react';
import { useState } from 'react';

interface Props {
    errors?: Record<string, string>;
}

interface Invite {
    email: string;
    role: 'admin' | 'member';
}

export default function Create({ errors = {} }: Props) {
    const [step, setStep] = useState(1);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [invites, setInvites] = useState<Invite[]>([]);
    const [newInvite, setNewInvite] = useState<Invite>({ email: '', role: 'member' });
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
    });

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const addInvite = () => {
        if (newInvite.email && !invites.some(invite => invite.email === newInvite.email)) {
            setInvites([...invites, newInvite]);
            setNewInvite({ email: '', role: 'member' });
        }
    };

    const removeInvite = (email: string) => {
        setInvites(invites.filter(invite => invite.email !== email));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const submitData = new FormData();
        
        // Add the required fields from our state
        submitData.append('name', formData.name);
        submitData.append('slug', formData.slug);
        
        // Add the logo if it exists
        const logoInput = document.getElementById('logo') as HTMLInputElement;
        if (logoInput?.files?.[0]) {
            submitData.append('logo', logoInput.files[0]);
        }
        
        // Add invites to formData
        submitData.append('invites', JSON.stringify(invites));
        
        router.post(route('tenants.store'), submitData, {
            onSuccess: () => {
                toast.success('Organization created successfully');
                router.visit(route('tenants.index'));
            },
            onError: (errors) => {
                toast.error('Failed to create organization');
            },
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const nextStep = () => {
        if (step === 1 && (!formData.name || !formData.slug)) {
            toast.error('Please fill in all required fields');
            return;
        }
        setStep(step + 1);
    };

    const prevStep = () => setStep(step - 1);

    const canProceed = () => {
        switch (step) {
            case 1:
                return formData.name && formData.slug;
            case 2:
                return true; // Logo is optional
            case 3:
                return true; // Invites are optional
            default:
                return false;
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Head title="Create Organization" />
            
            <div className="container max-w-3xl mx-auto py-12 px-4">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Create Your Organization</h1>
                    <p className="mt-2 text-muted-foreground">
                        Set up your organization in just a few steps
                    </p>
                </div>

                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        {[1, 2, 3].map((stepNumber) => (
                            <div key={stepNumber} className="flex items-center">
                                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                    step >= stepNumber ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                }`}>
                                    {stepNumber}
                                </div>
                                {stepNumber < 3 && (
                                    <div className={`h-0.5 w-16 ${
                                        step > stepNumber ? 'bg-primary' : 'bg-muted'
                                    }`} />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="mt-2 flex justify-between text-sm text-muted-foreground">
                        <span>Basic Info</span>
                        <span>Logo</span>
                        <span>Team Members</span>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>
                            {step === 1 && "Basic Information"}
                            {step === 2 && "Organization Logo"}
                            {step === 3 && "Invite Team Members"}
                        </CardTitle>
                        <CardDescription>
                            {step === 1 && "Let's start with the essential details"}
                            {step === 2 && "Add your organization's logo (optional)"}
                            {step === 3 && "Invite your team members to join (optional)"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {step === 1 && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-base">
                                            Organization Name <span className="text-destructive">*</span>
                                        </Label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="name"
                                                name="name"
                                                className="pl-9"
                                                placeholder="Enter your organization name"
                                                required
                                                value={formData.name}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        {errors.name && (
                                            <p className="text-sm text-destructive">{errors.name}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="slug" className="text-base">
                                            Organization Slug <span className="text-destructive">*</span>
                                        </Label>
                                        <div className="relative">
                                            <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="slug"
                                                name="slug"
                                                className="pl-9"
                                                placeholder="your-organization"
                                                required
                                                value={formData.slug}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            This will be used in URLs and API endpoints
                                        </p>
                                        {errors.slug && (
                                            <p className="text-sm text-destructive">{errors.slug}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="logo" className="text-base">Organization Logo</Label>
                                        <div className="flex items-center gap-4">
                                            <div className="relative h-24 w-24 rounded-lg border-2 border-dashed border-muted-foreground/25 p-2">
                                                {logoPreview ? (
                                                    <img
                                                        src={logoPreview}
                                                        alt="Logo preview"
                                                        className="h-full w-full rounded-md object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center">
                                                        <Upload className="h-8 w-8 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <Input
                                                    id="logo"
                                                    name="logo"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleLogoChange}
                                                    className="cursor-pointer"
                                                />
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    Upload your organization logo (PNG, JPG up to 2MB)
                                                </p>
                                            </div>
                                        </div>
                                        {errors.logo && (
                                            <p className="text-sm text-destructive">{errors.logo}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-base">Invite Team Members</Label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    type="email"
                                                    placeholder="colleague@company.com"
                                                    value={newInvite.email}
                                                    onChange={(e) => setNewInvite({ ...newInvite, email: e.target.value })}
                                                    className="pl-9"
                                                />
                                            </div>
                                            <select
                                                value={newInvite.role}
                                                onChange={(e) => setNewInvite({ ...newInvite, role: e.target.value as 'admin' | 'member' })}
                                                className="rounded-md border border-input bg-background px-3 py-2"
                                            >
                                                <option value="member">Member</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                            <Button type="button" onClick={addInvite}>
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {invites.length > 0 && (
                                        <div className="space-y-2">
                                            <Label className="text-sm text-muted-foreground">Pending Invites</Label>
                                            <div className="space-y-2">
                                                {invites.map((invite) => (
                                                    <div key={invite.email} className="flex items-center justify-between rounded-md border p-2">
                                                        <div>
                                                            <p className="font-medium">{invite.email}</p>
                                                            <p className="text-sm text-muted-foreground capitalize">{invite.role}</p>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeInvite(invite.email)}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <CardFooter className="flex justify-between space-x-4 pt-6">
                                <div>
                                    {step > 1 && (
                                        <Button type="button" variant="outline" onClick={prevStep}>
                                            Back
                                        </Button>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    {step < 3 ? (
                                        <>
                                            {(step === 2 || step === 3) && (
                                                <Button type="button" variant="outline" onClick={nextStep}>
                                                    Skip
                                                </Button>
                                            )}
                                            <Button 
                                                type="button" 
                                                onClick={nextStep}
                                                disabled={!canProceed()}
                                            >
                                                Next
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Link href={route('tenants.index')}>
                                                <Button type="button" variant="outline">
                                                    Cancel
                                                </Button>
                                            </Link>
                                            <Button type="submit">Create Organization</Button>
                                        </>
                                    )}
                                </div>
                            </CardFooter>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 