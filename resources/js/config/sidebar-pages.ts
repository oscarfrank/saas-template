import {
    PenTool,
    ShoppingBag,
    FileText,
    ScrollText,
    Users,
    Package,
    Wallet,
    Bell,
    Handshake,
    Ticket,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface SidebarPageDefinition {
    id: string;
    title: string;
    pathSuffix: string;
    icon: LucideIcon;
}

/** Default order of page ids in the sidebar "Pages" section. */
export const SIDEBAR_PAGE_IDS = [
    'creator',
    'products',
    'kyc',
    'script',
    'hr',
    'assets',
    'transactions',
    'activity',
    'loan-packages',
    'loans',
    'borrows',
    'tickets',
] as const;

export type SidebarPageId = (typeof SIDEBAR_PAGE_IDS)[number];

export const SIDEBAR_PAGE_DEFINITIONS: SidebarPageDefinition[] = [
    { id: 'creator', title: 'Creator', pathSuffix: 'creator', icon: PenTool },
    { id: 'products', title: 'Products', pathSuffix: 'products', icon: ShoppingBag },
    { id: 'kyc', title: 'KYC', pathSuffix: 'kyc', icon: FileText },
    { id: 'script', title: 'Script', pathSuffix: 'script', icon: ScrollText },
    { id: 'hr', title: 'HR', pathSuffix: 'hr', icon: Users },
    { id: 'assets', title: 'Assets', pathSuffix: 'assets', icon: Package },
    { id: 'transactions', title: 'Transactions', pathSuffix: 'transactions', icon: Wallet },
    { id: 'activity', title: 'Notifications', pathSuffix: 'activity', icon: Bell },
    { id: 'loan-packages', title: 'Loan Packages', pathSuffix: 'loan-packages', icon: Handshake },
    { id: 'loans', title: 'My Loans', pathSuffix: 'loans', icon: Handshake },
    { id: 'borrows', title: 'Borrows', pathSuffix: 'borrows', icon: Handshake },
    { id: 'tickets', title: 'Tickets', pathSuffix: 'tickets', icon: Ticket },
];

export interface SidebarPagesConfig {
    order?: string[];
    enabled?: Record<string, boolean>;
}

/**
 * Build the list of sidebar page items for display, respecting tenant config (order + enabled).
 * @param tenantSlug - Current tenant slug for building hrefs
 * @param config - Optional tenant.data.sidebar_pages
 */
export function buildSidebarPages(
    tenantSlug: string,
    config?: SidebarPagesConfig | null
): { id: string; title: string; href: string; icon: LucideIcon }[] {
    const order = config?.order?.length ? config.order : [...SIDEBAR_PAGE_IDS];
    const enabled = config?.enabled ?? {};
    const byId = new Map(SIDEBAR_PAGE_DEFINITIONS.map((d) => [d.id, d]));
    const result: { id: string; title: string; href: string; icon: LucideIcon }[] = [];
    const seen = new Set<string>();
    for (const id of order) {
        if (seen.has(id)) continue;
        seen.add(id);
        const def = byId.get(id);
        if (!def) continue;
        if (enabled[id] === false) continue;
        result.push({
            id: def.id,
            title: def.title,
            href: `/${tenantSlug}/${def.pathSuffix}`,
            icon: def.icon,
        });
    }
    for (const def of SIDEBAR_PAGE_DEFINITIONS) {
        if (seen.has(def.id)) continue;
        if (enabled[def.id] === false) continue;
        result.push({
            id: def.id,
            title: def.title,
            href: `/${tenantSlug}/${def.pathSuffix}`,
            icon: def.icon,
        });
    }
    return result;
}
