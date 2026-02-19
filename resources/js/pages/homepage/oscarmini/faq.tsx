import { Head } from '@inertiajs/react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { usePage } from '@inertiajs/react';
import { HelpCircle } from 'lucide-react';
import { type SharedData } from '@/types';

const faqs = [
    {
        question: 'What can I do with this platform?',
        answer: 'Manage staff and teams, run a YouTube studio (scripts, shoots, tasks), handle payroll, organize assets, offer staff loans, and plan projects—all in one place.',
    },
    {
        question: 'How does staff management work?',
        answer: 'Add your team, assign roles and permissions, and keep everyone aligned. You can track who does what and manage access per area (studio, payroll, assets, loans).',
    },
    {
        question: 'Can I really run my YouTube studio here?',
        answer: 'Yes. Plan scripts, schedule shoots, assign tasks (editing, thumbnails, uploads), and see the full pipeline. It’s built for teams that create content regularly.',
    },
    {
        question: 'What about payroll and staff loans?',
        answer: 'Payroll lets you track hours, rates, and payments so you can pay on time. Staff loans let you offer loans to your team with clear terms and tracking, all in the same platform.',
    },
    {
        question: 'How do assets and projects work?',
        answer: 'Assets help you organize equipment, props, and digital files. Projects let you plan initiatives, set milestones, and track progress so nothing falls through the cracks.',
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
                            <div className="mb-10 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                                <HelpCircle className="h-6 w-6" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                                Frequently asked questions
                            </h1>
                            <p className="mt-4 text-slate-600">
                                Staff, studio, payroll, assets, loans, and projects.
                            </p>
                            <Accordion type="single" collapsible className="mt-10 w-full">
                                {faqs.map((faq, i) => (
                                    <AccordionItem
                                        key={i}
                                        value={`item-${i}`}
                                        className="border-slate-200 py-4"
                                    >
                                        <AccordionTrigger className="text-left text-base font-medium text-slate-900 hover:text-slate-700">
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
