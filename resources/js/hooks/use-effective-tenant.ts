import { usePage } from '@inertiajs/react';
import { useMemo } from 'react';
import { type Tenant } from '@/types';

interface PageProps {
    tenant: Tenant | null;
    tenants: Tenant[];
    preferences: {
        last_tenant_id: string | null;
        last_visited_page: string | null;
    };
    notifications: {
        unread_count: number;
    };
    [key: string]: any;
}

export function useEffectiveTenant() {
    const pageProps = usePage<PageProps>().props;
    const { 
        tenant: currentTenant, 
        tenants = [], 
        preferences = { last_tenant_id: null, last_visited_page: null },
        notifications = { unread_count: 0 }
    } = pageProps;

    const effectiveTenant = useMemo(() => {
        if (currentTenant) return currentTenant;
        if (preferences?.last_tenant_id) {
            return tenants.find(t => String(t.id) === String(preferences.last_tenant_id));
        }
        return null;
    }, [currentTenant, preferences?.last_tenant_id, tenants]);

    return {
        effectiveTenant,
        currentTenant,
        tenants,
        preferences,
        notifications
    };
} 