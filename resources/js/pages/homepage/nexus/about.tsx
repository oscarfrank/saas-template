import { Head, usePage } from '@inertiajs/react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Network, Target, Zap } from 'lucide-react';
import { type SharedData } from '@/types';

export default function About() {
    const { siteSettings } = usePage<SharedData>().props;

    return (
        <>
            <Head title={`About – ${siteSettings.site_name}`} />
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
                                <Network className="h-6 w-6" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                                About {siteSettings.site_name}
                            </h1>
                            <p className="mt-6 text-lg leading-relaxed text-slate-600">
                                {siteSettings.site_description}
                            </p>
                            <p className="mt-4 text-lg leading-relaxed text-slate-600">
                                We built an operations and internal platform for companies that want one place to run teams, projects, docs, and day-to-day ops. Whether you’re a startup, remote team, tech company, or SME, Nexus keeps everyone connected and aligned.
                            </p>
                            <div className="mt-12 grid gap-6 sm:grid-cols-2">
                                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-6">
                                    <Target className="h-8 w-8 text-indigo-600" />
                                    <h2 className="mt-3 text-lg font-semibold text-slate-900">Our mission</h2>
                                    <p className="mt-2 text-sm text-slate-600">
                                        One nexus for operations: teams, projects, knowledge, and control—without tool sprawl.
                                    </p>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-6">
                                    <Zap className="h-8 w-8 text-indigo-600" />
                                    <h2 className="mt-3 text-lg font-semibold text-slate-900">Who it’s for</h2>
                                    <p className="mt-2 text-sm text-slate-600">
                                        Startups, remote teams, tech companies, and SMEs that need clarity and scale.
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
