import { Head } from '@inertiajs/react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Building2, Users, Target, Award } from 'lucide-react';

const teamMembers = [
    {
        name: "John Smith",
        role: "CEO & Founder",
        image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80",
        bio: "With over 15 years of experience in the financial industry, John founded LendFast with a vision to make lending more accessible and transparent."
    },
    {
        name: "Sarah Johnson",
        role: "Chief Operations Officer",
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80",
        bio: "Sarah brings extensive experience in financial operations and customer service, ensuring smooth processes and excellent client experiences."
    },
    {
        name: "Michael Chen",
        role: "Chief Technology Officer",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80",
        bio: "Michael leads our technology initiatives, ensuring our platform remains secure, efficient, and user-friendly."
    }
];

const stats = [
    { number: "10,000+", label: "Happy Customers", icon: Users },
    { number: "$50M+", label: "Loans Disbursed", icon: Building2 },
    { number: "99%", label: "Customer Satisfaction", icon: Award },
    { number: "24h", label: "Average Approval Time", icon: Target }
];

export default function About() {
    return (
        <>
            <Head title="About Us - LendFast" />
            <div className="min-h-screen bg-white dark:bg-gray-900">
                <Header />
                <main>
                    <section className="py-20">
                        <div className="container mx-auto px-6">
                            <div className="max-w-4xl mx-auto text-center mb-20">
                                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                                    About LendFast
                                </h1>
                                <p className="text-xl text-gray-600 dark:text-gray-300">
                                    We're revolutionizing the lending industry with transparency, speed, and customer-first service.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
                                <div>
                                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                        Our Story
                                    </h2>
                                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                                        Founded in 2024, LendFast emerged from a simple observation: traditional lending processes were too slow, complex, and often inaccessible to many who needed financial support.
                                    </p>
                                    <p className="text-gray-600 dark:text-gray-300">
                                        We set out to create a lending platform that combines cutting-edge technology with a human touch, making the loan application process faster, more transparent, and more accessible to everyone.
                                    </p>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                        Our Mission
                                    </h2>
                                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                                        Our mission is to empower individuals and businesses by providing quick, fair, and transparent access to financial resources.
                                    </p>
                                    <p className="text-gray-600 dark:text-gray-300">
                                        We believe that everyone deserves access to financial solutions that help them achieve their goals, whether it's growing a business, pursuing education, or managing personal finances.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-20">
                                {stats.map((stat, index) => (
                                    <div key={index} className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl text-center">
                                        <stat.icon className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                                        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                            {stat.number}
                                        </div>
                                        <div className="text-gray-600 dark:text-gray-300">
                                            {stat.label}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="text-center mb-12">
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                                    Our Team
                                </h2>
                                <p className="text-xl text-gray-600 dark:text-gray-300">
                                    Meet the dedicated professionals behind LendFast
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {teamMembers.map((member, index) => (
                                    <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden">
                                        <img
                                            src={member.image}
                                            alt={member.name}
                                            className="w-full h-64 object-cover"
                                        />
                                        <div className="p-6">
                                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                                                {member.name}
                                            </h3>
                                            <p className="text-blue-600 dark:text-blue-400 mb-4">
                                                {member.role}
                                            </p>
                                            <p className="text-gray-600 dark:text-gray-300">
                                                {member.bio}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </main>
                <Footer />
            </div>
        </>
    );
} 