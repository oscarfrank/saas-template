import { Head } from '@inertiajs/react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';

const faqs = [
    {
        question: "What types of loans do you offer?",
        answer: "We offer a variety of loan products including personal loans, business loans, and education loans. Each loan type has specific terms and conditions tailored to meet different financial needs."
    },
    {
        question: "How long does the approval process take?",
        answer: "Our approval process typically takes 24-48 hours. We strive to provide quick decisions while ensuring thorough evaluation of your application."
    },
    {
        question: "What are the eligibility criteria for a loan?",
        answer: "Eligibility criteria vary by loan type but generally include factors like credit score, income, employment history, and debt-to-income ratio. We'll guide you through the specific requirements during the application process."
    },
    {
        question: "What documents do I need to apply?",
        answer: "Commonly required documents include proof of identity, proof of income, bank statements, and tax returns. The specific documents needed may vary based on the loan type and amount."
    },
    {
        question: "What are your interest rates?",
        answer: "Our interest rates are competitive and vary based on factors like loan type, amount, term, and your credit profile. We'll provide you with specific rates during the application process."
    },
    {
        question: "Can I prepay my loan?",
        answer: "Yes, we allow prepayment of loans. Some loan products may have specific terms regarding prepayment, which we'll clearly communicate during the application process."
    },
    {
        question: "How do I make payments?",
        answer: "We offer multiple payment options including automatic bank transfers, online payments, and in-person payments at our branches. You can choose the method that's most convenient for you."
    },
    {
        question: "What happens if I miss a payment?",
        answer: "We understand that financial situations can change. If you anticipate difficulty making a payment, please contact us immediately. We'll work with you to find a solution that works for both parties."
    }
];

export default function FAQ() {
    const { siteSettings } = usePage<SharedData>().props;

    return (
        <>
            <Head title={`Frequently Asked Questions - ${siteSettings.site_name}`} />
            <div className="min-h-screen bg-white dark:bg-gray-900">
                <Header />
                <main>
                    <section className="py-20">
                        <div className="container mx-auto px-6">
                            <div className="max-w-3xl mx-auto">
                                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                                    Frequently Asked Questions
                                </h1>
                                <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 text-center">
                                    Find answers to common questions about our loan services
                                </p>
                                <Accordion type="single" collapsible className="w-full">
                                    {faqs.map((faq, index) => (
                                        <AccordionItem key={index} value={`item-${index}`}>
                                            <AccordionTrigger className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {faq.question}
                                            </AccordionTrigger>
                                            <AccordionContent className="text-gray-600 dark:text-gray-300">
                                                {faq.answer}
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </div>
                        </div>
                    </section>
                </main>
                <Footer />
            </div>
        </>
    );
} 