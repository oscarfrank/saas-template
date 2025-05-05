import { Clock, DollarSign, Shield, TrendingUp } from 'lucide-react';

export function Features() {
    return (
        <section id="features" className="py-20">
            <div className="container mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                        Why Choose LendFast?
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300">
                        We combine innovation with reliability to deliver exceptional financial solutions.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div className="relative group p-6">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative p-6 bg-white dark:bg-gray-900 rounded-xl ring-1 ring-gray-900/5 dark:ring-gray-800">
                            <Clock className="h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Quick Approval</h3>
                            <p className="text-gray-600 dark:text-gray-300">Get your loan approved within 24 hours with minimal documentation.</p>
                        </div>
                    </div>
                    <div className="relative group p-6">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative p-6 bg-white dark:bg-gray-900 rounded-xl ring-1 ring-gray-900/5 dark:ring-gray-800">
                            <DollarSign className="h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Flexible Terms</h3>
                            <p className="text-gray-600 dark:text-gray-300">Choose repayment terms that work best for your financial situation.</p>
                        </div>
                    </div>
                    <div className="relative group p-6">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative p-6 bg-white dark:bg-gray-900 rounded-xl ring-1 ring-gray-900/5 dark:ring-gray-800">
                            <Shield className="h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Secure & Safe</h3>
                            <p className="text-gray-600 dark:text-gray-300">Your data is protected with bank-level security measures.</p>
                        </div>
                    </div>
                    <div className="relative group p-6">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative p-6 bg-white dark:bg-gray-900 rounded-xl ring-1 ring-gray-900/5 dark:ring-gray-800">
                            <TrendingUp className="h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Competitive Rates</h3>
                            <p className="text-gray-600 dark:text-gray-300">Enjoy some of the most competitive interest rates in the market.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
} 