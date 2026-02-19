import { Head, usePage } from '@inertiajs/react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { HowItWorks } from './components/HowItWorks';
import { Testimonials } from './components/Testimonials';
import { CallToAction } from './components/CallToAction';
import { Footer } from './components/Footer';
import { type SharedData } from '@/types';

export default function Welcome() {
    const { siteSettings } = usePage<SharedData>().props;

    return (
        <>
            <Head title={`Welcome to ${siteSettings.site_name} - Premium Financial Solutions`} />
            <div className="min-h-screen bg-white dark:bg-gray-900">
                <Header />
                <main>
                    <Hero />
                    <Features />
                    <HowItWorks />
                    <Testimonials />
                    <CallToAction />
                </main>
                <Footer />
            </div>
        </>
    );
}
