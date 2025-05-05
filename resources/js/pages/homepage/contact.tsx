import { Head } from '@inertiajs/react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Clock } from 'lucide-react';

export default function Contact() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle form submission here
        console.log('Form submitted:', formData);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <>
            <Head title="Contact Us - LendFast" />
            <div className="min-h-screen bg-white dark:bg-gray-900">
                <Header />
                <main>
                    <section className="py-20">
                        <div className="container mx-auto px-6">
                            <div className="max-w-6xl mx-auto">
                                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                                    Contact Us
                                </h1>
                                <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 text-center">
                                    Get in touch with our team for any questions or support
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div className="space-y-8">
                                        <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl">
                                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                                                Contact Information
                                            </h2>
                                            <div className="space-y-6">
                                                <div className="flex items-start space-x-4">
                                                    <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-1" />
                                                    <div>
                                                        <h3 className="font-medium text-gray-900 dark:text-white">Email</h3>
                                                        <p className="text-gray-600 dark:text-gray-300">support@lendfast.com</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start space-x-4">
                                                    <Phone className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-1" />
                                                    <div>
                                                        <h3 className="font-medium text-gray-900 dark:text-white">Phone</h3>
                                                        <p className="text-gray-600 dark:text-gray-300">+1 (555) 123-4567</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start space-x-4">
                                                    <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-1" />
                                                    <div>
                                                        <h3 className="font-medium text-gray-900 dark:text-white">Address</h3>
                                                        <p className="text-gray-600 dark:text-gray-300">
                                                            123 Financial Street<br />
                                                            New York, NY 10001
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start space-x-4">
                                                    <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-1" />
                                                    <div>
                                                        <h3 className="font-medium text-gray-900 dark:text-white">Hours</h3>
                                                        <p className="text-gray-600 dark:text-gray-300">
                                                            Monday - Friday: 9:00 AM - 6:00 PM<br />
                                                            Saturday: 10:00 AM - 4:00 PM<br />
                                                            Sunday: Closed
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl">
                                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                                            Send us a Message
                                        </h2>
                                        <form onSubmit={handleSubmit} className="space-y-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Name</Label>
                                                <Input
                                                    id="name"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email">Email</Label>
                                                <Input
                                                    id="email"
                                                    name="email"
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="phone">Phone</Label>
                                                <Input
                                                    id="phone"
                                                    name="phone"
                                                    type="tel"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="subject">Subject</Label>
                                                <Input
                                                    id="subject"
                                                    name="subject"
                                                    value={formData.subject}
                                                    onChange={handleChange}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="message">Message</Label>
                                                <Textarea
                                                    id="message"
                                                    name="message"
                                                    value={formData.message}
                                                    onChange={handleChange}
                                                    required
                                                    className="min-h-[150px]"
                                                />
                                            </div>
                                            <Button type="submit" className="w-full">
                                                Send Message
                                            </Button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>
                <Footer />
            </div>
        </>
    );
} 