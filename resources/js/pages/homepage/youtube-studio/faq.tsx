import { Head } from '@inertiajs/react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { usePage } from '@inertiajs/react';
import { HelpCircle } from 'lucide-react';
import { type SharedData } from '@/types';

const faqs = [
    {
        question: 'What is studio staff management?',
        answer: 'A simple way to manage your YouTube studio team: scripts, shoots, tasks, and payroll in one place. Assign roles, track progress, and keep everyone aligned.',
    },
    {
        question: 'Can I invite my whole crew?',
        answer: 'Yes. Add team members, assign roles (e.g. editor, host, camera), and manage permissions. Everyone sees what they need and nothing they don’t.',
    },
    {
        question: 'How does scheduling work?',
        answer: 'Create shoots, set dates and locations, and see who’s assigned. The calendar shows everything at a glance so you avoid double-booking and missed deadlines.',
    },
    {
        question: 'How do scripts and tasks fit in?',
        answer: 'Write and version scripts in one place, then break production into tasks. Assign owners and due dates so editing, thumbnails, and uploads stay on track.',
    },
];

export default function FAQ() {
    const { siteSettings } = usePage<SharedData>().props;

    return (
        <>
            <Head title={`FAQ – ${siteSettings.site_name}`} />
            <link
                href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
                rel="stylesheet"
            />
            <div
                className="min-h-screen bg-neutral-950 text-white antialiased"
                style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
            >
                <Header />
                <main className="pt-24 pb-20">
                    <section className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-2xl">
                            <div className="mb-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400">
                                <HelpCircle className="h-6 w-6" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                Frequently asked questions
                            </h1>
                            <p className="mt-4 text-neutral-400">
                                Quick answers about scripts, shoots, tasks, and payroll.
                            </p>
                            <Accordion type="single" collapsible className="mt-10 w-full">
                                {faqs.map((faq, i) => (
                                    <AccordionItem
                                        key={i}
                                        value={`item-${i}`}
                                        className="border-white/[0.06] py-4"
                                    >
                                        <AccordionTrigger className="text-left text-base font-medium text-white hover:text-amber-400 [&[data-state=open]]:text-amber-400">
                                            {faq.question}
                                        </AccordionTrigger>
                                        <AccordionContent className="text-neutral-400">
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
