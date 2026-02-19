import { Head, usePage } from '@inertiajs/react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { BookOpen, Target, Sparkles } from 'lucide-react';
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
                            <div className="mb-10 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
                                <BookOpen className="h-6 w-6" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                                About {siteSettings.site_name}
                            </h1>
                            <p className="mt-6 text-lg leading-relaxed text-slate-600">
                                {siteSettings.site_description}
                            </p>
                            <p className="mt-4 text-lg leading-relaxed text-slate-600">
                                We’re an online learning platform. We offer structured courses, track progress, and issue certificates so you can learn at your own pace and show what you’ve achieved. Our goal is to make quality learning accessible and clear.
                            </p>
                            <div className="mt-12 grid gap-6 sm:grid-cols-2">
                                <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-6">
                                    <Target className="h-8 w-8 text-teal-600" />
                                    <h2 className="mt-3 text-lg font-semibold text-slate-900">Our mission</h2>
                                    <p className="mt-2 text-sm text-slate-600">
                                        Help people learn what they need, when they need it—with clear progress and recognition.
                                    </p>
                                </div>
                                <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-6">
                                    <Sparkles className="h-8 w-8 text-teal-600" />
                                    <h2 className="mt-3 text-lg font-semibold text-slate-900">What we offer</h2>
                                    <p className="mt-2 text-sm text-slate-600">
                                        Courses, lessons, progress tracking, certificates, and a supportive learning community.
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
