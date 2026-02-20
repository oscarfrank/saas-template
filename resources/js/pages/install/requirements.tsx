import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import InstallLayout from '@/layouts/install-layout';

interface Props {
    steps: Record<string, { title: string; order: number }>;
    currentStep: string;
    requirements: {
        php_version: string;
        php_ok: boolean;
        extensions: { name: string; loaded: boolean }[];
        extensions_ok: boolean;
        writable: { path: string; exists: boolean; writable: boolean }[];
        writable_ok: boolean;
        passed: boolean;
    };
}

export default function InstallRequirements({ steps, currentStep, requirements }: Props) {
    return (
        <InstallLayout steps={steps} currentStep={currentStep}>
            <Head title="Requirements – Setup" />
            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-semibold">Requirements</h2>
                    <p className="text-muted-foreground mt-1">
                        Your server must meet the following before continuing.
                    </p>
                </div>

                <div className="space-y-4 rounded-lg border bg-card p-4">
                    <div className="flex items-center justify-between">
                        <span>PHP &ge; 8.2</span>
                        <span className={requirements.php_ok ? 'text-green-600' : 'text-destructive'}>
                            {requirements.php_ok ? <Check className="size-4" /> : <X className="size-4" />}
                            {requirements.php_version}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Required extensions</span>
                        <span className={requirements.extensions_ok ? 'text-green-600' : 'text-destructive'}>
                            {requirements.extensions_ok ? <Check className="size-4" /> : <X className="size-4" />}
                        </span>
                    </div>
                    {!requirements.extensions_ok && (
                        <ul className="list-inside list-disc text-sm text-muted-foreground">
                            {requirements.extensions.filter((e) => !e.loaded).map((e) => (
                                <li key={e.name}>{e.name}</li>
                            ))}
                        </ul>
                    )}
                    <div className="flex items-center justify-between">
                        <span>Writable directories</span>
                        <span className={requirements.writable_ok ? 'text-green-600' : 'text-destructive'}>
                            {requirements.writable_ok ? <Check className="size-4" /> : <X className="size-4" />}
                        </span>
                    </div>
                    {!requirements.writable_ok && (
                        <ul className="list-inside list-disc text-sm text-muted-foreground">
                            {requirements.writable.filter((p) => !p.writable).map((p) => (
                                <li key={p.path}>{p.path}</li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="flex gap-3 pt-4">
                    <Button asChild variant="outline">
                        <Link href={route('install.welcome')}>Back</Link>
                    </Button>
                    <Button asChild disabled={!requirements.passed}>
                        <Link href={route('install.env')}>Continue</Link>
                    </Button>
                </div>
            </div>
        </InstallLayout>
    );
}
