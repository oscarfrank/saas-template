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
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
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
