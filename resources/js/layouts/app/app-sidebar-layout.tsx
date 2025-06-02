import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren, memo } from 'react';

// Memoize the header component
const MemoizedAppSidebarHeader = memo(function MemoizedAppSidebarHeader({ breadcrumbs }: { breadcrumbs: BreadcrumbItem[] }) {
    return <AppSidebarHeader breadcrumbs={breadcrumbs} />;
});

// Memoize the content component
const MemoizedAppContent = memo(function MemoizedAppContent({ children, variant }: PropsWithChildren<{ variant: 'header' | 'sidebar' }>) {
    return (
        <AppContent variant={variant}>
            {children}
        </AppContent>
    );
});

// Memoize the main layout component
const AppSidebarLayout = memo(function AppSidebarLayout({ children, breadcrumbs = [] }: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <MemoizedAppContent variant="sidebar">
                <MemoizedAppSidebarHeader breadcrumbs={breadcrumbs} />
                {children}
            </MemoizedAppContent>
        </AppShell>
    );
});

export default AppSidebarLayout;
