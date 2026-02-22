import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { cn } from '@/lib/utils';
import AppLogoIcon from './app-logo-icon';

/** Public URL for a storage path (logo/favicon). Matches app.blade.php logic. */
function storageUrl(path: string | null | undefined): string | null {
    if (!path || typeof path !== 'string') return null;
    const normalized = path.startsWith('public/') ? path.slice(7) : path;
    return `/storage/${normalized}`;
}

/** Resolve logo URL: tenant (organization) logo first, then site logo, then site favicon. */
function resolveLogoUrl(props: SharedData['siteSettings'] | null, tenant: { logo?: string | null } | null): string | null {
    const tenantUrl = storageUrl(tenant?.logo ?? null);
    if (tenantUrl) return tenantUrl;
    const siteLogoUrl = storageUrl(props?.site_logo ?? null);
    if (siteLogoUrl) return siteLogoUrl;
    return storageUrl(props?.site_favicon ?? null);
}

/** When logged in: shows current workspace (tenant) logo, then site logo/favicon, else default SVG. */
export function AppLogoIconOrFavicon({ className }: { className?: string }) {
    const { siteSettings, tenant } = usePage<SharedData>().props;
    const logoUrl = resolveLogoUrl(siteSettings ?? null, tenant ?? null);
    const [imgFailed, setImgFailed] = useState(false);

    if (logoUrl && !imgFailed) {
        return (
            <img
                src={logoUrl}
                alt=""
                className={cn('object-contain', className)}
                onError={() => setImgFailed(true)}
            />
        );
    }
    return <AppLogoIcon className={cn('fill-current text-white dark:text-black', className)} />;
}

export default function AppLogo() {
    const { siteSettings, tenant } = usePage<SharedData>().props;
    const displayName = tenant?.name ?? siteSettings?.site_name ?? '';

    return (
        <>
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-md overflow-hidden">
                <AppLogoIconOrFavicon className="size-5" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-none font-semibold">{displayName}</span>
            </div>
        </>
    );
}
