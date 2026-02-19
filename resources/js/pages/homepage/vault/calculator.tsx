import { Head, Link } from '@inertiajs/react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Button } from '@/components/ui/button';
import { usePage } from '@inertiajs/react';
import { Calculator as CalculatorIcon } from 'lucide-react';
import { type SharedData } from '@/types';

export default function Calculator() {
    const { siteSettings } = usePage<SharedData>().props;

    return (
        <>
            <Head title={`Tools – ${siteSettings.site_name}`} />
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
                        <div className="mx-auto max-w-2xl text-center">
                            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400">
                                <CalculatorIcon className="h-7 w-7" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                Tools & calculators
                            </h1>
                            <p className="mt-4 text-slate-400">
                                Subscription and pricing calculators, and more. Coming soon.
                            </p>
                            <Button
                                asChild
                                variant="outline"
                                className="mt-8 rounded-xl border-white/15 bg-white/[0.02] text-white hover:bg-white/[0.06]"
                            >
                                <Link href="/">Back to home</Link>
                            </Button>
                        </div>
                    </section>
                </main>
                <Footer />
            </div>
        </>
    );
}
