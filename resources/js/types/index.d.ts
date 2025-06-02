import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
    className?: string;
    roles?: string[];
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
    siteSettings: {
        site_name: string;
        site_title: string;
        site_description: string;
        site_keywords: string;
        company_name: string;
        company_address: string;
        company_phone: string;
        company_email: string;
        company_website: string;
        facebook_url: string;
        twitter_url: string;
        instagram_url: string;
        linkedin_url: string;
        youtube_url: string;
        google_analytics_code: string | null;
        meta_tags: string;
        footer_text: string;
        maintenance_mode: boolean;
    };
    tenant: Tenant | null;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    roles: Array<{ name: string }>;
    [key: string]: unknown; // This allows for additional properties...
}

export interface KycVerification {
    id: number;
    full_name: string;
    email: string;
    status: 'pending' | 'approved' | 'rejected';
    id_type: string;
    submitted_at: string;
    verified_at: string | null;
    rejection_reason: string | null;
    documents: Array<{
        type: string;
        url: string;
        uploaded_at: string;
    }>;
} 

export interface Permission {
    id: number;
    name: string;
    guard_name: string;
    created_at: string;
    updated_at: string;
}

export interface Role {
    id: number;
    name: string;
    guard_name: string;
    created_at: string;
    updated_at: string;
    permissions: Permission[];
}

export interface PageProps {
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            roles: string[];
        };
    };
    flash: {
        message?: string;
        error?: string;
        success?: string;
    };
} 


export interface SiteSettings {
    id: number;
    site_name: string;
    site_title: string;
    site_description: string | null;
    site_keywords: string | null;
    site_logo: string | null;
    site_favicon: string | null;
    company_name: string;
    company_address: string;
    company_phone: string;
    company_email: string;
    company_website: string | null;
    facebook_url: string | null;
    twitter_url: string | null;
    instagram_url: string | null;
    linkedin_url: string | null;
    youtube_url: string | null;
    google_analytics_code: string | null;
    meta_tags: string | null;
    footer_text: string | null;
    maintenance_mode: boolean;
    created_at: string;
    updated_at: string;
}

export interface Tenant {
    id: string;
    name: string;
    slug: string;
    data?: Record<string, any>;
    created_at?: string;
    updated_at?: string;
} 
