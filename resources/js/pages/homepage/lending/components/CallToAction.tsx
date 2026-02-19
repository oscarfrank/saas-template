import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';

export function CallToAction() {
    const { siteSettings } = usePage<SharedData>().props;

    return (
        <section className="py-20 bg-blue-600 dark:bg-blue-700">
            <div className="container mx-auto px-6">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
                    <p className="text-xl text-blue-100 mb-8">
                        Join thousands of satisfied customers who have already experienced the {siteSettings.site_name} difference.
                        Apply now and get the financial support you need in no time.
                    </p>
                    <Link href="/register">
                        <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800">
                            Apply for a Loan
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
