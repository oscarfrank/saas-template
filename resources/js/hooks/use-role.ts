import { type User } from '@/types';

export function useRole() {
    const hasRole = (user: User | null | undefined, roleName: string) => {
        if (!user?.roles) return false;
        return user.roles.some((role: { name: string }) => role.name === roleName);
    };

    return { hasRole };
} 