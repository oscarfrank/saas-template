import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';

const SuccessPage: React.FC = () => {
    return (
        <div className="container mx-auto px-4 py-8">
            <Card className="max-w-md mx-auto p-6">
                <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold mb-4">Payment Successful!</h1>
                    <p className="text-gray-600 mb-6">
                        Thank you for your subscription. Your payment has been processed successfully.
                    </p>
                    <Link href="/dashboard">
                        <Button className="w-full">
                            Return to Dashboard
                        </Button>
                    </Link>
                </div>
            </Card>
        </div>
    );
};

export default SuccessPage; 