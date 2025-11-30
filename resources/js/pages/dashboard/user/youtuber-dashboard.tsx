import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useAuth } from '@/hooks/use-auth';
import { useRole } from '@/hooks/use-role';
import { useGreeting } from '@/hooks/use-greeting';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    Video, 
    Image, 
    Type, 
    Clock, 
    TrendingUp, 
    BarChart3, 
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
    Users
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard - YouTuber',
        href: '/dashboard/youtuber',
    },
];

export default function Dashboard() {
    const { user } = useAuth();
    const { hasRole } = useRole();
    const { getGreeting } = useGreeting();

    const channelStats = [
        { title: 'Subscribers', value: '125,432', icon: Users, color: 'text-red-500', trend: '+2.5% this week' },
        { title: 'Total Views', value: '1.2M', icon: Video, color: 'text-blue-500', trend: '+15.3% this month' },
        { title: 'Average CTR', value: '8.2%', icon: Target, color: 'text-green-500', trend: '+1.2% this month' },
        { title: 'Watch Time', value: '45,678 hours', icon: Clock, color: 'text-purple-500', trend: '+12.8% this month' },
    ];

    const creativeTools = [
        {
            title: 'Thumbnail Generator',
            description: 'Create eye-catching thumbnails with AI',
            icon: Image,
            color: 'bg-gradient-to-br from-pink-500 to-purple-600',
            href: '/tools/thumbnail-generator',
        },
        {
            title: 'Title Generator',
            description: 'Generate high-CTR video titles',
            icon: Type,
            color: 'bg-gradient-to-br from-blue-500 to-cyan-600',
            href: '/tools/title-generator',
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
            <Head title="Dashboard - YouTuber" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-semibold">{getGreeting()}, {(user.first_name as string)} {(user.last_name as string)}</h3>
                        <p className="text-muted-foreground">Welcome to your YouTube creator dashboard</p>
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
                                <p className="text-xs text-green-500">{stat.trend}</p>
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
                                    onClick={() => window.location.href = tool.href}
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
                                    onClick={() => window.location.href = tool.href}
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
                                    onClick={() => window.location.href = tool.href}
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
