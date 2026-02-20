import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InstallLayout from '@/layouts/install-layout';

interface Props {
    steps: Record<string, { title: string; order: number }>;
    currentStep: string;
}

export default function InstallComplete({ steps, currentStep }: Props) {
    const { data, setData, post, processing } = useForm<{ confirm: string }>({ confirm: '' });

    return (
        <InstallLayout steps={steps} currentStep={currentStep}>
            <Head title="Complete – Setup" />
            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-semibold">Complete</h2>
                    <p className="text-muted-foreground mt-1">
                        Mark the application as installed. After this, <code className="rounded bg-muted px-1 py-0.5 text-sm">/install</code> will no longer be available and visitors will see the homepage.
                    </p>
                </div>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        post(route('install.finish'));
                    }}
                    className="space-y-4"
                >
                    <div>
                        <Label htmlFor="confirm">Type "yes" to finish setup</Label>
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
                            Finish installation
                        </Button>
                        <Button type="button" variant="outline" asChild>
                            <Link href={route('install.database')}>Back</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </InstallLayout>
    );
}
