import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, ShoppingBag, ShoppingCart, FileText, Bell, Wallet, Handshake, UserRoundCog, Ticket } from 'lucide-react';
import AppLogo from './app-logo';

import { useAuth } from '@/hooks/use-auth';
import { useRole } from '@/hooks/use-role';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Products',
        href: '/products',
        icon: ShoppingBag,
    },
    {
        title: 'KYC',
        href: '/kyc',
        icon: FileText,
    },
    {
        title: 'Transactions',
        href: '/transactions',
        icon: Wallet,
    },
    {
        title: 'Notifications',
        href: '/activity',
        icon: Bell,
    },
    {
        title: 'Loan Packages',
        href: '/loan-packages',
        icon: Handshake,
    },
    {
        title: 'My Loans',
        href: '/loans',
        icon: Handshake,
    },
    {
        title: 'Borrows',
        href: '/borrows',
        icon: Handshake,
    },
    {
        title: 'Tickets',
        href: '/tickets',
        icon: Ticket,
    },
];

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



export function AppSidebar() {

    const { user } = useAuth();
    const { hasRole } = useRole();

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                {/* <NavFooter items={footerNavItems} className="mt-auto" /> */}
                {hasRole(user, 'user') ? '' : <NavFooter items={adminNavItems} className="mt-auto" />}
                
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
