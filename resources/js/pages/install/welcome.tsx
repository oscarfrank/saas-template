import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import InstallLayout from '@/layouts/install-layout';

interface Props {
    steps: Record<string, { title: string; order: number }>;
    currentStep: string;
}

export default function InstallWelcome({ steps, currentStep }: Props) {
    return (
        <InstallLayout steps={steps} currentStep={currentStep}>
            <Head title="Welcome – Setup" />
            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-semibold">Welcome</h2>
                    <p className="text-muted-foreground mt-1">
                        This wizard will guide you through the setup. You’ll check requirements, configure your .env file, run migrations, and then you’re done.
                    </p>
                </div>
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                    <li>Check PHP version and extensions</li>
                    <li>Ensure storage and cache directories are writable</li>
                    <li>Configure .env (copy from .env.example and set APP_KEY, DB_*, etc.)</li>
                    <li>Run database migrations</li>
                    <li>Mark installation complete</li>
                </ul>
                <div className="flex gap-3 pt-4">
                    <Button asChild>
                        <Link href={route('install.requirements')}>Get started</Link>
                    </Button>
                </div>
            </div>
        </InstallLayout>
    );
}
