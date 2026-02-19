import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
    const { auth, siteSettings, tenant } = usePage<SharedData>().props;

    return (
        <header
            className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.08] bg-slate-900/90 backdrop-blur-xl"
            style={{ fontFamily: "'Syne', system-ui, sans-serif" }}
        >
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5 text-white no-underline transition-opacity hover:opacity-90">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                            <KeyRound className="h-5 w-5" />
                        </span>
                        <span className="text-lg font-semibold tracking-tight">{siteSettings.site_name}</span>
                    </Link>
                    <div className="flex items-center gap-1 sm:gap-2">
                        <Link
                            href="/about"
                            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                        >
                            About
                        </Link>
                        <Link
                            href="/contact"
                            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                        >
                            Contact
                        </Link>
                        <Link
                            href="/faq"
                            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                        >
                            FAQ
                        </Link>
                        {auth.user ? (
                            <Button
                                asChild
                                size="sm"
                                className="ml-2 rounded-xl bg-amber-500 font-semibold text-slate-900 shadow-lg shadow-amber-500/25 transition hover:bg-amber-400 hover:shadow-amber-500/30"
                            >
                                <Link href={tenant ? `/${tenant.slug}/dashboard` : '/dashboard'}>Member area</Link>
                            </Button>
                        ) : (
                            <>
                                <Button asChild variant="ghost" size="sm" className="ml-2 text-slate-400 hover:bg-white/[0.06] hover:text-white">
                                    <Link href={route('login')}>Log in</Link>
                                </Button>
                                <Button
                                    asChild
                                    size="sm"
                                    className="ml-2 rounded-xl bg-amber-500 font-semibold text-slate-900 shadow-lg shadow-amber-500/25 transition hover:bg-amber-400 hover:shadow-amber-500/30"
                                >
                                    <Link href={route('register')}>Join now</Link>
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </nav>
        </header>
    );
}
