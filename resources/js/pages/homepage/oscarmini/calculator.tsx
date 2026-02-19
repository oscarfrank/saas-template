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
                        <div className="mx-auto max-w-2xl text-center">
                            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                                <CalculatorIcon className="h-7 w-7" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                                Tools & calculators
                            </h1>
                            <p className="mt-4 text-slate-600">
                                Loan calculators, payroll estimators, and more. Coming soon.
                            </p>
                            <Button
                                asChild
                                variant="outline"
                                className="mt-8 rounded-lg border-slate-300 text-slate-700 hover:bg-slate-100"
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
