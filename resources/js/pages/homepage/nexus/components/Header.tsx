import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Network } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
    const { auth, siteSettings, tenant } = usePage<SharedData>().props;

    return (
        <header
            className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm"
            style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
        >
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5 text-slate-900 no-underline transition-opacity hover:opacity-80">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
                            <Network className="h-5 w-5" />
                        </span>
                        <span className="text-lg font-semibold tracking-tight text-slate-900">{siteSettings.site_name}</span>
                    </Link>
                    <div className="flex items-center gap-1 sm:gap-2">
                        <Link
                            href="/about"
                            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                        >
                            About
                        </Link>
                        <Link
                            href="/contact"
                            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                        >
                            Contact
                        </Link>
                        <Link
                            href="/faq"
                            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                        >
                            FAQ
                        </Link>
                        {auth.user ? (
                            <Button
                                asChild
                                size="sm"
                                className="ml-2 rounded-lg bg-indigo-600 font-semibold text-white hover:bg-indigo-700"
                            >
                                <Link href={tenant ? `/${tenant.slug}/dashboard` : '/dashboard'}>Dashboard</Link>
                            </Button>
                        ) : (
                            <>
                                <Button asChild variant="ghost" size="sm" className="ml-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                                    <Link href={route('login')}>Log in</Link>
                                </Button>
                                <Button
                                    asChild
                                    size="sm"
                                    className="ml-2 rounded-lg bg-indigo-600 font-semibold text-white hover:bg-indigo-700"
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
