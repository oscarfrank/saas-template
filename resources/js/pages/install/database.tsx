import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InstallLayout from '@/layouts/install-layout';

interface Props {
    steps: Record<string, { title: string; order: number }>;
    currentStep: string;
    success?: string;
    error?: string;
    output?: string;
}

export default function InstallDatabase({ steps, currentStep, success, error, output }: Props) {
    const { data, setData, post, processing } = useForm<{ confirm: string }>({ confirm: '' });

    return (
        <InstallLayout steps={steps} currentStep={currentStep}>
            <Head title="Database – Setup" />
            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-semibold">Database</h2>
                    <p className="text-muted-foreground mt-1">
                        Run migrations to create all tables. Your .env must have correct DB_* settings.
                    </p>
                </div>

                {success && <p className="rounded-md bg-green-500/10 text-green-700 dark:text-green-400 text-sm p-3">{success}</p>}
                {error && <p className="rounded-md bg-destructive/10 text-destructive text-sm p-3">{error}</p>}
                {output && <pre className="rounded border bg-muted p-3 text-xs overflow-auto max-h-48">{output}</pre>}

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        post(route('install.run-migrations'));
                    }}
                    className="space-y-4"
                >
                    <div>
                        <Label htmlFor="confirm">Type "yes" to run migrations</Label>
                        <Input
                            id="confirm"
                            value={data.confirm}
                            onChange={(e) => setData('confirm', e.target.value)}
                            placeholder="yes"
                            className="max-w-xs mt-1"
                        />
                    </div>
                    <div className="flex gap-3">
                        <Button type="submit" disabled={processing || data.confirm !== 'yes'}>
                            Run migrations
                        </Button>
                        <Button type="button" variant="outline" asChild>
                            <Link href={route('install.env')}>Back</Link>
                        </Button>
                    </div>
                </form>

                <div className="flex gap-3 pt-4 border-t">
                    <Button asChild>
                        <Link href={route('install.complete')}>Continue to finish</Link>
                    </Button>
                </div>
            </div>
        </InstallLayout>
    );
}
