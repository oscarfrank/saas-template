import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import { Link } from '@inertiajs/react';
import { ChevronDown, Settings } from 'lucide-react';

const EXTRA_BY_AGENT: Record<string, { label: string; route: string }[]> = {
    pulse: [
        { label: 'Feeds & digest', route: 'cortex.agents.pulse.settings' },
        { label: 'Manage feeds', route: 'cortex.agents.pulse.feeds' },
    ],
    mirage: [{ label: 'Image generation', route: 'cortex.agents.mirage.settings' }],
};

type Props = {
    /** Matches `CortexAgentKey` / agent registry id (e.g. `pulse`, `youtube-video`). */
    agentKey: string;
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'default' | 'sm' | 'icon';
    className?: string;
    /** If true, show a gear-only control (good for dense headers). Default: true. */
    iconOnly?: boolean;
};

export function CortexAgentSettingsMenu({ agentKey, variant = 'outline', size = 'icon', className, iconOnly = true }: Props) {
    const tenantRouter = useTenantRouter();
    const extras = EXTRA_BY_AGENT[agentKey] ?? [];

    const agentSettingsHref = tenantRouter.route('cortex.agents.agent_settings.show', { agent: agentKey });

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant={variant}
                    size={iconOnly ? 'icon' : size}
                    className={className}
                    aria-label="Open settings menu"
                >
                    {iconOnly ? (
                        <Settings className="size-4" />
                    ) : (
                        <>
                            <Settings className="size-4" />
                            <span className="hidden sm:inline">Settings</span>
                            <ChevronDown className="text-muted-foreground size-3.5 opacity-70 sm:inline" aria-hidden />
                        </>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Settings</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                    <Link href={agentSettingsHref}>Agent settings</Link>
                </DropdownMenuItem>
                {extras.length > 0 && <DropdownMenuSeparator />}
                {extras.map((item) => (
                    <DropdownMenuItem key={item.route} asChild>
                        <Link href={tenantRouter.route(item.route)}>{item.label}</Link>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
