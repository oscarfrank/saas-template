import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useGreeting } from '@/hooks/use-greeting';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Video,
    Image,
    Type,
    Clock,
    TrendingUp,
    FileText,
    Brain,
    Bell,
    HelpCircle,
    Youtube,
    Timer,
    Hash,
    MessageSquare,
    Search,
    Sparkles,
    Zap,
    Lightbulb,
    Target,
    Users,
    type LucideIcon,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useTenantRouter } from '@/hooks/use-tenant-router';

export type YoutubeCreatorDashboard = {
    connected: boolean;
    channel_title?: string | null;
    channel_id?: string | null;
    error?: string;
    subscribers?: number | null;
    lifetime_views?: number | null;
    period_views?: number;
    watch_time_hours?: number;
    avg_thumbnail_ctr_percent?: number | null;
    analytics_period_days?: number;
    analytics_range?: { startDate: string; endDate: string };
    youtube_doc_url?: string | null;
    connect_url?: string | null;
    cache_ttl_seconds?: number;
};

function formatInt(n: number | null | undefined): string {
    if (n == null || Number.isNaN(n)) {
        return '—';
    }
    return new Intl.NumberFormat().format(n);
}

function formatHours(n: number | null | undefined): string {
    if (n == null || Number.isNaN(n)) {
        return '—';
    }
    return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(n)} hours`;
}

function formatCtrPercent(n: number | null | undefined): string {
    if (n == null || Number.isNaN(n)) {
        return '—';
    }
    return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n)}%`;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Creator',
        href: '/creator',
    },
];

type ChannelStat = {
    title: string;
    value: string;
    icon: LucideIcon;
    color: string;
    caption: string;
};

export default function CreatorIndex({ youtubeCreator }: { youtubeCreator: YoutubeCreatorDashboard }) {
    const tenantRouter = useTenantRouter();
    const { user } = useAuth();
    const { getGreeting } = useGreeting();

    const periodDays = youtubeCreator.analytics_period_days ?? 28;
    const periodLabel = `Last ${periodDays} days (YouTube Analytics)`;

    const channelStats: ChannelStat[] = useMemo(() => {
        const y = youtubeCreator;
        if (!y.connected) {
            return [
                { title: 'Subscribers', value: '—', icon: Users, color: 'text-red-500', caption: 'Connect to load' },
                { title: 'Total Views', value: '—', icon: Video, color: 'text-blue-500', caption: 'Connect to load' },
                { title: 'Average CTR', value: '—', icon: Target, color: 'text-green-500', caption: 'Connect to load' },
                { title: 'Watch Time', value: '—', icon: Clock, color: 'text-purple-500', caption: 'Connect to load' },
            ];
        }
        if (y.error) {
            return [
                { title: 'Subscribers', value: '—', icon: Users, color: 'text-red-500', caption: 'Could not refresh' },
                { title: 'Total Views', value: '—', icon: Video, color: 'text-blue-500', caption: 'Could not refresh' },
                { title: 'Average CTR', value: '—', icon: Target, color: 'text-green-500', caption: 'Could not refresh' },
                { title: 'Watch Time', value: '—', icon: Clock, color: 'text-purple-500', caption: 'Could not refresh' },
            ];
        }

        return [
            {
                title: 'Subscribers',
                value: formatInt(y.subscribers),
                icon: Users,
                color: 'text-red-500',
                caption: 'Channel total (YouTube Data API)',
            },
            {
                title: 'Total Views',
                value: formatInt(y.lifetime_views),
                icon: Video,
                color: 'text-blue-500',
                caption: 'Lifetime channel views',
            },
            {
                title: 'Average CTR',
                value: formatCtrPercent(y.avg_thumbnail_ctr_percent),
                icon: Target,
                color: 'text-green-500',
                caption: `${periodLabel} · thumbnail impressions CTR`,
            },
            {
                title: 'Watch Time',
                value: formatHours(y.watch_time_hours),
                icon: Clock,
                color: 'text-purple-500',
                caption: `${periodLabel} · estimated minutes watched`,
            },
        ];
    }, [youtubeCreator, periodLabel]);

    const creativeTools = [
        {
            title: 'Thumbnail Generator',
            description: 'Create eye-catching thumbnails with AI',
            icon: Image,
            color: 'bg-gradient-to-br from-pink-500 to-purple-600',
            href: '/tools/thumbnail-generator',
            routeName: 'cortex.agents.mirage' as const,
        },
        {
            title: 'Title Generator',
            description: 'Generate high-CTR video titles',
            icon: Type,
            color: 'bg-gradient-to-br from-blue-500 to-cyan-600',
            href: '/tools/title-generator',
            routeName: 'cortex.agents.bait' as const,
        },
        {
            title: 'Script to Description',
            description: 'Convert your script to SEO-optimized description',
            icon: FileText,
            color: 'bg-gradient-to-br from-green-500 to-emerald-600',
            href: '/tools/script-to-description',
        },
        {
            title: 'Timestamp Generator',
            description: 'Auto-generate video timestamps',
            icon: Timer,
            color: 'bg-gradient-to-br from-orange-500 to-red-600',
            href: '/tools/timestamp-generator',
        },
    ];

    const contentTools = [
        {
            title: 'Trending Topics',
            description: 'Discover trending topics in your niche',
            icon: TrendingUp,
            color: 'bg-gradient-to-br from-yellow-500 to-orange-600',
            href: '/tools/trending-topics',
            routeName: 'cortex.agents.pulse' as const,
        },
        {
            title: 'Hashtag Generator',
            description: 'Generate relevant hashtags for your videos',
            icon: Hash,
            color: 'bg-gradient-to-br from-indigo-500 to-violet-600',
            href: '/tools/hashtag-generator',
        },
        {
            title: 'Comment Responder',
            description: 'AI-powered comment responses',
            icon: MessageSquare,
            color: 'bg-gradient-to-br from-cyan-500 to-blue-600',
            href: '/tools/comment-responder',
        },
        {
            title: 'SEO Optimizer',
            description: 'Optimize your video for search',
            icon: Search,
            color: 'bg-gradient-to-br from-teal-500 to-green-600',
            href: '/tools/seo-optimizer',
        },
    ];

    const aiTools = [
        {
            title: 'Content Ideas',
            description: 'Get AI-generated content ideas',
            icon: Lightbulb,
            color: 'bg-gradient-to-br from-amber-500 to-yellow-600',
            href: '/tools/content-ideas',
        },
        {
            title: 'Script Generator',
            description: 'Generate video scripts with AI',
            icon: Brain,
            color: 'bg-gradient-to-br from-rose-500 to-pink-600',
            href: '/tools/script-generator',
        },
        {
            title: 'Thumbnail Tester',
            description: 'Test thumbnail effectiveness',
            icon: Target,
            color: 'bg-gradient-to-br from-violet-500 to-purple-600',
            href: '/tools/thumbnail-tester',
            routeName: 'creator.thumbnail-tester',
        },
        {
            title: 'Performance Predictor',
            description: 'Predict video performance',
            icon: Zap,
            color: 'bg-gradient-to-br from-sky-500 to-blue-600',
            href: '/tools/performance-predictor',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Creator" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-semibold">{getGreeting()}, {(user.first_name as string)} {(user.last_name as string)}</h3>
                        <p className="text-muted-foreground">Welcome to your Creator dashboard</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                            <Bell className="mr-2 h-4 w-4" />
                            Notifications
                        </Button>
                        <Button variant="outline" size="sm">
                            <HelpCircle className="mr-2 h-4 w-4" />
                            Help
                        </Button>
                    </div>
                </div>

                {youtubeCreator.error && (
                    <Alert variant="destructive">
                        <AlertTitle>Could not load YouTube stats</AlertTitle>
                        <AlertDescription className="flex flex-col gap-2">
                            <span>{youtubeCreator.error}</span>
                            {youtubeCreator.youtube_doc_url && (
                                <Link
                                    href={youtubeCreator.youtube_doc_url}
                                    className="font-medium underline underline-offset-4"
                                >
                                    Open Youtube Doc (Cortex)
                                </Link>
                            )}
                        </AlertDescription>
                    </Alert>
                )}

                {!youtubeCreator.connected && youtubeCreator.connect_url && (
                    <Alert>
                        <AlertTitle>Connect YouTube once</AlertTitle>
                        <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <span>
                                Channel stats use the same Google connection as{' '}
                                <span className="font-medium">Youtube Doc</span> in Cortex. Connect there to see live
                                numbers here (cached ~{Math.round((youtubeCreator.cache_ttl_seconds ?? 600) / 60)} min).
                            </span>
                            <Button variant="default" size="sm" asChild>
                                <a href={youtubeCreator.connect_url}>Connect YouTube</a>
                            </Button>
                        </AlertDescription>
                    </Alert>
                )}

                {youtubeCreator.connected && !youtubeCreator.error && youtubeCreator.channel_title && (
                    <p className="text-sm text-muted-foreground">
                        Showing data for <span className="font-medium text-foreground">{youtubeCreator.channel_title}</span>
                        {youtubeCreator.youtube_doc_url && (
                            <>
                                {' · '}
                                <Link
                                    href={youtubeCreator.youtube_doc_url}
                                    className="underline underline-offset-4"
                                >
                                    Cortex
                                </Link>
                            </>
                        )}
                    </p>
                )}

                {/* Channel Stats */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {channelStats.map((stat, index) => (
                        <Card key={index} className="hover:shadow-lg transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {stat.title}
                                </CardTitle>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                                <p className="text-xs text-muted-foreground">{stat.caption}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Creative Tools */}
                <Card>
                    <CardHeader>
                        <CardTitle>Creative Tools</CardTitle>
                        <CardDescription>Tools to enhance your content creation</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {creativeTools.map((tool, index) => (
                                <div
                                    key={index}
                                    className={`${tool.color} rounded-xl p-6 text-white hover:scale-105 transition-transform cursor-pointer`}
                                    onClick={() =>
                                        'routeName' in tool && tool.routeName
                                            ? tenantRouter.visit(tool.routeName)
                                            : (window.location.href = tool.href)
                                    }
                                >
                                    <div className="flex flex-col items-center text-center gap-2">
                                        <tool.icon className="h-8 w-8" />
                                        <h4 className="font-semibold">{tool.title}</h4>
                                        <p className="text-sm text-white/80">{tool.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Content Tools */}
                <Card>
                    <CardHeader>
                        <CardTitle>Content Tools</CardTitle>
                        <CardDescription>Tools to optimize your content</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {contentTools.map((tool, index) => (
                                <div
                                    key={index}
                                    className={`${tool.color} rounded-xl p-6 text-white hover:scale-105 transition-transform cursor-pointer`}
                                    onClick={() =>
                                        'routeName' in tool && tool.routeName
                                            ? tenantRouter.visit(tool.routeName)
                                            : (window.location.href = tool.href)
                                    }
                                >
                                    <div className="flex flex-col items-center text-center gap-2">
                                        <tool.icon className="h-8 w-8" />
                                        <h4 className="font-semibold">{tool.title}</h4>
                                        <p className="text-sm text-white/80">{tool.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* AI Tools */}
                <Card>
                    <CardHeader>
                        <CardTitle>AI-Powered Tools</CardTitle>
                        <CardDescription>Advanced tools powered by artificial intelligence</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {aiTools.map((tool, index) => (
                                <div
                                    key={index}
                                    className={`${tool.color} rounded-xl p-6 text-white hover:scale-105 transition-transform cursor-pointer`}
                                    onClick={() =>
                                        (tool as { routeName?: string }).routeName
                                            ? tenantRouter.visit((tool as { routeName: string }).routeName)
                                            : (window.location.href = tool.href)
                                    }
                                >
                                    <div className="flex flex-col items-center text-center gap-2">
                                        <tool.icon className="h-8 w-8" />
                                        <h4 className="font-semibold">{tool.title}</h4>
                                        <p className="text-sm text-white/80">{tool.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Tips */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Tips</CardTitle>
                        <CardDescription>Daily tips to improve your content</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
                                <Sparkles className="h-6 w-6 text-yellow-500" />
                                <div>
                                    <p className="font-medium">Optimize your video length</p>
                                    <p className="text-sm text-muted-foreground">
                                        Videos between 7-15 minutes tend to perform best in your niche
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
                                <Youtube className="h-6 w-6 text-red-500" />
                                <div>
                                    <p className="font-medium">Engage with your audience</p>
                                    <p className="text-sm text-muted-foreground">
                                        Respond to comments within the first 24 hours to boost engagement
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
