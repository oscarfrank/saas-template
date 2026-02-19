import { Link, usePage } from '@inertiajs/react';
import { Building2, Mail } from 'lucide-react';
import { type SharedData } from '@/types';

export function Footer() {
    const { siteSettings } = usePage<SharedData>().props;

    return (
        <footer
            className="border-t border-slate-200 bg-slate-50 py-12 md:py-16"
            style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
        >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
                    <Link href="/" className="flex items-center gap-2 text-slate-900 no-underline">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-white">
                            <Building2 className="h-5 w-5" />
                        </span>
                        <span className="font-semibold text-slate-900">{siteSettings.site_name}</span>
                    </Link>
                    <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-slate-600">
                        <Link href="/about" className="transition-colors hover:text-slate-900">About</Link>
                        <Link href="/contact" className="transition-colors hover:text-slate-900">Contact</Link>
                        <Link href="/faq" className="transition-colors hover:text-slate-900">FAQ</Link>
                        <Link href="/privacy" className="transition-colors hover:text-slate-900">Privacy</Link>
                        <a
                            href={`mailto:${siteSettings.company_email}`}
                            className="inline-flex items-center gap-1.5 transition-colors hover:text-slate-900"
                        >
                            <Mail className="h-4 w-4" />
                            {siteSettings.company_email}
                        </a>
                    </div>
                </div>
                {siteSettings.footer_text && (
                    <div className="mt-10 border-t border-slate-200 pt-8 text-center text-sm text-slate-500">
                        <p dangerouslySetInnerHTML={{ __html: siteSettings.footer_text }} />
                    </div>
                )}
            </div>
        </footer>
    );
}
