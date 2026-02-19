import { Head, Link, usePage } from '@inertiajs/react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Button } from '@/components/ui/button';
import {
    Users,
    FolderKanban,
    FileText,
    Plug,
    Shield,
    BarChart3,
    ArrowRight,
    Check,
} from 'lucide-react';
import { type SharedData } from '@/types';

const features = [
    {
        icon: Users,
        title: 'Teams & people',
        description: 'Keep everyone aligned. Roles, permissions, and visibility that scale with remote and in-office teams.',
    },
    {
        icon: FolderKanban,
        title: 'Projects & tasks',
        description: 'Plan work, assign ownership, and track progress. One place for initiatives and day-to-day ops.',
    },
    {
        icon: FileText,
        title: 'Docs & knowledge',
        description: 'Centralize how you work. Runbooks, policies, and knowledge so the team stays in sync.',
    },
    {
        icon: Plug,
        title: 'Integrations',
        description: 'Connect the tools you already use. APIs and integrations that fit your stack.',
    },
    {
        icon: Shield,
        title: 'Security & access',
        description: 'Control who sees what. SSO, roles, and audit trails built for growing companies.',
    },
    {
        icon: BarChart3,
        title: 'Reports & analytics',
        description: 'See how the business runs. Dashboards and reports without the spreadsheet chaos.',
    },
];

const highlights = [
    'Built for startups & SMEs',
    'Remote-friendly from day one',
    'One platform for operations',
];

export default function Welcome() {
    const { siteSettings } = usePage<SharedData>().props;

    return (
        <>
            <Head title={`${siteSettings.site_name} – Operations & internal platform`} />
            <link
                href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
                rel="stylesheet"
            />
            <div
                className="min-h-screen bg-white text-slate-900 antialiased"
                style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
            >
                <Header />
                <main className="pt-16">
                    {/* Hero */}
                    <section className="border-b border-slate-200 bg-slate-50/60">
                        <div className="container mx-auto px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
                            <div className="mx-auto max-w-3xl">
                                <p className="mb-4 text-sm font-medium uppercase tracking-wider text-indigo-600">
                                    Operations & internal platform
                                </p>
                                <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl lg:leading-[1.1]">
                                    Run your company from{' '}
                                    <span className="text-indigo-600">one place</span>
                                </h1>
                                <p className="mt-6 text-lg leading-relaxed text-slate-600 sm:text-xl">
                                    {siteSettings.site_description ||
                                        'Teams, projects, docs, and ops in a single platform. Built for startups, remote teams, tech companies, and SMEs that need clarity without the sprawl.'}
                                </p>
                                <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-600">
                                    {highlights.map((h, i) => (
                                        <li key={i} className="flex items-center gap-2">
                                            <Check className="h-4 w-4 text-indigo-600 shrink-0" />
                                            {h}
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                                    <Button
                                        asChild
                                        size="lg"
                                        className="h-12 rounded-lg bg-indigo-600 px-8 font-semibold text-white hover:bg-indigo-700"
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

                    {/* Features */}
                    <section className="border-b border-slate-200 py-16 sm:py-20 lg:py-24">
                        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="mb-12">
                                <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                                    Everything ops in one nexus
                                </h2>
                                <p className="mt-2 text-slate-600">
                                    Teams, projects, knowledge, and controls—built for how you work.
                                </p>
                            </div>
                            <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
                                {features.map((f, i) => (
                                    <div
                                        key={i}
                                        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
                                    >
                                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
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

                    {/* CTA */}
                    <section className="py-16 sm:py-20 lg:py-24">
                        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="rounded-2xl border border-slate-200 bg-indigo-600 px-6 py-12 text-center sm:px-12 sm:py-16">
                                <h2 className="text-2xl font-bold text-white sm:text-3xl">
                                    Ready to centralize your operations?
                                </h2>
                                <p className="mx-auto mt-3 max-w-xl text-indigo-100">
                                    One platform for your team, projects, and internal tools.
                                </p>
                                <div className="mt-8">
                                    <Button
                                        asChild
                                        size="lg"
                                        className="h-12 rounded-lg bg-white px-8 font-semibold text-indigo-600 hover:bg-indigo-50"
                                    >
                                        <Link href={route('register')}>Get started</Link>
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
