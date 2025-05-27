import { useEffect } from 'react';
import { PageProps } from '@/types';

interface CheckoutProps extends PageProps {
    checkoutUrl: string;
}

export default function Checkout({ checkoutUrl }: CheckoutProps) {
    useEffect(() => {
        if (checkoutUrl) {
            window.location.href = checkoutUrl;
        }
    }, [checkoutUrl]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <p className="text-lg">Redirecting to checkout...</p>
            </div>
        </div>
    );
} 