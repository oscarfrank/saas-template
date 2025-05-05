import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";

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

export function Testimonials() {
    return (
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
    );
} 