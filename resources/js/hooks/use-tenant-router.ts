import { router, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { type PageProps } from '@/types';

interface TenantRouterOptions {
    preserveState?: boolean;
    preserveScroll?: boolean;
    only?: string[];
    onSuccess?: () => void;
    onError?: (errors: any) => void;
    onStart?: () => void;
    onFinish?: () => void;
    replace?: boolean;
}

interface TenantPageProps extends PageProps {
    tenant: {
        slug: string;
        [key: string]: any;
    };
    [key: string]: any;
}

export function useTenantRouter() {
    const { tenant } = usePage<TenantPageProps>().props;
    
    // Helper to get route URL by name
    const getRouteUrl = (routeName: string, params: Record<string, any> = {}) => {
        // If routeName is a full URL, return it as is
        if (routeName.startsWith('http://') || routeName.startsWith('https://')) {
            return routeName;
        }

        // If routeName is a path starting with /, prepend tenant
        if (routeName.startsWith('/')) {
            return `/${tenant.slug}${routeName}`;
        }

        // Use Inertia's route() function to resolve the route name
        return route(routeName, { ...params, tenant: tenant.slug });
    };
    
    // GET request
    const get = (routeNameOrPath: string, params: Record<string, any> = {}, options: TenantRouterOptions = {}) => {
        const url = getRouteUrl(routeNameOrPath, params);
        return router.get(url, {}, options);
    };
    
    // POST request
    const post = (routeNameOrPath: string, data: Record<string, any> = {}, params: Record<string, any> = {}, options: TenantRouterOptions = {}) => {
        const url = getRouteUrl(routeNameOrPath, params);
        return router.post(url, data, options);
    };
    
    // PUT request
    const put = (routeNameOrPath: string, data: Record<string, any> = {}, params: Record<string, any> = {}, options: TenantRouterOptions = {}) => {
        const url = getRouteUrl(routeNameOrPath, params);
        return router.put(url, data, options);
    };
    
    // PATCH request
    const patch = (routeNameOrPath: string, data: Record<string, any> = {}, params: Record<string, any> = {}, options: TenantRouterOptions = {}) => {
        const url = getRouteUrl(routeNameOrPath, params);
        return router.patch(url, data, options);
    };
    
    // DELETE request
    const destroy = (routeNameOrPath: string, params: Record<string, any> = {}, options: TenantRouterOptions = {}) => {
        const url = getRouteUrl(routeNameOrPath, params);
        return router.delete(url, options);
    };
    
    // Visit (for navigation)
    const visit = (routeNameOrPath: string, params: Record<string, any> = {}, options: TenantRouterOptions = {}) => {
        const url = getRouteUrl(routeNameOrPath, params);
        return router.visit(url, options);
    };
    
    // Reload current page
    const reload = (options: TenantRouterOptions = {}) => {
        return router.reload(options);
    };
    
    return { 
        get, 
        post, 
        put, 
        patch, 
        delete: destroy, 
        visit, 
        reload, 
        route: getRouteUrl, // For just getting the URL without making a request
        tenant 
    };
} 