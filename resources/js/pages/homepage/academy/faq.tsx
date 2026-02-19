import { Head } from '@inertiajs/react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { usePage } from '@inertiajs/react';
import { HelpCircle } from 'lucide-react';
import { type SharedData } from '@/types';

const faqs = [
    {
        question: 'How do the courses work?',
        answer: 'Each course is made up of lessons—video, text, or both. You work through them at your own pace. Quizzes and assignments help reinforce learning. When you finish a course or module, you can earn a certificate.',
    },
    {
        question: 'Can I learn on my phone or tablet?',
        answer: 'Yes. The platform works on desktop, tablet, and mobile. Your progress syncs across devices so you can pick up wherever you left off.',
    },
    {
        question: 'How do certificates work?',
        answer: 'When you complete a course or program, you can receive a certificate. It’s a shareable record of what you’ve learned and achieved.',
    },
    {
        question: 'What if I need to pause or catch up?',
        answer: 'There are no fixed deadlines for most courses. You can pause and resume whenever you like. Your progress is saved so you can continue later.',
    },
    {
        question: 'How do I get help or ask questions?',
        answer: 'Use the contact page or email support. Many courses also have discussion areas where you can ask instructors and other learners.',
    },
];

export default function FAQ() {
    const { siteSettings } = usePage<SharedData>().props;

    return (
        <>
            <Head title={`FAQ – ${siteSettings.site_name}`} />
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
                        <div className="mx-auto max-w-2xl">
                            <div className="mb-10 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
                                <HelpCircle className="h-6 w-6" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                                Frequently asked questions
                            </h1>
                            <p className="mt-4 text-slate-600">
                                Courses, progress, certificates, and support.
                            </p>
                            <Accordion type="single" collapsible className="mt-10 w-full">
                                {faqs.map((faq, i) => (
                                    <AccordionItem
                                        key={i}
                                        value={`item-${i}`}
                                        className="border-slate-200 py-4"
                                    >
                                        <AccordionTrigger className="text-left text-base font-medium text-slate-900 hover:text-teal-600">
                                            {faq.question}
                                        </AccordionTrigger>
                                        <AccordionContent className="text-slate-600">
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
