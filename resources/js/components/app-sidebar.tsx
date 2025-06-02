import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { router } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, ShoppingBag, ShoppingCart, FileText, Bell, Wallet, Handshake, UserRoundCog, Ticket, Building2 } from 'lucide-react';
import AppLogo from './app-logo';
import { Button } from '@/components/ui/button';
import { TeamSwitcher } from '@/components/team-switcher';
import { useRef, useMemo, memo } from 'react';
import { AppNotifications } from './app-notifications';

import { useAuth } from '@/hooks/use-auth';
import { useRole } from '@/hooks/use-role';
import { useEffectiveTenant } from '@/hooks/use-effective-tenant';
import { PageProps as InertiaPageProps } from '@inertiajs/core';

interface Tenant {
    id: string;
    name: string;
    slug: string;
}

interface PageProps extends InertiaPageProps {
    tenant: Tenant | null;
    tenants: Tenant[];
    preferences: {
        last_tenant_id: string | null;
        last_visited_page: string | null;
    };
    [key: string]: any;
}

// Memoize the OrganizationLogo component
const OrganizationLogo = memo(function OrganizationLogo() {
    return <Building2 className="size-4" />;
});

// Memoize the TeamSwitcher component
const MemoizedTeamSwitcher = memo(function MemoizedTeamSwitcher({ 
    teams, 
    onTeamSwitch, 
    defaultTeam 
}: { 
    teams: any[], 
    onTeamSwitch: (team: { slug: string }) => void, 
    defaultTeam?: string 
}) {
    return (
        <TeamSwitcher
            teams={teams}
            onTeamSwitch={onTeamSwitch}
            defaultTeam={defaultTeam}
        />
    );
});

export const AppSidebar = memo(function AppSidebar() {
    const { user } = useAuth();
    const { hasRole } = useRole();
    const { notifications, effectiveTenant, tenants, preferences } = useEffectiveTenant();
    const { state } = useSidebar();

    console.log(notifications);

    // Memoize the teams data
    const teams = useMemo(() => tenants.map(t => ({
        name: t.name,
        logo: OrganizationLogo,
        plan: hasRole(user, 'superadmin') ? 'Admin' : 'User',
        slug: t.slug
    })), [tenants, user, hasRole]);

    const handleTeamSwitch = (team: { slug: string }) => {
        router.visit(`/${team.slug}/dashboard`, {
            preserveState: false,
            preserveScroll: false,
            only: ['tenant', 'preferences'],
        });
    };

    // Memoize the main navigation items
    const mainNavItems = useMemo(() => [
        {
            title: 'Dashboard',
            href: `/${effectiveTenant?.slug}/dashboard`,
            icon: LayoutGrid,
        },
        {
            title: 'Products',
            href: `/${effectiveTenant?.slug}/products`,
            icon: ShoppingBag,
        },
        {
            title: 'KYC',
            href: `/${effectiveTenant?.slug}/kyc`,
            icon: FileText,
        },
        {
            title: 'Transactions',
            href: `/${effectiveTenant?.slug}/transactions`,
            icon: Wallet,
        },
        {
            title: 'Notifications',
            href: `/${effectiveTenant?.slug}/activity`,
            icon: Bell,
        },
        {
            title: 'Loan Packages',
            href: `/${effectiveTenant?.slug}/loan-packages`,
            icon: Handshake,
        },
        {
            title: 'My Loans',
            href: `/${effectiveTenant?.slug}/loans`,
            icon: Handshake,
        },
        {
            title: 'Borrows',
            href: `/${effectiveTenant?.slug}/borrows`,
            icon: Handshake,
        },
        {
            title: 'Tickets',
            href: `/${effectiveTenant?.slug}/tickets`,
            icon: Ticket,
        },
    ], [effectiveTenant?.slug]);

    const footerNavItems: NavItem[] = [
        {
            title: 'Repository',
            href: 'https://github.com/laravel/react-starter-kit',
            icon: Folder,
        },
        {
            title: 'Documentation',
            href: 'https://laravel.com/docs/starter-kits#react',
            icon: BookOpen,
        },
    ];

    const adminNavItems: NavItem[] = [
        {
            title: 'Admin',
            href: '/admin/dashboard',
            icon: UserRoundCog,
            className: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md',
            roles: ['superadmin', 'admin', 'manager']
        },
        {
            title: 'Ticket Support',
            href: '/admin/tickets',
            icon: Ticket,
            className: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md',
            roles: ['support']
        },
    ];

    // Ensure currentTenant has required properties
    if (!effectiveTenant?.slug) {
        return (
            <Sidebar collapsible="icon" variant="inset" className="border-r border-border">
                <SidebarHeader className="border-b border-border">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <MemoizedTeamSwitcher
                                teams={teams}
                                onTeamSwitch={handleTeamSwitch}
                                defaultTeam={preferences?.last_tenant_id ? 
                                    tenants.find(t => String(t.id) === String(preferences.last_tenant_id))?.slug : 
                                    undefined
                                }
                            />
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarHeader>
                <SidebarContent>
                    <div className="p-4 text-center text-muted-foreground">
                        Please select an organization to continue
                    </div>
                </SidebarContent>
                <SidebarFooter>
                    <NavUser />
                </SidebarFooter>
            </Sidebar>
        );
    }

    return (
        <Sidebar collapsible="icon" variant="inset" className="border-r border-border">
            <SidebarHeader className="border-b border-border">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <MemoizedTeamSwitcher
                            teams={teams}
                            onTeamSwitch={handleTeamSwitch}
                            defaultTeam={effectiveTenant.slug}
                        />
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                    {effectiveTenant && (
                        <div>
                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-2"
                                onClick={() => router.visit(`/${effectiveTenant.slug}/dashboard`)}
                            >
                                <LayoutGrid className="size-4" />
                                {state === "expanded" && <span>Dashboard</span>}
                            </Button>
                            {state === "expanded" && <AppNotifications unreadCount={notifications.unread_count} />}
                        </div>
                    )}
                    </SidebarMenuItem>

                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                
                <NavMain items={mainNavItems.filter(item => item.title !== 'Dashboard')} />
            </SidebarContent>

            <SidebarFooter className="border-t border-border">
                {hasRole(user, 'user') ? '' : <NavFooter items={adminNavItems} className="mt-auto" />}
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
});
