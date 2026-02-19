import { Head } from '@inertiajs/react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';

export default function Privacy() {
    const { siteSettings } = usePage<SharedData>().props;

    return (
        <>
            <Head title={`Privacy Policy - ${siteSettings.site_name}`} />
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
                                    <p>At {siteSettings.site_name}, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our loan services.</p>
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
                                    <p>We use the collected information for: processing loan applications, verifying your identity, communicating with you about your loan, improving our services, and complying with legal obligations.</p>
                                    <h2>4. Information Sharing</h2>
                                    <p>We may share your information with credit bureaus and financial institutions, service providers and business partners, and legal authorities when required by law.</p>
                                    <h2>5. Data Security</h2>
                                    <p>We implement appropriate security measures to protect your personal information, including encryption of sensitive data, secure data storage, regular security assessments, and employee training on data protection.</p>
                                    <h2>6. Your Rights</h2>
                                    <p>You have the right to access your personal information, correct inaccurate data, request deletion of your data, opt-out of marketing communications, and file a complaint with regulatory authorities.</p>
                                    <h2>7. Cookies and Tracking</h2>
                                    <p>We use cookies and similar technologies to enhance your experience and collect usage data. You can control cookie settings through your browser preferences.</p>
                                    <h2>8. Changes to This Policy</h2>
                                    <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.</p>
                                    <h2>9. Contact Us</h2>
                                    <p>If you have any questions about this Privacy Policy, please contact us at:</p>
                                    <ul>
                                        <li>Email: {siteSettings.company_email}</li>
                                        <li>Phone: {siteSettings.company_phone}</li>
                                        <li>Address: {siteSettings.company_address}</li>
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
