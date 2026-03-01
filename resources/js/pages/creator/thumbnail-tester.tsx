import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ImageIcon, Maximize2, Minimize2, Shuffle, Highlighter, Monitor, Tablet, Smartphone, Pencil } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

function getBreadcrumbs(creatorIndexUrl: string): BreadcrumbItem[] {
    return [
        { title: 'Creator', href: creatorIndexUrl },
        { title: 'Thumbnail Tester', href: '' },
    ];
}

type VideoData = {
    title: string;
    channel: string;
    views: string;
    timeAgo: string;
    duration: string;
    thumbnail: string;
    channelIcon: string;
};

const allVideosData: VideoData[] = [
    { title: "Samsung Galaxy A55 vs Galaxy S24 - Don't make a MISTAKE", channel: "WhatGear", views: "648K views", timeAgo: "8 months ago", duration: "12:39", thumbnail: "/images/thumbnail-preview/thumbnails/a55-vs-s24.jpg", channelIcon: "/images/thumbnail-preview/icons/whatgear.jpg" },
    { title: "iShowSpeed's NEW $100,000 Setup Reveal!", channel: "Live Speedy", views: "1.2M views", timeAgo: "4 days ago", duration: "9:00", thumbnail: "/images/thumbnail-preview/thumbnails/studio-speed.jpg", channelIcon: "/images/thumbnail-preview/icons/livespeedy.jpg" },
    { title: "Asking Billionaires How They Got Rich! (Beverly Hills)", channel: "School of Hard Knocks", views: "78K views", timeAgo: "1 day ago", duration: "16:34", thumbnail: "/images/thumbnail-preview/thumbnails/hard-interview-1.jpg", channelIcon: "/images/thumbnail-preview/icons/soh.jpg" },
    { title: "12,419 Days Of Strandbeest Evolution", channel: "Veritasium", views: "308K views", timeAgo: "3 hours ago", duration: "21:38", thumbnail: "/images/thumbnail-preview/thumbnails/strandbeast.jpg", channelIcon: "/images/thumbnail-preview/icons/veritasium.jpg" },
    { title: "The almost perfect phone.", channel: "Ryan Thomas", views: "96K views", timeAgo: "1 month ago", duration: "9:13", thumbnail: "/images/thumbnail-preview/thumbnails/perfect-phone.jpg", channelIcon: "/images/thumbnail-preview/icons/ryanthomas.jpg" },
    { title: "I bought the THINNEST Tech in the world.", channel: "Mrwhosetheboss", views: "24M views", timeAgo: "2 year ago", duration: "17:14", thumbnail: "/images/thumbnail-preview/thumbnails/thin-phone.jpg", channelIcon: "/images/thumbnail-preview/icons/arun.jpg" },
    { title: "19 TOXIC Tech Fails that will last Forever.", channel: "Mrwhosetheboss", views: "17M views", timeAgo: "2 year ago", duration: "29:14", thumbnail: "/images/thumbnail-preview/thumbnails/toxic-tech.jpg", channelIcon: "/images/thumbnail-preview/icons/arun.jpg" },
    { title: "The MrBeast MEGA-STUDIO Tour!", channel: "Mrwhosetheboss", views: "29M views", timeAgo: "2 year ago", duration: "18:05", thumbnail: "/images/thumbnail-preview/thumbnails/mrbeast-studio-tour.jpg", channelIcon: "/images/thumbnail-preview/icons/arun.jpg" },
    { title: "Samsung Galaxy A16 5G Review - GOOD, BAD & UGLY!", channel: "Oscarmini", views: "30K views", timeAgo: "3 weeks ago", duration: "8:14", thumbnail: "/images/thumbnail-preview/thumbnails/a16-review.jpg", channelIcon: "/images/thumbnail-preview/icons/oscarmini.jpg" },
    { title: "Samsung Galaxy S24 FE Review - Don't Make a MISTAKE", channel: "Oscarmini", views: "5.5K views", timeAgo: "1 month ago", duration: "8:39", thumbnail: "/images/thumbnail-preview/thumbnails/s24-fe.jpg", channelIcon: "/images/thumbnail-preview/icons/oscarmini.jpg" },
    { title: "Why REFURBISHED Gadgets Are Taking Over NEW Gadgets", channel: "Oscarmini", views: "3.6K views", timeAgo: "1 month ago", duration: "5:12", thumbnail: "/images/thumbnail-preview/thumbnails/refurb-over-new.jpg", channelIcon: "/images/thumbnail-preview/icons/oscarmini.jpg" },
    { title: "STOP Wasting MONEY on New PHONES! Here's WHY", channel: "Oscarmini", views: "85K views", timeAgo: "6 months ago", duration: "7:06", thumbnail: "/images/thumbnail-preview/thumbnails/stop-waste-new.jpg", channelIcon: "/images/thumbnail-preview/icons/oscarmini.jpg" },
    { title: "Samsung Galaxy A55 vs TECNO Camon 30 Pro vs Redmi Note 13 Pro Plus", channel: "Oscarmini", views: "75K views", timeAgo: "7 months ago", duration: "14:06", thumbnail: "/images/thumbnail-preview/thumbnails/a55-c30-rn13.jpg", channelIcon: "/images/thumbnail-preview/icons/oscarmini.jpg" },
    { title: "Using Apple Vision Pro: What It's Actually Like!", channel: "Marques Brownlee", views: "27M views", timeAgo: "10 months ago", duration: "37:18", thumbnail: "/images/thumbnail-preview/thumbnails/vision-pro.jpg", channelIcon: "/images/thumbnail-preview/icons/marques.jpg" },
    { title: "Driving Tesla Cybertruck: Everything You Need to Know!", channel: "Marques Brownlee", views: "21M views", timeAgo: "1 year ago", duration: "40:21", thumbnail: "/images/thumbnail-preview/thumbnails/cybertruck.jpg", channelIcon: "/images/thumbnail-preview/icons/marques.jpg" },
    { title: "AirPods Pro Review: Imperfectly Perfect!", channel: "Marques Brownlee", views: "7.4M views", timeAgo: "5 years ago", duration: "9:36", thumbnail: "/images/thumbnail-preview/thumbnails/airpods-pro.jpg", channelIcon: "/images/thumbnail-preview/icons/marques.jpg" },
    { title: "Infinix Hot 40 Pro Review", channel: "Valor Reviews", views: "199K views", timeAgo: "11 months ago", duration: "7:20", thumbnail: "/images/thumbnail-preview/thumbnails/hot-40-pro.jpg", channelIcon: "/images/thumbnail-preview/icons/valor.jpg" },
    { title: "Infinix Zero Ultra 5G Unboxing & Review", channel: "Valor Reviews", views: "155K views", timeAgo: "2 years ago", duration: "13:33", thumbnail: "/images/thumbnail-preview/thumbnails/zero-ultra.jpg", channelIcon: "/images/thumbnail-preview/icons/valor.jpg" },
    { title: "Infinix Hot 50 Pro+ Review - Too slim to be true!", channel: "Izzi Boye", views: "71K views", timeAgo: "4 weeks ago", duration: "10:09", thumbnail: "/images/thumbnail-preview/thumbnails/hot-50-pro-plus.jpg", channelIcon: "/images/thumbnail-preview/icons/izzi.jpg" },
    { title: "Samsung Galaxy Z Fold 4 Long Term Review - vs Fold 6", channel: "Izzi Boye", views: "16K views", timeAgo: "3 months ago", duration: "6:09", thumbnail: "/images/thumbnail-preview/thumbnails/fold-4-6.jpg", channelIcon: "/images/thumbnail-preview/icons/izzi.jpg" },
    { title: "Samsung Galaxy A35 Review - One Month Later", channel: "Izzi Boye", views: "99K views", timeAgo: "7 months ago", duration: "9:53", thumbnail: "/images/thumbnail-preview/thumbnails/galaxy-a35.jpg", channelIcon: "/images/thumbnail-preview/icons/izzi.jpg" },
    { title: "History of Russia-Ukraine Conflict Explained", channel: "Valuetainment", views: "533K views", timeAgo: "2 days ago", duration: "22:32", thumbnail: "/images/thumbnail-preview/thumbnails/ukraine-russia.jpg", channelIcon: "/images/thumbnail-preview/icons/valuetainment.jpg" },
    { title: "10 Ways To Judge A Successful Year - How To Reprogram Yourself for 2025", channel: "Valuetainment", views: "67K views", timeAgo: "4 days ago", duration: "16:34", thumbnail: "/images/thumbnail-preview/thumbnails/successful-year.jpg", channelIcon: "/images/thumbnail-preview/icons/valuetainment.jpg" },
    { title: "The WORST Advice Parents & Elders Give", channel: "Valuetainment", views: "52K views", timeAgo: "2 weeks ago", duration: "6:29", thumbnail: "/images/thumbnail-preview/thumbnails/worst-advice.jpg", channelIcon: "/images/thumbnail-preview/icons/valuetainment.jpg" },
    { title: "the only video you need to get rich…", channel: "Iman Gadzhi", views: "568K views", timeAgo: "4 months ago", duration: "13:54", thumbnail: "/images/thumbnail-preview/thumbnails/get-rich.jpg", channelIcon: "/images/thumbnail-preview/icons/iman.jpg" },
    { title: "Let me teach you how to invest in 2024", channel: "Iman Gadzhi", views: "428K views", timeAgo: "3 months ago", duration: "12:21", thumbnail: "/images/thumbnail-preview/thumbnails/invest-2024.jpg", channelIcon: "/images/thumbnail-preview/icons/iman.jpg" },
    { title: "10 Things Iman Gadzhi Can't Live Without 2024", channel: "Iman Gadzhi", views: "732K views", timeAgo: "6 months ago", duration: "17:54", thumbnail: "/images/thumbnail-preview/thumbnails/essentials-iman.jpg", channelIcon: "/images/thumbnail-preview/icons/iman.jpg" },
    { title: "Samsung Galaxy Z Fold / Flip 6 - Exclusive Hands On!", channel: "Fisayo Fosudo", views: "13K views", timeAgo: "4 months ago", duration: "8:42", thumbnail: "/images/thumbnail-preview/thumbnails/z-fold.jpg", channelIcon: "/images/thumbnail-preview/icons/fisayo.jpg" },
    { title: "10 Streams of Income – Making $3,500 in a Week!", channel: "Fisayo Fosudo", views: "58K views", timeAgo: "3 months ago", duration: "14:19", thumbnail: "/images/thumbnail-preview/thumbnails/income-streams.jpg", channelIcon: "/images/thumbnail-preview/icons/fisayo.jpg" },
    { title: "M4 Mac Mini: Frustratingly Great", channel: "Pete Matheson", views: "9K views", timeAgo: "13 hours ago", duration: "19:03", thumbnail: "/images/thumbnail-preview/thumbnails/m4-mac-mini.jpg", channelIcon: "/images/thumbnail-preview/icons/pete.jpg" },
    { title: "$1 vs $500,000 Experiences!", channel: "MrBeast", views: "129M views", timeAgo: "1 month ago", duration: "17:39", thumbnail: "/images/thumbnail-preview/thumbnails/1v500k.jpg", channelIcon: "/images/thumbnail-preview/icons/mrbeast.jpg" },
    { title: "Survive 100 Days In Nuclear Bunker, Win $500,000", channel: "MrBeast", views: "229M views", timeAgo: "4 months ago", duration: "32:20", thumbnail: "/images/thumbnail-preview/thumbnails/100-days-500k.jpg", channelIcon: "/images/thumbnail-preview/icons/mrbeast.jpg" },
    { title: "I Spent 7 Days In Solitary Confinement", channel: "MrBeast", views: "193M views", timeAgo: "11 months ago", duration: "20:15", thumbnail: "/images/thumbnail-preview/thumbnails/7-days-confinement.jpg", channelIcon: "/images/thumbnail-preview/icons/mrbeast.jpg" },
    { title: "I Saved 100 Dogs From Dying", channel: "MrBeast", views: "248M views", timeAgo: "11 months ago", duration: "15:02", thumbnail: "/images/thumbnail-preview/thumbnails/save-dogs.jpg", channelIcon: "/images/thumbnail-preview/icons/mrbeast.jpg" },
    { title: "I Trolled The BBC With My Lookalike", channel: "Logan Paul", views: "504K views", timeAgo: "2 weeks ago", duration: "7:46", thumbnail: "/images/thumbnail-preview/thumbnails/troll-bbc.jpg", channelIcon: "/images/thumbnail-preview/icons/loganpaul.jpg" },
    { title: "I Almost Killed KSI & MrBeast In India 🇮🇳", channel: "Logan Paul", views: "589K views", timeAgo: "5 days ago", duration: "7:46", thumbnail: "/images/thumbnail-preview/thumbnails/logan-ksi-beast.jpg", channelIcon: "/images/thumbnail-preview/icons/loganpaul.jpg" },
    { title: "I Challenged The World's #1 Tetris Player (He's 14)", channel: "Logan Paul", views: "1.2M views", timeAgo: "5 months ago", duration: "15:31", thumbnail: "/images/thumbnail-preview/thumbnails/tetris-challenge.jpg", channelIcon: "/images/thumbnail-preview/icons/loganpaul.jpg" },
    { title: "I Tried Every Seat on the Most Expensive Airline", channel: "Ryan Trahan", views: "38M views", timeAgo: "6 months ago", duration: "25:22", thumbnail: "/images/thumbnail-preview/thumbnails/expensive-airline.jpg", channelIcon: "/images/thumbnail-preview/icons/ryantrahan.jpg" },
    { title: "I Survived the World's Loudest Room", channel: "Ryan Trahan", views: "33M views", timeAgo: "3 years ago", duration: "8:00", thumbnail: "/images/thumbnail-preview/thumbnails/loudest-room.jpg", channelIcon: "/images/thumbnail-preview/icons/ryantrahan.jpg" },
    { title: "Overnight in the World's Oldest Underwater Hotel", channel: "Ryan Trahan", views: "32M views", timeAgo: "3 years ago", duration: "12:07", thumbnail: "/images/thumbnail-preview/thumbnails/underwater-hotel.jpg", channelIcon: "/images/thumbnail-preview/icons/ryantrahan.jpg" },
    { title: "I Made A $100,000 Escape Room!!", channel: "Chris Ramsay", views: "2.3M views", timeAgo: "2 years ago", duration: "50:50", thumbnail: "/images/thumbnail-preview/thumbnails/100k-escape-room.jpg", channelIcon: "/images/thumbnail-preview/icons/chrisramsay.jpg" },
];

type ViewportMode = 'desktop' | 'tablet' | 'mobile';

/** Pick 8 random videos for the preview grid: no duplicates, max 2 per channel. */
function pickRandomPreviewVideos(): VideoData[] {
    const shuffled = [...allVideosData].sort(() => Math.random() - 0.5);
    const result: VideoData[] = [];
    const channelCount: Record<string, number> = {};
    for (const video of shuffled) {
        if (result.length >= 8) break;
        const count = channelCount[video.channel] ?? 0;
        if (count >= 2) continue;
        result.push(video);
        channelCount[video.channel] = count + 1;
    }
    return result;
}

type GridItem = {
    title: string;
    channel: string;
    imageUrl: string;
    isUser: boolean;
    duration?: string;
    views?: string;
    timeAgo?: string;
    channelIcon?: string;
};

export default function ThumbnailTesterPage() {
    const tenantRouter = useTenantRouter();
    const breadcrumbs = getBreadcrumbs(tenantRouter.route('creator.index'));
    const [title, setTitle] = useState('');
    const [channelName, setChannelName] = useState('');
    const [thumbnailDataUrl, setThumbnailDataUrl] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [userThumbnailIndex, setUserThumbnailIndex] = useState(4);
    const [highlightYours, setHighlightYours] = useState(false);
    const [viewportMode, setViewportMode] = useState<ViewportMode>('desktop');
    const [selectedPreviewVideos, setSelectedPreviewVideos] = useState<VideoData[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const youtubeMockRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    const handleFullscreen = () => {
        if (!youtubeMockRef.current) return;
        if (isFullscreen) {
            document.exitFullscreen();
        } else {
            youtubeMockRef.current.requestFullscreen();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = () => setThumbnailDataUrl(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handlePreview = () => {
        if (!title.trim() || !channelName.trim() || !thumbnailDataUrl) return;
        setSelectedPreviewVideos(pickRandomPreviewVideos());
        setShowPreview(true);
    };

    const handleTryAnother = () => {
        setShowPreview(false);
        setThumbnailDataUrl(null);
        setTitle('');
        setChannelName('');
        setUserThumbnailIndex(4);
        setHighlightYours(false);
        setViewportMode('desktop');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleEdit = () => {
        setShowPreview(false);
        // Keep title, channelName, thumbnailDataUrl so the form is pre-filled
    };

    const handleRandomizePosition = () => {
        setSelectedPreviewVideos(pickRandomPreviewVideos());
        setUserThumbnailIndex(Math.floor(Math.random() * 9));
    };

    // Build grid: 8 selected (random, max 2 per channel) + user's at userThumbnailIndex (0–8) = 9 total
    const otherVideos = selectedPreviewVideos;
    const gridItems: GridItem[] = otherVideos.map((video) => ({
        title: video.title,
        channel: video.channel,
        imageUrl: video.thumbnail,
        isUser: false,
        duration: video.duration,
        views: video.views,
        timeAgo: video.timeAgo,
        channelIcon: video.channelIcon,
    }));
    gridItems.splice(userThumbnailIndex, 0, {
        title,
        channel: channelName,
        imageUrl: thumbnailDataUrl ?? '',
        isUser: true,
        duration: '11:02',
        views: '85K views',
        timeAgo: '5 days ago',
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Thumbnail Tester - Creator" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {!showPreview ? (
                    <>
                        <div className="flex items-center gap-2">
                            <Link
                                href={tenantRouter.route('creator.index')}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                            <h1 className="text-2xl font-semibold">Thumbnail Tester</h1>
                        </div>
                        <Card className="max-w-xl">
                            <CardHeader>
                                <CardTitle>See how your thumbnail stands out</CardTitle>
                                <CardDescription>
                                    Enter your video title and channel, then choose a thumbnail image. We&apos;ll show it
                                    alongside other thumbnails so you can compare. Nothing is saved or uploaded.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Video title</Label>
                                    <Input
                                        id="title"
                                        placeholder="e.g. 10 Tips That Changed My Editing Forever"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="channel">Channel name</Label>
                                    <Input
                                        id="channel"
                                        placeholder="e.g. Your Channel Name"
                                        value={channelName}
                                        onChange={(e) => setChannelName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Thumbnail image</Label>
                                    <div className="flex items-center gap-3">
                                        <Input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="cursor-pointer file:mr-2 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground"
                                        />
                                        {thumbnailDataUrl && (
                                            <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded border bg-muted">
                                                <img
                                                    src={thumbnailDataUrl}
                                                    alt="Chosen thumbnail"
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Image is only used on this page and is not uploaded or stored.
                                    </p>
                                </div>
                                <Button
                                    onClick={handlePreview}
                                    disabled={!title.trim() || !channelName.trim() || !thumbnailDataUrl}
                                    className="w-full sm:w-auto"
                                >
                                    <ImageIcon className="mr-2 h-4 w-4" />
                                    See how it looks
                                </Button>
                            </CardContent>
                        </Card>
                    </>
                ) : (
                    <>
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={handleTryAnother} className="shrink-0">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <p className="text-sm text-muted-foreground">
                                Your thumbnail is in the grid below (marked &quot;Yours&quot;). Try another to compare.
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRandomizePosition}
                                className="shrink-0"
                                title="Randomize position"
                            >
                                <Shuffle className="mr-1.5 h-4 w-4" />
                                Randomize position
                            </Button>
                            <Button
                                variant={highlightYours ? 'secondary' : 'outline'}
                                size="sm"
                                onClick={() => setHighlightYours((v) => !v)}
                                className="shrink-0"
                                title="Toggle highlight on your thumbnail"
                            >
                                <Highlighter className="mr-1.5 h-4 w-4" />
                                {highlightYours ? 'Highlight on' : 'Highlight off'}
                            </Button>
                            <div className="flex shrink-0 items-center gap-0.5 rounded-md border border-border p-0.5" role="group" aria-label="Viewport mode">
                                <Button
                                    variant={viewportMode === 'desktop' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewportMode('desktop')}
                                    className="h-8 px-2"
                                    title="Desktop"
                                >
                                    <Monitor className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant={viewportMode === 'tablet' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewportMode('tablet')}
                                    className="h-8 px-2"
                                    title="Tablet"
                                >
                                    <Tablet className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant={viewportMode === 'mobile' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewportMode('mobile')}
                                    className="h-8 px-2"
                                    title="Mobile"
                                >
                                    <Smartphone className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="ml-auto flex shrink-0 gap-2">
                                <Button variant="outline" size="sm" onClick={handleEdit} title="Edit title, thumbnail and channel">
                                    <Pencil className="mr-1.5 h-4 w-4" />
                                    Edit
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleTryAnother}>
                                    Try another
                                </Button>
                            </div>
                        </div>
                        {/* Wrapper constrains width for tablet/mobile; YouTube mock inside */}
                        <div
                            className={`mx-auto w-full transition-[max-width] duration-200 ${viewportMode === 'desktop' ? 'max-w-full' : viewportMode === 'tablet' ? 'max-w-[768px]' : 'max-w-[390px]'}`}
                        >
                        {/* YouTube-style mock: theme-aware, can go fullscreen */}
                        <div
                            ref={youtubeMockRef}
                            className="flex min-h-[480px] flex-col overflow-hidden rounded-xl border border-border bg-background shadow-2xl [&:fullscreen]:min-h-screen [&:fullscreen]:rounded-none"
                        >
                            {/* YouTube top bar */}
                            <header className="flex h-14 items-center gap-4 border-b border-border bg-muted/80 px-4">
                                <button type="button" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground hover:bg-muted">
                                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
                                    </svg>
                                </button>
                                <a href="#" className="flex items-center gap-1 text-xl font-bold text-foreground" onClick={(e) => e.preventDefault()}>
                                    <span className="flex h-9 w-9 items-center justify-center rounded bg-red-600 text-[10px] font-bold text-white">Y</span>
                                    <span className="hidden sm:inline">outube</span>
                                </a>
                                <div className="min-w-0 flex-1 max-w-2xl">
                                    <div className="flex rounded-l-full rounded-r-full border border-border bg-background">
                                        <input
                                            type="text"
                                            placeholder="Search"
                                            readOnly
                                            className="h-9 flex-1 rounded-l-full bg-transparent px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none"
                                        />
                                        <div className="flex w-14 items-center justify-center border-l border-border bg-muted/50 rounded-r-full">
                                            <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleFullscreen}
                                        className="h-9 w-9 text-muted-foreground hover:text-foreground"
                                        title={isFullscreen ? 'Exit full screen' : 'Full screen'}
                                    >
                                        {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                                    </Button>
                                    <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-xs font-medium text-primary-foreground">O</div>
                                </div>
                            </header>
                            <div className="flex min-h-0 flex-1">
                                {/* Left sidebar (collapsed style) */}
                                <aside className="flex w-16 shrink-0 flex-col border-r border-border bg-muted/80 py-2">
                                    {[
                                        { icon: '🏠', label: 'Home' },
                                        { icon: '▶️', label: 'Shorts' },
                                        { icon: '📋', label: 'Subscriptions' },
                                        { icon: '📚', label: 'Library' },
                                    ].map((item) => (
                                        <button
                                            key={item.label}
                                            type="button"
                                            className="flex flex-col items-center gap-1 py-2 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground"
                                        >
                                            <span className="text-lg">{item.icon}</span>
                                            <span className="line-clamp-1">{item.label}</span>
                                        </button>
                                    ))}
                                </aside>
                                {/* Main: columns depend on viewport mode – scrollable when in fullscreen */}
                                <main className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4 bg-background">
                                    <div
                                        className={`grid gap-x-4 gap-y-6 ${
                                            viewportMode === 'desktop'
                                                ? 'grid-cols-3'
                                                : viewportMode === 'tablet'
                                                  ? 'grid-cols-2'
                                                  : 'grid-cols-1'
                                        }`}
                                    >
                                        {gridItems.map((item, index) => (
                                            <div
                                                key={item.isUser ? 'yours' : index}
                                                className={`group cursor-pointer rounded-xl transition-shadow ${item.isUser && highlightYours ? 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg' : ''}`}
                                            >
                                                <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted">
                                                    <img
                                                        src={item.imageUrl}
                                                        alt={item.isUser ? 'Your thumbnail' : item.title}
                                                        className="h-full w-full object-cover transition group-hover:opacity-95"
                                                    />
                                                    {item.isUser && (
                                                        <span className="absolute right-2 top-2 rounded bg-red-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                                                            Yours
                                                        </span>
                                                    )}
                                                    {item.duration && (
                                                        <span className="absolute bottom-1.5 right-1.5 rounded bg-black/85 px-1.5 py-0.5 text-[11px] font-medium text-white">
                                                            {item.duration}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-2 flex gap-3">
                                                    {item.isUser ? (
                                                        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-red-600/80" />
                                                    ) : item.channelIcon ? (
                                                        <img
                                                            src={item.channelIcon}
                                                            alt=""
                                                            className="h-9 w-9 shrink-0 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-muted" />
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="line-clamp-2 text-sm font-medium text-foreground [word-break:break-word]">
                                                            {item.title || 'Your video title'}
                                                        </h3>
                                                        <p className="mt-0.5 text-xs text-muted-foreground">{item.channel || 'Your channel'}</p>
                                                        {(item.views || item.timeAgo) && (
                                                            <p className="text-xs text-muted-foreground">
                                                                {[item.views, item.timeAgo].filter(Boolean).join(' • ')}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </main>
                            </div>
                        </div>
                        </div>
                    </>
                )}
            </div>
        </AppLayout>
    );
}
