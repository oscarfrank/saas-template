import { useCallback } from 'react';

export function useInitials() {
    return useCallback((firstName: string, lastName: string): string => {
        if (!firstName && !lastName) return '';
        if (!lastName) return firstName.charAt(0).toUpperCase();
        if (!firstName) return lastName.charAt(0).toUpperCase();

        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }, []);
}
