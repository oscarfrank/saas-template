import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';
import {
    User,
    Key,
    Shield,
    Settings,
    Link as LinkIcon,
    Palette,
    CreditCard,
    Building2,
    Users,
    LayoutGrid,
    UserPlus,
    KeyRound,
    Webhook,
    History,
} from 'lucide-react';

interface SettingsGroup {
    title: string;
    items: NavItem[];
}

const settingsGroups: SettingsGroup[] = [
    {
        title: 'User Settings',
        items: [
            {
                title: 'Profile',
                href: '/settings/profile',
                icon: User,
            },
            {
                title: 'Password',
                href: '/settings/password',
                icon: Key,
            },
            {
                title: 'Two Factor Authentication',
                href: '/settings/two-factor-auth',
                icon: Shield,
            },
            {
                title: 'Preferences',
                href: '/settings/preferences',
                icon: Settings,
            },
            {
                title: 'Connections',
                href: '/settings/connections',
                icon: LinkIcon,
            },
            {
                title: 'Billing',
                href: '/settings/billing',
                icon: CreditCard,
            },
        ],
    },
    {
        title: 'Organization',
        items: [
            {
                title: 'General',
                href: '/settings/organization/general',
                icon: Building2,
            },
            {
                title: 'People',
                href: '/settings/organization/people',
                icon: Users,
            },
            {
                title: 'Teamspaces',
                href: '/settings/organization/teamspaces',
                icon: LayoutGrid,
            },
            {
                title: 'Invites',
                href: '/settings/organization/invites',
                icon: UserPlus,
            },
        ],
    },
    {
        title: 'Other',
        items: [
            {
                title: 'API Keys',
                href: '/settings/api-keys',
                icon: KeyRound,
            },
            {
                title: 'Webhooks',
                href: '/settings/webhooks',
                icon: Webhook,
            },
            {
                title: 'Audit Logs',
                href: '/settings/audit-logs',
                icon: History,
            },
        ],
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    // When server-side rendering, we only render the layout on the client...
    if (typeof window === 'undefined') {
        return null;
    }

    const currentPath = window.location.pathname;

    return (
        <div className="min-h-[calc(100vh-4rem)] px-4 py-6">
            <Heading title="Settings" description="Manage your profile and account settings" />

            <div className="flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12">
                <aside className="w-full max-w-xl lg:w-64">
                    <nav className="flex flex-col space-y-6 overflow-y-auto max-h-[calc(100vh-12rem)] pr-2">
                        {settingsGroups.map((group, groupIndex) => (
                            <div key={group.title} className="space-y-2">
                                <h4 className="text-sm font-medium text-muted-foreground">
                                    {group.title}
                                </h4>
                                <div className="flex flex-col space-y-1">
                                    {group.items.map((item, index) => (
                                        <Button
                                            key={`${item.href}-${index}`}
                                            size="sm"
                                            variant="ghost"
                                            asChild
                                            className={cn('w-full justify-start', {
                                                'bg-muted': currentPath === item.href,
                                            })}
                                        >
                                            <Link href={item.href} prefetch>
                                                {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                                                {item.title}
                                            </Link>
                                        </Button>
                                    ))}
                                </div>
                                {groupIndex < settingsGroups.length - 1 && (
                                    <Separator className="my-4" />
                                )}
                            </div>
                        ))}
                    </nav>
                </aside>

                <Separator className="my-6 md:hidden" />

                <div className="flex-1 md:max-w-2xl">
                    <section className="max-w-xl space-y-12 overflow-y-auto max-h-[calc(100vh-12rem)] pr-2">
                        {children}
                    </section>
                </div>
            </div>
        </div>
    );
}
