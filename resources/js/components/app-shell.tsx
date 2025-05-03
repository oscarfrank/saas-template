import { SidebarProvider } from '@/components/ui/sidebar';
import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { Toaster } from '@/components/ui/sonner';

interface AppShellProps {
    children: React.ReactNode;
    variant?: 'header' | 'sidebar';
}

export function AppShell({ children, variant = 'header' }: AppShellProps) {
    const isOpen = usePage<SharedData>().props.sidebarOpen;

    if (variant === 'header') {
        return (
            <div className="flex min-h-screen w-full flex-col">
                {children}
                <Toaster />
            </div>
        );
    }

    return (
        <SidebarProvider defaultOpen={isOpen}>
            {children}
            <Toaster />
        </SidebarProvider>
    );
}
