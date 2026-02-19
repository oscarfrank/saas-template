import { Head, usePage } from '@inertiajs/react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Building2, Target, Zap } from 'lucide-react';
import { type SharedData } from '@/types';

export default function About() {
    const { siteSettings } = usePage<SharedData>().props;

    return (
        <>
            <Head title={`About – ${siteSettings.site_name}`} />
            <link
                href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap"
                rel="stylesheet"
            />
            <div
                className="min-h-screen bg-white text-slate-900 antialiased"
                style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
            >
                <Header />
                <main className="pt-24 pb-20">
                    <section className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-3xl">
                            <div className="mb-10 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                                <Building2 className="h-6 w-6" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                                About {siteSettings.site_name}
                            </h1>
                            <p className="mt-6 text-lg leading-relaxed text-slate-600">
                                {siteSettings.site_description}
                            </p>
                            <p className="mt-4 text-lg leading-relaxed text-slate-600">
                                We’re the organization behind this platform: we manage our staff, run a YouTube studio, handle payroll and assets, offer staff loans, and plan projects—all in one place. We built the tools we need and opened them so others can run their organizations with the same clarity.
                            </p>
                            <div className="mt-12 grid gap-6 sm:grid-cols-2">
                                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-6">
                                    <Target className="h-8 w-8 text-slate-700" />
                                    <h2 className="mt-3 text-lg font-semibold text-slate-900">Our mission</h2>
                                    <p className="mt-2 text-sm text-slate-600">
                                        One platform to run the organization: people, content, money, and plans—without the sprawl.
                                    </p>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-6">
                                    <Zap className="h-8 w-8 text-slate-700" />
                                    <h2 className="mt-3 text-lg font-semibold text-slate-900">What we do</h2>
                                    <p className="mt-2 text-sm text-slate-600">
                                        Staff management, YouTube studio, payroll, assets, staff loans, and project planning—integrated and simple.
                                    </p>
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
