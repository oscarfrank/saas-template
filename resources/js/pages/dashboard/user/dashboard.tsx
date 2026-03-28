import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { useAuth } from '@/hooks/use-auth';
import { useGreeting } from '@/hooks/use-greeting';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ArrowUpRight, Gem, LayoutGrid, Sparkles, Wallet, Youtube } from 'lucide-react';

type HubDestination = {
    id: string;
    title: string;
    description: string;
    route: 'workspace-dashboard' | 'youtuber-dashboard' | 'borrower-dashboard' | 'lender-dashboard';
    icon: typeof LayoutGrid;
    /** Tailwind gradient + ring accents */
    accent: {
        iconBg: string;
        iconFg: string;
        gradient: string;
        borderHover: string;
        glow: string;
    };
};

const DESTINATIONS: HubDestination[] = [
    {
        id: 'workspace',
        title: 'Workspace',
        description: 'Scripts, tasks, and YouTube workflows in one calm surface.',
        route: 'workspace-dashboard',
        icon: LayoutGrid,
        accent: {
            iconBg: 'bg-violet-500/15 dark:bg-violet-400/10',
            iconFg: 'text-violet-600 dark:text-violet-300',
            gradient: 'from-violet-500/[0.07] via-transparent to-fuchsia-500/[0.05]',
            borderHover: 'hover:border-violet-500/35 dark:hover:border-violet-400/30',
            glow: 'group-hover:shadow-violet-500/15 dark:group-hover:shadow-violet-400/10',
        },
    },
    {
        id: 'youtuber',
        title: 'YouTuber',
        description: 'Channel pulse, ideas, and creative tools tailored for creators.',
        route: 'youtuber-dashboard',
        icon: Youtube,
        accent: {
            iconBg: 'bg-rose-500/15 dark:bg-rose-400/10',
            iconFg: 'text-rose-600 dark:text-rose-300',
            gradient: 'from-rose-500/[0.07] via-transparent to-orange-500/[0.05]',
            borderHover: 'hover:border-rose-500/35 dark:hover:border-rose-400/30',
            glow: 'group-hover:shadow-rose-500/15 dark:group-hover:shadow-rose-400/10',
        },
    },
    {
        id: 'borrower',
        title: 'Borrower',
        description: 'Track funding, applications, and what you owe — in one place.',
        route: 'borrower-dashboard',
        icon: Wallet,
        accent: {
            iconBg: 'bg-sky-500/15 dark:bg-sky-400/10',
            iconFg: 'text-sky-600 dark:text-sky-300',
            gradient: 'from-sky-500/[0.07] via-transparent to-cyan-500/[0.05]',
            borderHover: 'hover:border-sky-500/35 dark:hover:border-sky-400/30',
            glow: 'group-hover:shadow-sky-500/15 dark:group-hover:shadow-sky-400/10',
        },
    },
    {
        id: 'lender',
        title: 'Lender',
        description: 'Portfolio view, returns, and opportunities worth your attention.',
        route: 'lender-dashboard',
        icon: Gem,
        accent: {
            iconBg: 'bg-emerald-500/15 dark:bg-emerald-400/10',
            iconFg: 'text-emerald-600 dark:text-emerald-300',
            gradient: 'from-emerald-500/[0.07] via-transparent to-teal-500/[0.05]',
            borderHover: 'hover:border-emerald-500/35 dark:hover:border-emerald-400/30',
            glow: 'group-hover:shadow-emerald-500/15 dark:group-hover:shadow-emerald-400/10',
        },
    },
];

export default function Dashboard() {
    const { tenant } = usePage<{ tenant: { slug: string; default_landing_path?: string } | null }>().props;
    const primaryPath = tenant?.default_landing_path ?? 'dashboard/workspace';
    const breadcrumbs: BreadcrumbItem[] = tenant
        ? [{ title: 'Dashboard', href: `/${tenant.slug}/${primaryPath}` }]
        : [{ title: 'Dashboard', href: '/dashboard' }];

    const tenantRouter = useTenantRouter();
    const { user } = useAuth();
    const { getGreeting } = useGreeting();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard hub" />

            <div className="relative flex min-h-[calc(100vh-8rem)] flex-1 flex-col overflow-hidden rounded-2xl">
                {/* Ambient background */}
                <div
                    className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.12),transparent)]"
                    aria-hidden
                />
                <div
                    className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,transparent,hsl(var(--background))_70%)]"
                    aria-hidden
                />
                <div
                    className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35] dark:opacity-[0.2] [background-image:linear-gradient(hsl(var(--border)/0.5)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/0.5)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
                    aria-hidden
                />

                <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-12 pt-2 sm:px-6 lg:px-8">
                    {/* Hero */}
                    <header className="mb-10 mt-4 text-center sm:mb-12 sm:text-left">
                        <div className="mb-3 inline-flex items-center gap-2">
                            <Badge
                                variant="secondary"
                                className="rounded-full border border-border/80 bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm"
                            >
                                <Sparkles className="mr-1.5 size-3.5 opacity-80" />
                                Dashboard hub
                            </Badge>
                        </div>
                        <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                            {getGreeting()}, {user.first_name as string}{' '}
                            <span className="font-normal text-muted-foreground">{user.last_name as string}</span>
                        </h1>
                        <p className="mx-auto mt-3 max-w-2xl text-pretty text-base text-muted-foreground sm:mx-0">
                            Pick an experience. Your sidebar <span className="text-foreground/90">Dashboard</span> opens
                            your organization&apos;s primary home — this page is for switching contexts.
                        </p>
                    </header>

                    {/* Cards */}
                    <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-2 xl:grid-cols-4">
                        {DESTINATIONS.map((dest) => {
                            const Icon = dest.icon;
                            return (
                                <Link
                                    key={dest.id}
                                    href={tenantRouter.route(dest.route)}
                                    className={cn(
                                        'group relative flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card/40 p-6 shadow-sm backdrop-blur-md transition-all duration-300',
                                        'hover:-translate-y-0.5 hover:bg-card/60 hover:shadow-lg',
                                        dest.accent.borderHover,
                                        dest.accent.glow,
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'pointer-events-none absolute inset-0 bg-gradient-to-br opacity-100 transition-opacity duration-300 group-hover:opacity-100',
                                            dest.accent.gradient,
                                        )}
                                    />
                                    <div className="relative flex flex-1 flex-col">
                                        <div className="mb-5 flex items-start justify-between gap-3">
                                            <div
                                                className={cn(
                                                    'flex size-12 items-center justify-center rounded-2xl ring-1 ring-inset ring-black/[0.04] dark:ring-white/[0.06]',
                                                    dest.accent.iconBg,
                                                )}
                                            >
                                                <Icon className={cn('size-6', dest.accent.iconFg)} strokeWidth={1.75} />
                                            </div>
                                            <span
                                                className={cn(
                                                    'flex size-9 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background/80 text-muted-foreground opacity-0 shadow-sm transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100',
                                                )}
                                            >
                                                <ArrowUpRight className="size-4" />
                                            </span>
                                        </div>
                                        <h2 className="text-lg font-semibold tracking-tight text-foreground">{dest.title}</h2>
                                        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                                            {dest.description}
                                        </p>
                                        <div className="mt-6 flex items-center gap-2 text-xs font-medium text-muted-foreground/80 transition-colors group-hover:text-foreground/80">
                                            <ArrowRight className="size-3.5 opacity-70 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
                                            <span>Open {dest.title}</span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Footnote */}
                    <p className="mx-auto mt-10 max-w-xl text-center text-xs leading-relaxed text-muted-foreground/90">
                        Direct link:{' '}
                        <code className="rounded-md bg-muted/80 px-1.5 py-0.5 font-mono text-[0.7rem] text-foreground/80">
                            /{tenant?.slug ?? '…'}/dashboard/hub
                        </code>
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
