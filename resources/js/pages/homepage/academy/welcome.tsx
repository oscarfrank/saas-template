import { Head, Link, usePage } from '@inertiajs/react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Button } from '@/components/ui/button';
import {
    BookOpen,
    Award,
    Users,
    PlayCircle,
    Calendar,
    BarChart3,
    ArrowRight,
    Check,
} from 'lucide-react';
import { type SharedData } from '@/types';

const features = [
    {
        icon: BookOpen,
        title: 'Courses & lessons',
        description: 'Structured courses with video, text, and quizzes. Learn step by step at your own pace.',
    },
    {
        icon: Award,
        title: 'Progress & certificates',
        description: 'Track your progress and earn certificates when you complete courses and modules.',
    },
    {
        icon: Users,
        title: 'Instructors & community',
        description: 'Learn from experienced instructors and connect with fellow learners in discussions.',
    },
    {
        icon: PlayCircle,
        title: 'Learn at your pace',
        description: 'Access courses anytime. Watch, rewatch, and pick up where you left off on any device.',
    },
    {
        icon: Calendar,
        title: 'Flexible learning',
        description: 'No fixed schedules. Fit learning around your work and life—when it suits you.',
    },
    {
        icon: BarChart3,
        title: 'Track your growth',
        description: 'See your progress, completed lessons, and achievements in one clear dashboard.',
    },
];

const highlights = [
    'Structured courses & lessons',
    'Certificates on completion',
    'Learn anytime, any device',
];

export default function Welcome() {
    const { siteSettings } = usePage<SharedData>().props;

    return (
        <>
            <Head title={`${siteSettings.site_name} – Online courses & learning`} />
            <link
                href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap"
                rel="stylesheet"
            />
            <div
                className="min-h-screen bg-white text-slate-900 antialiased"
                style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
            >
                <Header />
                <main className="pt-16">
                    {/* Hero */}
                    <section className="border-b border-teal-100 bg-gradient-to-b from-teal-50/80 to-white">
                        <div className="container mx-auto px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
                            <div className="mx-auto max-w-3xl text-center">
                                <p className="mb-4 text-sm font-medium uppercase tracking-wider text-teal-600">
                                    EdTech & online learning
                                </p>
                                <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl lg:leading-[1.1]">
                                    Learn what you need.{' '}
                                    <span className="text-teal-600">When you need it.</span>
                                </h1>
                                <p className="mt-6 text-lg leading-relaxed text-slate-600 sm:text-xl">
                                    {siteSettings.site_description ||
                                        'Online courses, clear progress, and certificates—all in one place. Built for learners who want to grow at their own pace.'}
                                </p>
                                <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-slate-600">
                                    {highlights.map((h, i) => (
                                        <li key={i} className="flex items-center gap-2">
                                            <Check className="h-4 w-4 text-teal-500 shrink-0" />
                                            {h}
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                                    <Button
                                        asChild
                                        size="lg"
                                        className="h-12 rounded-xl bg-teal-500 px-8 font-semibold text-white hover:bg-teal-600"
                                    >
                                        <Link href={route('register')} className="inline-flex items-center gap-2">
                                            Start learning
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <Button
                                        asChild
                                        size="lg"
                                        variant="outline"
                                        className="h-12 rounded-xl border-teal-200 text-teal-700 hover:bg-teal-50"
                                    >
                                        <Link href="/about">Explore courses</Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Features */}
                    <section className="border-b border-slate-200 py-16 sm:py-20 lg:py-24">
                        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="mx-auto max-w-2xl text-center mb-12">
                                <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                                    Everything you need to learn
                                </h2>
                                <p className="mt-2 text-slate-600">
                                    Courses, progress, certificates, and support—in one academy.
                                </p>
                            </div>
                            <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
                                {features.map((f, i) => (
                                    <div
                                        key={i}
                                        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-teal-200 hover:shadow-md"
                                    >
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
                                            <f.icon className="h-6 w-6" />
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
                            <div className="rounded-2xl border border-teal-200 bg-teal-500 px-6 py-12 text-center sm:px-12 sm:py-16">
                                <h2 className="text-2xl font-bold text-white sm:text-3xl">
                                    Ready to start learning?
                                </h2>
                                <p className="mx-auto mt-3 max-w-xl text-teal-100">
                                    Join the academy. Pick a course, track your progress, and earn certificates.
                                </p>
                                <div className="mt-8">
                                    <Button
                                        asChild
                                        size="lg"
                                        className="h-12 rounded-xl bg-white px-8 font-semibold text-teal-600 hover:bg-teal-50"
                                    >
                                        <Link href={route('register')}>Get started free</Link>
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
