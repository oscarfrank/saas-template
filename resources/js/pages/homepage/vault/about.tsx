import { Head, usePage } from '@inertiajs/react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { KeyRound, Target, Sparkles } from 'lucide-react';
import { type SharedData } from '@/types';

export default function About() {
    const { siteSettings } = usePage<SharedData>().props;

    return (
        <>
            <Head title={`About – ${siteSettings.site_name}`} />
            <link
                href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&display=swap"
                rel="stylesheet"
            />
            <div
                className="min-h-screen bg-slate-950 text-white antialiased"
                style={{ fontFamily: "'Syne', system-ui, sans-serif" }}
            >
                <Header />
                <main className="pt-24 pb-20">
                    <section className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-3xl">
                            <div className="mb-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400">
                                <KeyRound className="h-6 w-6" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                About {siteSettings.site_name}
                            </h1>
                            <p className="mt-6 text-lg leading-relaxed text-slate-400">
                                {siteSettings.site_description}
                            </p>
                            <p className="mt-4 text-lg leading-relaxed text-slate-400">
                                We run a membership and subscription platform so you can offer tiers, manage billing, and give your members one place to access perks and manage their account. We built it to be flexible—upgrade, downgrade, or cancel anytime.
                            </p>
                            <div className="mt-12 grid gap-6 sm:grid-cols-2">
                                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                                    <Target className="h-8 w-8 text-amber-400" />
                                    <h2 className="mt-3 text-lg font-semibold text-white">Our mission</h2>
                                    <p className="mt-2 text-sm text-slate-400">
                                        Make membership simple: clear tiers, secure billing, and a single dashboard for every member.
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                                    <Sparkles className="h-8 w-8 text-amber-400" />
                                    <h2 className="mt-3 text-lg font-semibold text-white">What you get</h2>
                                    <p className="mt-2 text-sm text-slate-400">
                                        Tiers, billing, renewals, member dashboard, and perks—all in one platform.
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
