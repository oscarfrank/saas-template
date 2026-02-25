import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusStyles: Record<string, string> = {
    available:
        'border-emerald-500/35 bg-emerald-500/15 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40',
    assigned:
        'border-blue-500/35 bg-blue-500/15 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/40',
    in_use:
        'border-sky-500/35 bg-sky-500/15 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/40',
    in_maintenance:
        'border-amber-500/35 bg-amber-500/15 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40',
    available_for_sale:
        'border-teal-500/35 bg-teal-500/15 text-teal-800 dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/40',
    sold:
        'border-slate-400/35 bg-slate-500/15 text-slate-700 dark:bg-slate-500/25 dark:text-slate-300 dark:border-slate-500/40',
    gifted:
        'border-slate-400/35 bg-slate-500/15 text-slate-700 dark:bg-slate-500/25 dark:text-slate-300 dark:border-slate-500/40',
    lost:
        'border-red-500/35 bg-red-500/15 text-red-800 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/40',
    damaged:
        'border-orange-500/35 bg-orange-500/15 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/40',
    retired:
        'border-zinc-400/35 bg-zinc-500/15 text-zinc-700 dark:bg-zinc-500/25 dark:text-zinc-300 dark:border-zinc-500/40',
    disposed:
        'border-zinc-400/35 bg-zinc-500/15 text-zinc-700 dark:bg-zinc-500/25 dark:text-zinc-300 dark:border-zinc-500/40',
};

interface AssetStatusBadgeProps {
    status: string;
    label?: string;
    className?: string;
}

export function AssetStatusBadge({ status, label, className }: AssetStatusBadgeProps) {
    const displayLabel = label ?? status.replace(/_/g, ' ');
    const style = statusStyles[status] ?? 'bg-secondary text-secondary-foreground border-transparent';

    return (
        <Badge
            variant="outline"
            className={cn(style, className)}
        >
            {displayLabel}
        </Badge>
    );
}
