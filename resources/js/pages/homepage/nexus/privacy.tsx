import { Head } from '@inertiajs/react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { usePage } from '@inertiajs/react';
import { Shield } from 'lucide-react';
import { type SharedData } from '@/types';

export default function Privacy() {
    const { siteSettings } = usePage<SharedData>().props;

    return (
        <>
            <Head title={`Privacy – ${siteSettings.site_name}`} />
            <link
                href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
                rel="stylesheet"
            />
            <div
                className="min-h-screen bg-white text-slate-900 antialiased"
                style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
            >
                <Header />
                <main className="pt-24 pb-20">
                    <section className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-3xl">
                            <div className="mb-10 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                                <Shield className="h-6 w-6" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                                Privacy policy
                            </h1>
                            <p className="mt-4 text-sm text-slate-500">
                                Last updated: {new Date().toLocaleDateString()}
                            </p>
                            <div className="mt-8 space-y-6 text-slate-600">
                                <p className="leading-relaxed">
                                    {siteSettings.site_name} respects your privacy. We collect only what we need to provide and operate the platform—account and team data, usage related to projects and docs—and we don’t sell your data.
                                </p>
                                <p className="leading-relaxed">
                                    For questions or to exercise your rights, contact us at{' '}
                                    <a href={`mailto:${siteSettings.company_email}`} className="text-indigo-600 font-medium hover:underline">
                                        {siteSettings.company_email}
                                    </a>.
                                </p>
                            </div>
                        </div>
                    </section>
                </main>
                <Footer />
            </div>
        </>
    );
}
