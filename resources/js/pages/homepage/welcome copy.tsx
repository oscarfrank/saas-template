import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, Building2, CheckCircle2, Clock, DollarSign, HelpCircle, Mail, Phone, Shield, TrendingUp, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    const testimonials = [
        {
            quote: "LendFast made getting a business loan incredibly simple. The process was smooth and the rates were competitive.",
            author: "Sarah Johnson",
            role: "Small Business Owner"
        },
        {
            quote: "I was impressed by how quickly I got approved. The customer service was exceptional throughout the process.",
            author: "Michael Chen",
            role: "Entrepreneur"
        },
        {
            quote: "The flexible repayment options helped me manage my cash flow better. Highly recommended!",
            author: "Emily Rodriguez",
            role: "Startup Founder"
        }
    ];

    return (
        <>
            <Head title="Welcome to LendFast - Premium Financial Solutions">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
                {/* Navigation */}
                <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md dark:bg-gray-900/90 border-b border-gray-100 dark:border-gray-800">
                    <nav className="container mx-auto px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="relative">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-lg blur opacity-20"></div>
                                    <DollarSign className="relative h-8 w-8 text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">LendFast</span>
                            </div>
                            
                            <NavigationMenu>
                                <NavigationMenuList>
                                    <NavigationMenuItem>
                                        <NavigationMenuTrigger>Products</NavigationMenuTrigger>
                                        <NavigationMenuContent>
                                            <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px]">
                                                <li className="row-span-3">
                                                    <NavigationMenuLink asChild>
                                                        <a
                                                            className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-blue-600 to-blue-400 p-6 no-underline outline-none focus:shadow-md"
                                                            href="/loans"
                                                        >
                                                            <DollarSign className="h-6 w-6 text-white" />
                                                            <div className="mb-2 mt-4 text-lg font-medium text-white">
                                                                Business Loans
                                                            </div>
                                                            <p className="text-sm leading-tight text-white/90">
                                                                Flexible financing solutions for your business needs
                                                            </p>
                                                        </a>
                                                    </NavigationMenuLink>
                                                </li>
                                                <li>
                                                    <NavigationMenuLink asChild>
                                                        <a
                                                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                                            href="/loans/personal"
                                                        >
                                                            <div className="text-sm font-medium leading-none">Personal Loans</div>
                                                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                                                Quick and easy personal financing options
                                                            </p>
                                                        </a>
                                                    </NavigationMenuLink>
                                                </li>
                                                <li>
                                                    <NavigationMenuLink asChild>
                                                        <a
                                                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                                            href="/loans/education"
                                                        >
                                                            <div className="text-sm font-medium leading-none">Education Loans</div>
                                                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                                                Invest in your future with our education financing
                                                            </p>
                                                        </a>
                                                    </NavigationMenuLink>
                                                </li>
                                            </ul>
                                        </NavigationMenuContent>
                                    </NavigationMenuItem>
                                    <NavigationMenuItem>
                                        <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
                                        <NavigationMenuContent>
                                            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                                                <li>
                                                    <NavigationMenuLink asChild>
                                                        <a
                                                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                                            href="/faq"
                                                        >
                                                            <div className="text-sm font-medium leading-none">FAQ</div>
                                                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                                                Frequently asked questions about our services
                                                            </p>
                                                        </a>
                                                    </NavigationMenuLink>
                                                </li>
                                                <li>
                                                    <NavigationMenuLink asChild>
                                                        <a
                                                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                                            href="/blog"
                                                        >
                                                            <div className="text-sm font-medium leading-none">Blog</div>
                                                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                                                Latest insights and financial tips
                                                            </p>
                                                        </a>
                                                    </NavigationMenuLink>
                                                </li>
                                                <li>
                                                    <NavigationMenuLink asChild>
                                                        <a
                                                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                                            href="/calculator"
                                                        >
                                                            <div className="text-sm font-medium leading-none">Loan Calculator</div>
                                                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                                                Calculate your potential loan payments
                                                            </p>
                                                        </a>
                                                    </NavigationMenuLink>
                                                </li>
                                                <li>
                                                    <NavigationMenuLink asChild>
                                                        <a
                                                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                                            href="/guides"
                                                        >
                                                            <div className="text-sm font-medium leading-none">Guides</div>
                                                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                                                Comprehensive guides for borrowers
                                                            </p>
                                                        </a>
                                                    </NavigationMenuLink>
                                                </li>
                                            </ul>
                                        </NavigationMenuContent>
                                    </NavigationMenuItem>
                                    <NavigationMenuItem>
                                        <NavigationMenuTrigger>Company</NavigationMenuTrigger>
                                        <NavigationMenuContent>
                                            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                                                <li>
                                                    <NavigationMenuLink asChild>
                                                        <a
                                                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                                            href="/about"
                                                        >
                                                            <div className="text-sm font-medium leading-none">About Us</div>
                                                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                                                Learn about our mission and values
                                                            </p>
                                                        </a>
                                                    </NavigationMenuLink>
                                                </li>
                                                <li>
                                                    <NavigationMenuLink asChild>
                                                        <a
                                                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                                            href="/contact"
                                                        >
                                                            <div className="text-sm font-medium leading-none">Contact Us</div>
                                                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                                                Get in touch with our team
                                                            </p>
                                                        </a>
                                                    </NavigationMenuLink>
                                                </li>
                                                <li>
                                                    <NavigationMenuLink asChild>
                                                        <a
                                                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                                            href="/careers"
                                                        >
                                                            <div className="text-sm font-medium leading-none">Careers</div>
                                                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                                                Join our growing team
                                                            </p>
                                                        </a>
                                                    </NavigationMenuLink>
                                                </li>
                                                <li>
                                                    <NavigationMenuLink asChild>
                                                        <a
                                                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                                            href="/press"
                                                        >
                                                            <div className="text-sm font-medium leading-none">Press</div>
                                                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                                                Latest news and media coverage
                                                            </p>
                                                        </a>
                                                    </NavigationMenuLink>
                                                </li>
                                            </ul>
                                        </NavigationMenuContent>
                                    </NavigationMenuItem>
                                </NavigationMenuList>
                            </NavigationMenu>

                            <div className="flex items-center space-x-4">
                                {auth.user ? (
                                    <Button asChild variant="default">
                                        <Link href={route('dashboard')}>Dashboard</Link>
                                    </Button>
                                ) : (
                                    <>
                                        <Button asChild variant="ghost">
                                            <Link href={route('login')}>Log in</Link>
                                        </Button>
                                        <Button asChild variant="default">
                                            <Link href={route('register')}>Get Started</Link>
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </nav>
                </header>

                {/* Hero Section */}
                <section className="pt-32 pb-20 px-6">
                    <div className="container mx-auto">
                        <div className="flex flex-col lg:flex-row items-center gap-16">
                            <div className="lg:w-1/2 space-y-8">
                                <div className="space-y-4">
                                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 dark:bg-gray-800 text-blue-600 dark:text-blue-400">
                                        <span className="text-sm font-medium">Premium Financial Solutions</span>
                                    </div>
                                    <h1 className="text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                                        Elevate Your Financial Journey with <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">LendFast</span>
                                    </h1>
                                    <p className="text-xl text-gray-600 dark:text-gray-300">
                                        Experience a new standard in lending. Our innovative platform combines cutting-edge technology with personalized service to deliver exceptional financial solutions.
                                    </p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-blue-400 text-white hover:from-blue-700 hover:to-blue-500">
                                        <Link href={route('register')}>Apply Now</Link>
                                    </Button>
                                    <Button asChild size="lg" variant="outline">
                                        <Link href="#features">Learn More</Link>
                                    </Button>
                                </div>
                                <div className="flex items-center space-x-8 pt-8">
                                    <div className="flex items-center space-x-2">
                                        <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                        <span className="text-gray-600 dark:text-gray-300">10,000+ Happy Customers</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                        <span className="text-gray-600 dark:text-gray-300">Trusted by Businesses</span>
                                    </div>
                                </div>
                            </div>
                            <div className="lg:w-1/2 relative">
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl blur opacity-20"></div>
                                <img 
                                    src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
                                    alt="Premium financial services"
                                    className="relative rounded-2xl shadow-2xl"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Testimonials Carousel */}
                <section className="py-20 bg-gray-50 dark:bg-gray-800">
                    <div className="container mx-auto px-6">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                                What Our Customers Say
                            </h2>
                            <p className="text-xl text-gray-600 dark:text-gray-300">
                                Don't just take our word for it - hear from our satisfied customers
                            </p>
                        </div>
                        <Carousel className="w-full max-w-4xl mx-auto">
                            <CarouselContent>
                                {testimonials.map((testimonial, index) => (
                                    <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                                        <div className="p-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg">
                                            <div className="flex items-center mb-4">
                                                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                                    <span className="text-blue-600 dark:text-blue-400 font-bold text-xl">
                                                        {testimonial.author.charAt(0)}
                                                    </span>
                                                </div>
                                                <div className="ml-4">
                                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                        {testimonial.author}
                                                    </h3>
                                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                                        {testimonial.role}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-300">
                                                "{testimonial.quote}"
                                            </p>
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious className="hidden md:flex" />
                            <CarouselNext className="hidden md:flex" />
                        </Carousel>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-20">
                    <div className="container mx-auto px-6">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                                Why Choose LendFast?
                            </h2>
                            <p className="text-xl text-gray-600 dark:text-gray-300">
                                We combine innovation with reliability to deliver exceptional financial solutions.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <div className="relative group p-6">
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
                                <div className="relative p-6 bg-white dark:bg-gray-900 rounded-xl ring-1 ring-gray-900/5 dark:ring-gray-800">
                                    <Clock className="h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Quick Approval</h3>
                                    <p className="text-gray-600 dark:text-gray-300">Get your loan approved within 24 hours with minimal documentation.</p>
                                </div>
                            </div>
                            <div className="relative group p-6">
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
                                <div className="relative p-6 bg-white dark:bg-gray-900 rounded-xl ring-1 ring-gray-900/5 dark:ring-gray-800">
                                    <DollarSign className="h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Flexible Terms</h3>
                                    <p className="text-gray-600 dark:text-gray-300">Choose repayment terms that work best for your financial situation.</p>
                                </div>
                            </div>
                            <div className="relative group p-6">
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
                                <div className="relative p-6 bg-white dark:bg-gray-900 rounded-xl ring-1 ring-gray-900/5 dark:ring-gray-800">
                                    <Shield className="h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Secure & Safe</h3>
                                    <p className="text-gray-600 dark:text-gray-300">Your data is protected with bank-level security measures.</p>
                                </div>
                            </div>
                            <div className="relative group p-6">
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
                                <div className="relative p-6 bg-white dark:bg-gray-900 rounded-xl ring-1 ring-gray-900/5 dark:ring-gray-800">
                                    <TrendingUp className="h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Competitive Rates</h3>
                                    <p className="text-gray-600 dark:text-gray-300">Enjoy some of the most competitive interest rates in the market.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How It Works Section */}
                <section className="py-20 bg-gray-50 dark:bg-gray-800">
                    <div className="container mx-auto px-6">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                                How It Works
                            </h2>
                            <p className="text-xl text-gray-600 dark:text-gray-300">
                                Our streamlined process makes getting a loan simple and efficient.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
                                <div className="relative p-8 bg-white dark:bg-gray-900 rounded-xl ring-1 ring-gray-900/5 dark:ring-gray-800">
                                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-6">1</div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Apply Online</h3>
                                    <p className="text-gray-600 dark:text-gray-300">Fill out our simple application form in minutes.</p>
                                </div>
                            </div>
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
                                <div className="relative p-8 bg-white dark:bg-gray-900 rounded-xl ring-1 ring-gray-900/5 dark:ring-gray-800">
                                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-6">2</div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Get Approved</h3>
                                    <p className="text-gray-600 dark:text-gray-300">Receive quick approval with minimal documentation.</p>
                                </div>
                            </div>
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
                                <div className="relative p-8 bg-white dark:bg-gray-900 rounded-xl ring-1 ring-gray-900/5 dark:ring-gray-800">
                                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-6">3</div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Receive Funds</h3>
                                    <p className="text-gray-600 dark:text-gray-300">Get your money directly in your bank account.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20">
                    <div className="container mx-auto px-6 text-center">
                        <div className="max-w-3xl mx-auto">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Ready to Elevate Your Financial Journey?</h2>
                            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">Join our community of satisfied customers who have achieved their financial goals with LendFast.</p>
                            <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-blue-400 text-white hover:from-blue-700 hover:to-blue-500">
                                <Link href={route('register')}>
                                    Apply Now
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-gray-900 text-white py-12">
                    <div className="container mx-auto px-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <div>
                                <div className="flex items-center space-x-2 mb-4">
                                    <div className="relative">
                                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-lg blur opacity-20"></div>
                                        <DollarSign className="relative h-8 w-8 text-blue-400" />
                                    </div>
                                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent">LendFast</span>
                                </div>
                                <p className="text-gray-400">Making financial dreams come true since 2024.</p>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
                                <ul className="space-y-2">
                                    <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors">About Us</Link></li>
                                    <li><Link href="/loans" className="text-gray-400 hover:text-white transition-colors">Our Loans</Link></li>
                                    <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Support</h3>
                                <ul className="space-y-2">
                                    <li><Link href="/faq" className="text-gray-400 hover:text-white transition-colors">FAQ</Link></li>
                                    <li><Link href="/help" className="text-gray-400 hover:text-white transition-colors">Help Center</Link></li>
                                    <li><Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
                                <ul className="space-y-2">
                                    <li className="flex items-center space-x-2 text-gray-400">
                                        <Mail className="h-4 w-4" />
                                        <span>support@LendFast.com</span>
                                    </li>
                                    <li className="flex items-center space-x-2 text-gray-400">
                                        <Phone className="h-4 w-4" />
                                        <span>+1 (555) 123-4567</span>
                                    </li>
                                    <li className="flex items-center space-x-2 text-gray-400">
                                        <HelpCircle className="h-4 w-4" />
                                        <span>24/7 Support</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
                            <p>&copy; 2024 LendFast. All rights reserved.</p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
