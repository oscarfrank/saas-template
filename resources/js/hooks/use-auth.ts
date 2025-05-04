import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';

export function useAuth() {
    const { auth } = usePage<SharedData>().props;
    return auth;
} 