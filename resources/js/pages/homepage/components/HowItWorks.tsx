export function HowItWorks() {
    return (
        <section className="py-20 bg-gray-50 dark:bg-gray-800">
            <div className="container mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                        How It Works
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300">
                        Our streamlined process makes getting a loan simple and efficient.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative p-8 bg-white dark:bg-gray-900 rounded-xl ring-1 ring-gray-900/5 dark:ring-gray-800">
                            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-6">1</div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Apply Online</h3>
                            <p className="text-gray-600 dark:text-gray-300">Fill out our simple application form in minutes.</p>
                        </div>
                    </div>
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative p-8 bg-white dark:bg-gray-900 rounded-xl ring-1 ring-gray-900/5 dark:ring-gray-800">
                            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-6">2</div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Get Approved</h3>
                            <p className="text-gray-600 dark:text-gray-300">Receive quick approval with minimal documentation.</p>
                        </div>
                    </div>
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative p-8 bg-white dark:bg-gray-900 rounded-xl ring-1 ring-gray-900/5 dark:ring-gray-800">
                            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-6">3</div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Receive Funds</h3>
                            <p className="text-gray-600 dark:text-gray-300">Get your money directly in your bank account.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
} 