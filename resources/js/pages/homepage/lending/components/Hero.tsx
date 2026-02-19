import React from 'react';
import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';

const heroImages = [
    { src: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", alt: "Business loan application process", title: "Business Loans", description: "Grow your business with our flexible financing options" },
    { src: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", alt: "Personal loan application", title: "Personal Loans", description: "Get the financial support you need for your personal goals" },
    { src: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", alt: "Education financing", title: "Education Loans", description: "Invest in your future with our education financing solutions" }
];

export function Hero() {
    const { siteSettings } = usePage<SharedData>().props;
    const autoplay = React.useRef(Autoplay({ delay: 5000, stopOnInteraction: false }));

    return (
        <section className="relative py-20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"></div>
            <div className="container mx-auto px-6 relative">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="text-left">
                        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">{siteSettings.site_title}</h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">{siteSettings.site_description}</p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link href="/register"><Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">Apply Now</Button></Link>
                            <Link href="/about"><Button size="lg" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-gray-800">Learn More</Button></Link>
                        </div>
                    </div>
                    <div className="relative">
                        <Carousel className="w-full max-w-lg mx-auto" opts={{ loop: true, align: "start" }} plugins={[autoplay.current]}>
                            <CarouselContent>
                                {heroImages.map((image, index) => (
                                    <CarouselItem key={index}>
                                        <div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-xl">
                                            <img src={image.src} alt={image.alt} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
                                                <h3 className="text-2xl font-bold text-white mb-2">{image.title}</h3>
                                                <p className="text-white/90">{image.description}</p>
                                            </div>
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious className="hidden md:flex" />
                            <CarouselNext className="hidden md:flex" />
                        </Carousel>
                    </div>
                </div>
                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">24h</div>
                        <div className="text-gray-600 dark:text-gray-300">Quick Approval</div>
                    </div>
                    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">10k+</div>
                        <div className="text-gray-600 dark:text-gray-300">Happy Customers</div>
                    </div>
                    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">99%</div>
                        <div className="text-gray-600 dark:text-gray-300">Satisfaction Rate</div>
                    </div>
                </div>
            </div>
        </section>
    );
}
