import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { DollarSign } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

export function Header() {
    const { auth, siteSettings, tenant } = usePage<SharedData>().props;

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md dark:bg-gray-900/90 border-b border-gray-100 dark:border-gray-800">
            <nav className="container mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-lg blur opacity-20"></div>
                            <DollarSign className="relative h-8 w-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">{siteSettings.site_name}</span>
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
                                <Link href={tenant ? `/${tenant.slug}/dashboard` : route('dashboard')}>Dashboard</Link>
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
    );
} 