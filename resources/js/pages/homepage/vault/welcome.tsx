import { Head, Link, usePage } from '@inertiajs/react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Button } from '@/components/ui/button';
import {
    Layers,
    LayoutDashboard,
    CreditCard,
    Gift,
    Users,
    ArrowRight,
    Check,
} from 'lucide-react';
import { type SharedData } from '@/types';

const features = [
    {
        icon: Layers,
        title: 'Membership tiers',
        description: 'Choose the plan that fits. Upgrade, downgrade, or cancel anytime—no lock-in.',
    },
    {
        icon: LayoutDashboard,
        title: 'Member dashboard',
        description: 'One place to manage your subscription, billing, and member-only content.',
    },
    {
        icon: CreditCard,
        title: 'Billing & renewals',
        description: 'Secure payments, clear invoices, and hassle-free renewals so you stay in control.',
    },
    {
        icon: Gift,
        title: 'Perks & benefits',
        description: 'Exclusive access, early releases, and rewards that grow with your tier.',
    },
    {
        icon: Users,
        title: 'Member community',
        description: 'Connect with other members, get support, and share inside the Vault.',
    },
];

const highlights = [
    'Cancel or change plan anytime',
    'Secure billing & member dashboard',
    'Exclusive perks by tier',
];

export default function Welcome() {
    const { siteSettings } = usePage<SharedData>().props;

    return (
        <>
            <Head title={`${siteSettings.site_name} – Membership & subscriptions`} />
            <link
                href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&display=swap"
                rel="stylesheet"
            />
            <div
                className="min-h-screen bg-slate-950 text-white antialiased"
                style={{ fontFamily: "'Syne', system-ui, sans-serif" }}
            >
                <Header />
                <main className="pt-16">
                    {/* Hero */}
                    <section className="relative overflow-hidden border-b border-white/[0.06]">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-15%,rgba(245,158,11,0.12),transparent)]" />
                        <div className="absolute left-1/2 top-[15%] h-[420px] w-[640px] -translate-x-1/2 rounded-full bg-amber-500/10 blur-[130px]" />
                        <div className="container relative mx-auto px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
                            <div className="mx-auto max-w-4xl text-center">
                                <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-400">
                                    Subscription & membership platform
                                </p>
                                <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl lg:leading-[1.08]">
                                    Unlock your{' '}
                                    <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                                        membership
                                    </span>
                                </h1>
                                <p className="mt-6 text-lg leading-relaxed text-slate-400 sm:text-xl max-w-2xl mx-auto">
                                    {siteSettings.site_description ||
                                        'Tiers that fit. A single dashboard for your subscription, billing, and member perks. Join, upgrade, or cancel—on your terms.'}
                                </p>
                                <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-slate-400">
                                    {highlights.map((h, i) => (
                                        <li key={i} className="flex items-center gap-2">
                                            <Check className="h-4 w-4 text-amber-500 shrink-0" />
                                            {h}
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                                    <Button
                                        asChild
                                        size="lg"
                                        className="group h-12 rounded-xl bg-amber-500 px-8 font-semibold text-slate-900 shadow-lg shadow-amber-500/25 transition hover:bg-amber-400 hover:shadow-amber-500/30"
                                    >
                                        <Link href={route('register')} className="inline-flex items-center gap-2">
                                            Join now
                                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                        </Link>
                                    </Button>
                                    <Button
                                        asChild
                                        size="lg"
                                        variant="outline"
                                        className="h-12 rounded-xl border-white/15 bg-white/[0.02] px-8 font-semibold text-white hover:bg-white/[0.06] hover:border-white/20"
                                    >
                                        <Link href="/about">Learn more</Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Features */}
                    <section className="border-b border-white/[0.06] py-20 sm:py-24 lg:py-32">
                        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="mx-auto max-w-2xl text-center mb-16">
                                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                    Built for members
                                </h2>
                                <p className="mt-4 text-lg text-slate-400">
                                    One place to subscribe, manage billing, and enjoy your perks.
                                </p>
                            </div>
                            <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
                                {features.map((f, i) => (
                                    <div
                                        key={i}
                                        className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition hover:border-amber-500/20 hover:bg-amber-500/5"
                                    >
                                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                                            <f.icon className="h-6 w-6" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-white">{f.title}</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-slate-400">
                                            {f.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* CTA */}
                    <section className="py-20 sm:py-24 lg:py-32">
                        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-slate-900 to-amber-600/5 p-8 sm:p-12 lg:p-16 text-center">
                                <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-amber-500/15 blur-[80px]" />
                                <div className="relative">
                                    <h2 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
                                        Ready to get access?
                                    </h2>
                                    <p className="mx-auto mt-4 max-w-xl text-slate-400">
                                        Pick a tier, join in seconds, and manage everything from your member dashboard.
                                    </p>
                                    <div className="mt-8">
                                        <Button
                                            asChild
                                            size="lg"
                                            className="h-12 rounded-xl bg-amber-500 px-8 font-semibold text-slate-900 shadow-lg shadow-amber-500/25 transition hover:bg-amber-400"
                                        >
                                            <Link href={route('register')}>Join now</Link>
                                        </Button>
                                    </div>
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
