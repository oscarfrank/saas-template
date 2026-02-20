import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import InstallLayout from '@/layouts/install-layout';

interface Props {
    steps: Record<string, { title: string; order: number }>;
    currentStep: string;
    envExampleKeys: string[];
    envStatus: {
        env_exists: boolean;
        app_key_set: boolean;
        db_configured: boolean;
        ready: boolean;
    };
}

export default function InstallEnv({ steps, currentStep, envExampleKeys, envStatus }: Props) {
    return (
        <InstallLayout steps={steps} currentStep={currentStep}>
            <Head title="Environment – Setup" />
            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-semibold">Environment (.env)</h2>
                    <p className="text-muted-foreground mt-1">
                        Create a <code className="rounded bg-muted px-1 py-0.5 text-sm">.env</code> file in the project root (copy from <code className="rounded bg-muted px-1 py-0.5 text-sm">.env.example</code>), then set at least:
                    </p>
                </div>

                <div className="rounded-lg border bg-card p-4 space-y-2">
                    <p className="text-sm font-medium">Required variables</p>
                    <ul className="text-muted-foreground text-sm list-inside list-disc">
                        <li><code>APP_KEY</code> – run <code className="bg-muted px-1 rounded">php artisan key:generate</code></li>
                        <li><code>DB_CONNECTION</code>, <code>DB_DATABASE</code> (and for MySQL: <code>DB_HOST</code>, <code>DB_USERNAME</code>, <code>DB_PASSWORD</code>)</li>
                    </ul>
                    <p className="text-muted-foreground text-sm pt-2">
                        All keys from .env.example: {envExampleKeys.slice(0, 20).join(', ')}
                        {envExampleKeys.length > 20 ? ` … and ${envExampleKeys.length - 20} more` : ''}
                    </p>
                </div>

                <div className="rounded-lg border bg-card p-4 space-y-2">
                    <p className="text-sm font-medium">Status</p>
                    <div className="flex items-center gap-2">
                        <span>.env file exists</span>
                        <span className={envStatus.env_exists ? 'text-green-600' : 'text-destructive'}>{envStatus.env_exists ? <Check className="size-4" /> : <X className="size-4" />}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>APP_KEY set</span>
                        <span className={envStatus.app_key_set ? 'text-green-600' : 'text-destructive'}>{envStatus.app_key_set ? <Check className="size-4" /> : <X className="size-4" />}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>Database connection</span>
                        <span className={envStatus.db_configured ? 'text-green-600' : 'text-muted-foreground'}>{envStatus.db_configured ? <Check className="size-4" /> : <X className="size-4" />}</span>
                    </div>
                </div>

                <div className="flex gap-3 pt-4">
                    <Button asChild variant="outline">
                        <Link href={route('install.requirements')}>Back</Link>
                    </Button>
                    <Button asChild disabled={!envStatus.ready}>
                        <Link href={route('install.database')}>Continue</Link>
                    </Button>
                </div>
            </div>
        </InstallLayout>
    );
}
