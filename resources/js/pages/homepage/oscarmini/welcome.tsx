import { Head, Link, usePage } from '@inertiajs/react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Button } from '@/components/ui/button';
import {
    Users,
    Video,
    Wallet,
    Package,
    Banknote,
    LayoutGrid,
    ArrowRight,
} from 'lucide-react';
import { type SharedData } from '@/types';

const features = [
    {
        icon: Users,
        title: 'Staff & teams',
        description: 'Manage your people, roles, and permissions. Keep everyone aligned and accountable.',
    },
    {
        icon: Video,
        title: 'YouTube studio',
        description: 'Plan scripts, schedule shoots, assign tasks. Run your content pipeline in one place.',
    },
    {
        icon: Wallet,
        title: 'Payroll',
        description: 'Track hours, rates, and payments. Pay your team on time, every time.',
    },
    {
        icon: Package,
        title: 'Assets',
        description: 'Organize equipment, props, and digital assets. Know what you have and where it is.',
    },
    {
        icon: Banknote,
        title: 'Staff loans',
        description: 'Offer loans to your team. Flexible terms, clear tracking, built for your organization.',
    },
    {
        icon: LayoutGrid,
        title: 'Projects & planning',
        description: 'Plan initiatives, track progress, and ship. From idea to launch in one workspace.',
    },
];

export default function Welcome() {
    const { siteSettings } = usePage<SharedData>().props;

    return (
        <>
            <Head title={`${siteSettings.site_name} – Your organization. One platform.`} />
            <link
                href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap"
                rel="stylesheet"
            />
            <div
                className="min-h-screen bg-white text-slate-900 antialiased"
                style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
            >
                <Header />
                <main className="pt-16">
                    {/* Hero - left-aligned, professional */}
                    <section className="border-b border-slate-200 bg-slate-50/80">
                        <div className="container mx-auto px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
                            <div className="mx-auto max-w-3xl">
                                <p className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-500">
                                    Organization platform
                                </p>
                                <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl lg:leading-[1.1]">
                                    One place to run {siteSettings.site_name}
                                </h1>
                                <p className="mt-6 text-lg leading-relaxed text-slate-600 sm:text-xl">
                                    {siteSettings.site_description ||
                                        'Staff, YouTube studio, payroll, assets, staff loans, and projects—in a single platform built for how your organization works.'}
                                </p>
                                <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                                    <Button
                                        asChild
                                        size="lg"
                                        className="h-12 rounded-lg bg-slate-800 px-8 font-semibold text-white hover:bg-slate-700"
                                    >
                                        <Link href={route('register')} className="inline-flex items-center gap-2">
                                            Get started
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <Button
                                        asChild
                                        size="lg"
                                        variant="outline"
                                        className="h-12 rounded-lg border-slate-300 text-slate-700 hover:bg-slate-100"
                                    >
                                        <Link href="/about">Learn more</Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Features - clean grid, no gradients */}
                    <section className="border-b border-slate-200 py-16 sm:py-20 lg:py-24">
                        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="mb-12">
                                <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                                    Everything your organization needs
                                </h2>
                                <p className="mt-2 text-slate-600">
                                    One platform for people, content, money, and plans.
                                </p>
                            </div>
                            <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
                                {features.map((f, i) => (
                                    <div
                                        key={i}
                                        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                                    >
                                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                                            <f.icon className="h-5 w-5" />
                                        </div>
                                        <h3 className="mt-4 text-lg font-semibold text-slate-900">{f.title}</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                            {f.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* CTA - simple strip */}
                    <section className="py-16 sm:py-20 lg:py-24">
                        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="rounded-2xl border border-slate-200 bg-slate-800 px-6 py-12 text-center sm:px-12 sm:py-16">
                                <h2 className="text-2xl font-bold text-white sm:text-3xl">
                                    Ready to run your organization in one place?
                                </h2>
                                <p className="mx-auto mt-3 max-w-xl text-slate-300">
                                    Staff, studio, payroll, assets, loans, and projects—together.
                                </p>
                                <div className="mt-8">
                                    <Button
                                        asChild
                                        size="lg"
                                        className="h-12 rounded-lg bg-white px-8 font-semibold text-slate-800 hover:bg-slate-100"
                                    >
                                        <Link href={route('register')}>Get started for free</Link>
                                    </Button>
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
