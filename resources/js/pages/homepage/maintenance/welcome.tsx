import { Head, usePage } from '@inertiajs/react';
import { Construction } from 'lucide-react';
import { type SharedData } from '@/types';

export default function MaintenanceWelcome() {
    const { siteSettings } = usePage<SharedData>().props;
    const flashMessage = (usePage().props as { message?: string }).message;

    return (
        <>
            <Head title={`Maintenance – ${siteSettings.site_name}`} />
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4 text-center">
                <div className="max-w-md">
                    <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400">
                        <Construction className="h-10 w-10" />
                    </div>
                    <h1 className="text-3xl font-bold text-white sm:text-4xl">
                        We’ll be back soon
                    </h1>
                    <p className="mt-4 text-zinc-400">
                        {siteSettings.site_name} is currently under maintenance. Please check back later.
                    </p>
                    {flashMessage && (
                        <p className="mt-4 rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-2 text-sm text-amber-200">
                            {flashMessage}
                        </p>
                    )}
                    <p className="mt-6 text-sm text-zinc-500">
                        If you’re an admin, you can log in to turn off maintenance mode in Settings.
                    </p>
                </div>
            </div>
        </>
    );
}
