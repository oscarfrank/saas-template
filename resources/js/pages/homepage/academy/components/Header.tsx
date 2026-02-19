import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
    const { auth, siteSettings, tenant } = usePage<SharedData>().props;

    return (
        <header
            className="fixed top-0 left-0 right-0 z-50 border-b border-teal-100 bg-white/95 backdrop-blur-sm"
            style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
        >
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5 text-slate-900 no-underline transition-opacity hover:opacity-80">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500 text-white">
                            <BookOpen className="h-5 w-5" />
                        </span>
                        <span className="text-lg font-semibold tracking-tight text-slate-900">{siteSettings.site_name}</span>
                    </Link>
                    <div className="flex items-center gap-1 sm:gap-2">
                        <Link
                            href="/about"
                            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-teal-50 hover:text-teal-700"
                        >
                            About
                        </Link>
                        <Link
                            href="/contact"
                            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-teal-50 hover:text-teal-700"
                        >
                            Contact
                        </Link>
                        <Link
                            href="/faq"
                            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-teal-50 hover:text-teal-700"
                        >
                            FAQ
                        </Link>
                        {auth.user ? (
                            <Button
                                asChild
                                size="sm"
                                className="ml-2 rounded-xl bg-teal-500 font-semibold text-white hover:bg-teal-600"
                            >
                                <Link href={tenant ? `/${tenant.slug}/dashboard` : '/dashboard'}>My learning</Link>
                            </Button>
                        ) : (
                            <>
                                <Button asChild variant="ghost" size="sm" className="ml-2 text-slate-600 hover:bg-teal-50 hover:text-teal-700">
                                    <Link href={route('login')}>Log in</Link>
                                </Button>
                                <Button
                                    asChild
                                    size="sm"
                                    className="ml-2 rounded-xl bg-teal-500 font-semibold text-white hover:bg-teal-600"
                                >
                                    <Link href={route('register')}>Get started</Link>
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </nav>
        </header>
    );
}
