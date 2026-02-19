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
                        <div className="mx-auto max-w-xl">
                            <div className="mb-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400">
                                <MessageSquare className="h-6 w-6" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                Get in touch
                            </h1>
                            <p className="mt-4 text-neutral-400">
                                Have a question or want to see a demo? We’re here to help.
                            </p>
                            <div className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8">
                                <div className="mb-6 flex items-center gap-3 text-neutral-400">
                                    <Mail className="h-5 w-5 text-amber-400" />
                                    <a href={`mailto:${siteSettings.company_email}`} className="hover:text-amber-400 transition-colors">
                                        {siteSettings.company_email}
                                    </a>
                                </div>
                                <p className="text-sm text-neutral-500">{siteSettings.company_phone}</p>
                            </div>
                            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                                <div>
                                    <Label htmlFor="name" className="text-neutral-300">Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="mt-2 rounded-xl border-white/10 bg-white/[0.04] text-white placeholder:text-neutral-500 focus-visible:ring-amber-500/50"
                                        placeholder="Your name"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="email" className="text-neutral-300">Email</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="mt-2 rounded-xl border-white/10 bg-white/[0.04] text-white placeholder:text-neutral-500 focus-visible:ring-amber-500/50"
                                        placeholder="you@studio.com"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="message" className="text-neutral-300">Message</Label>
                                    <Textarea
                                        id="message"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        className="mt-2 min-h-[140px] rounded-xl border-white/10 bg-white/[0.04] text-white placeholder:text-neutral-500 focus-visible:ring-amber-500/50"
                                        placeholder="How can we help?"
                                        required
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full rounded-xl bg-amber-500 font-semibold text-neutral-950 shadow-lg shadow-amber-500/25 hover:bg-amber-400 sm:w-auto sm:px-8"
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
