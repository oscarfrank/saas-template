import { Head } from '@inertiajs/react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Mail, MessageSquare } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';

export default function Contact() {
    const { siteSettings } = usePage<SharedData>().props;
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Form submitted:', formData);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <>
            <Head title={`Contact – ${siteSettings.site_name}`} />
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
                        <div className="mx-auto max-w-xl">
                            <div className="mb-10 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
                                <MessageSquare className="h-6 w-6" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                                Get in touch
                            </h1>
                            <p className="mt-4 text-slate-600">
                                Questions about courses, certificates, or your account? We’re here to help.
                            </p>
                            <div className="mt-8 rounded-xl border border-teal-100 bg-teal-50/50 p-6 sm:p-8">
                                <div className="mb-6 flex items-center gap-3 text-slate-600">
                                    <Mail className="h-5 w-5 text-teal-600" />
                                    <a href={`mailto:${siteSettings.company_email}`} className="hover:text-teal-600 transition-colors">
                                        {siteSettings.company_email}
                                    </a>
                                </div>
                                <p className="text-sm text-slate-500">{siteSettings.company_phone}</p>
                            </div>
                            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                                <div>
                                    <Label htmlFor="name" className="text-slate-700">Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="mt-2 rounded-lg border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-teal-500"
                                        placeholder="Your name"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="email" className="text-slate-700">Email</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="mt-2 rounded-lg border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-teal-500"
                                        placeholder="you@example.com"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="message" className="text-slate-700">Message</Label>
                                    <Textarea
                                        id="message"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        className="mt-2 min-h-[140px] rounded-lg border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-teal-500"
                                        placeholder="How can we help?"
                                        required
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full rounded-xl bg-teal-500 font-semibold text-white hover:bg-teal-600 sm:w-auto sm:px-8"
                                >
                                    Send message
                                </Button>
                            </form>
                        </div>
                    </section>
                </main>
                <Footer />
            </div>
        </>
    );
}
