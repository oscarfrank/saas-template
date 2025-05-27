import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';

const CancelPage: React.FC = () => {
    return (
        <div className="container mx-auto px-4 py-8">
            <Card className="max-w-md mx-auto p-6">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold mb-4">Payment Cancelled</h1>
                    <p className="text-gray-600 mb-6">
                        Your payment was cancelled. No charges were made to your account.
                    </p>
                    <div className="space-y-3">
                        <Link href="/payment">
                            <Button className="w-full">
                                Try Again
                            </Button>
                        </Link>
                        <Link href="/dashboard">
                            <Button variant="outline" className="w-full">
                                Return to Dashboard
                            </Button>
                        </Link>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default CancelPage; 