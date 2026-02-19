import { Head } from '@inertiajs/react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { usePage } from '@inertiajs/react';
import { HelpCircle } from 'lucide-react';
import { type SharedData } from '@/types';

const faqs = [
    {
        question: 'How do membership tiers work?',
        answer: 'You choose a tier when you join. Each tier has its own price and perks. You can upgrade or downgrade anytime from your member dashboard, and we’ll prorate as needed.',
    },
    {
        question: 'Can I cancel or change my plan?',
        answer: 'Yes. You can cancel or switch tiers at any time from your dashboard. If you cancel, you keep access until the end of your current billing period. No lock-in.',
    },
    {
        question: 'How is billing handled?',
        answer: 'We use secure payment processing. You’ll get clear invoices and can update your payment method in the member area. Renewals happen automatically unless you cancel.',
    },
    {
        question: 'What’s in the member dashboard?',
        answer: 'Your dashboard shows your current tier, billing history, next renewal date, and any member-only content or perks. You can manage your subscription and profile in one place.',
    },
    {
        question: 'What if I have a billing issue?',
        answer: 'Contact us through the contact page or email. We’ll help you resolve payment or subscription issues quickly.',
    },
];

export default function FAQ() {
    const { siteSettings } = usePage<SharedData>().props;

    return (
        <>
            <Head title={`FAQ – ${siteSettings.site_name}`} />
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
                        <div className="mx-auto max-w-2xl">
                            <div className="mb-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400">
                                <HelpCircle className="h-6 w-6" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                Frequently asked questions
                            </h1>
                            <p className="mt-4 text-slate-400">
                                Membership, tiers, billing, and your account.
                            </p>
                            <Accordion type="single" collapsible className="mt-10 w-full">
                                {faqs.map((faq, i) => (
                                    <AccordionItem
                                        key={i}
                                        value={`item-${i}`}
                                        className="border-white/[0.06] py-4"
                                    >
                                        <AccordionTrigger className="text-left text-base font-medium text-white hover:text-amber-400">
                                            {faq.question}
                                        </AccordionTrigger>
                                        <AccordionContent className="text-slate-400">
                                            {faq.answer}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </div>
                    </section>
                </main>
                <Footer />
            </div>
        </>
    );
}
