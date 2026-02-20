import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { Check } from 'lucide-react';

type Steps = Record<string, { title: string; order: number }>;

interface InstallLayoutProps {
    steps: Steps;
    currentStep: string;
}

export default function InstallLayout({ steps, currentStep, children }: PropsWithChildren<InstallLayoutProps>) {
    const ordered = Object.entries(steps).sort((a, b) => a[1].order - b[1].order);
    const currentOrder = steps[currentStep]?.order ?? 0;

    return (
        <div className="bg-muted/30 min-h-svh flex flex-col">
            <Toaster />
            <header className="border-b bg-background px-6 py-4">
                <div className="mx-auto flex max-w-3xl items-center justify-between">
                    <h1 className="text-lg font-semibold">Setup</h1>
                    <nav className="flex items-center gap-1">
                        {ordered.map(([key, { title }]) => {
                            const order = steps[key].order;
                            const done = order < currentOrder;
                            const active = key === currentStep;
                            const href = key === 'welcome' ? '/install' : `/install/${key}`;
                                    return (
                                <Link
                                    key={key}
                                    href={href}
                                    className={`rounded px-2 py-1 text-sm ${active ? 'bg-primary text-primary-foreground' : done ? 'text-muted-foreground hover:text-foreground' : 'text-muted-foreground'}`}
                                >
                                    {done ? <Check className="inline-block size-3.5 mr-1" /> : null}
                                    {title}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </header>
            <main className="mx-auto w-full max-w-3xl flex-1 p-6">
                {children}
            </main>
        </div>
    );
}
