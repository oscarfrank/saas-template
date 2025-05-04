import { type User } from '@/types';

export function useRole() {
    const hasRole = (user: User, roleName: string) => {
        // console.log(user.roles);
        return user.roles.some((role: { name: string }) => role.name === roleName);
    };

    return { hasRole };
} 