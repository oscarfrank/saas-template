import { Head, Link } from '@inertiajs/react';
import { Construction } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';

export default function MaintenanceAbout() {
    const { siteSettings } = usePage<SharedData>().props;

    return (
        <>
            <Head title={`Maintenance – ${siteSettings.site_name}`} />
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4 text-center">
                <Construction className="h-16 w-16 text-amber-400 mx-auto mb-6" />
                <h1 className="text-2xl font-bold text-white">Under maintenance</h1>
                <p className="mt-2 text-zinc-400">This page is temporarily unavailable.</p>
                <Link href="/" className="mt-6 text-sm text-amber-400 hover:underline">Back to home</Link>
            </div>
        </>
    );
}
