import { Head } from '@inertiajs/react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';

export default function Privacy() {
    return (
        <>
            <Head title="Privacy Policy - LendFast" />
            <div className="min-h-screen bg-white dark:bg-gray-900">
                <Header />
                <main>
                    <section className="py-20">
                        <div className="container mx-auto px-6">
                            <div className="max-w-4xl mx-auto">
                                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                                    Privacy Policy
                                </h1>
                                <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 text-center">
                                    Last updated: {new Date().toLocaleDateString()}
                                </p>
                                <div className="prose dark:prose-invert max-w-none">
                                    <h2>1. Introduction</h2>
                                    <p>
                                        At LendFast, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our loan services.
                                    </p>

                                    <h2>2. Information We Collect</h2>
                                    <h3>2.1 Personal Information</h3>
                                    <ul>
                                        <li>Name, email address, and phone number</li>
                                        <li>Financial information and credit history</li>
                                        <li>Government-issued identification</li>
                                        <li>Employment and income details</li>
                                    </ul>

                                    <h3>2.2 Usage Data</h3>
                                    <ul>
                                        <li>IP address and browser type</li>
                                        <li>Pages visited and time spent</li>
                                        <li>Device information</li>
                                        <li>Cookies and similar tracking technologies</li>
                                    </ul>

                                    <h2>3. How We Use Your Information</h2>
                                    <p>We use the collected information for:</p>
                                    <ul>
                                        <li>Processing loan applications</li>
                                        <li>Verifying your identity</li>
                                        <li>Communicating with you about your loan</li>
                                        <li>Improving our services</li>
                                        <li>Complying with legal obligations</li>
                                    </ul>

                                    <h2>4. Information Sharing</h2>
                                    <p>We may share your information with:</p>
                                    <ul>
                                        <li>Credit bureaus and financial institutions</li>
                                        <li>Service providers and business partners</li>
                                        <li>Legal authorities when required by law</li>
                                    </ul>

                                    <h2>5. Data Security</h2>
                                    <p>
                                        We implement appropriate security measures to protect your personal information, including:
                                    </p>
                                    <ul>
                                        <li>Encryption of sensitive data</li>
                                        <li>Secure data storage</li>
                                        <li>Regular security assessments</li>
                                        <li>Employee training on data protection</li>
                                    </ul>

                                    <h2>6. Your Rights</h2>
                                    <p>You have the right to:</p>
                                    <ul>
                                        <li>Access your personal information</li>
                                        <li>Correct inaccurate data</li>
                                        <li>Request deletion of your data</li>
                                        <li>Opt-out of marketing communications</li>
                                        <li>File a complaint with regulatory authorities</li>
                                    </ul>

                                    <h2>7. Cookies and Tracking</h2>
                                    <p>
                                        We use cookies and similar technologies to enhance your experience and collect usage data. You can control cookie settings through your browser preferences.
                                    </p>

                                    <h2>8. Changes to This Policy</h2>
                                    <p>
                                        We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
                                    </p>

                                    <h2>9. Contact Us</h2>
                                    <p>
                                        If you have any questions about this Privacy Policy, please contact us at:
                                    </p>
                                    <ul>
                                        <li>Email: privacy@lendfast.com</li>
                                        <li>Phone: +1 (555) 123-4567</li>
                                        <li>Address: 123 Financial Street, New York, NY 10001</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>
                <Footer />
            </div>
        </>
    );
} 