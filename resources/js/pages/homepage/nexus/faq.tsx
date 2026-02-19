import { Head } from '@inertiajs/react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { usePage } from '@inertiajs/react';
import { HelpCircle } from 'lucide-react';
import { type SharedData } from '@/types';

const faqs = [
    {
        question: 'Who is this platform for?',
        answer: 'Startups, remote teams, tech companies, and SMEs that want one place for operations: teams, projects, docs, integrations, and reporting. It’s built to scale with you without tool sprawl.',
    },
    {
        question: 'How do teams and permissions work?',
        answer: 'You manage people, roles, and permissions in one place. Control who sees what, with support for remote and hybrid teams. Access can be scoped by project, area, or role.',
    },
    {
        question: 'Can we use this for remote teams?',
        answer: 'Yes. The platform is designed to work for distributed teams—central docs, project visibility, and clear ownership so everyone stays aligned regardless of location.',
    },
    {
        question: 'What about integrations?',
        answer: 'We support APIs and integrations with common tools in your stack. You can connect existing systems and keep workflows in one nexus.',
    },
    {
        question: 'Is there reporting and analytics?',
        answer: 'Yes. Dashboards and reports give you visibility into how the business runs—without maintaining spreadsheets across teams.',
    },
];

export default function FAQ() {
    const { siteSettings } = usePage<SharedData>().props;

    return (
        <>
            <Head title={`FAQ – ${siteSettings.site_name}`} />
            <link
                href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
                rel="stylesheet"
            />
            <div
                className="min-h-screen bg-white text-slate-900 antialiased"
                style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
            >
                <Header />
                <main className="pt-24 pb-20">
                    <section className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-2xl">
                            <div className="mb-10 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                                <HelpCircle className="h-6 w-6" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                                Frequently asked questions
                            </h1>
                            <p className="mt-4 text-slate-600">
                                Operations, teams, and the platform.
                            </p>
                            <Accordion type="single" collapsible className="mt-10 w-full">
                                {faqs.map((faq, i) => (
                                    <AccordionItem
                                        key={i}
                                        value={`item-${i}`}
                                        className="border-slate-200 py-4"
                                    >
                                        <AccordionTrigger className="text-left text-base font-medium text-slate-900 hover:text-indigo-600">
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
