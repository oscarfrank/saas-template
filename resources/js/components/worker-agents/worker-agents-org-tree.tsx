import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import Tree from 'react-d3-tree';
import type { CustomNodeElementProps, RawNodeDatum } from 'react-d3-tree';
import { route } from 'ziggy-js';

export type WorkerAgentHandoffEdge = {
    from_uuid: string;
    to_uuid: string;
    from_name: string;
    to_name: string;
};

interface Props {
    orgChart: RawNodeDatum | null;
    handoffEdges: WorkerAgentHandoffEdge[];
    tenantSlug: string;
}

function OrgNode({ nodeDatum }: Pick<CustomNodeElementProps, 'nodeDatum'>) {
    const isRoot = nodeDatum.attributes?.synthetic_root === true;
    const title = nodeDatum.name;
    const rawJob =
        typeof nodeDatum.attributes?.job_title === 'string' ? nodeDatum.attributes.job_title.trim() : '';
    const displayTitle = title.length > 30 ? `${title.slice(0, 29)}…` : title;
    /** Avoid two identical lines when HR job title matches the worker display name. */
    const showJob =
        rawJob !== '' &&
        rawJob !== '—' &&
        rawJob.toLowerCase() !== title.trim().toLowerCase();
    const displayJob = rawJob.length > 36 ? `${rawJob.slice(0, 35)}…` : rawJob;

    return (
        <g
            className="font-sans antialiased"
            style={{ textRendering: 'geometricPrecision' }}
        >
            <rect
                x={-108}
                y={-36}
                width={216}
                height={72}
                rx={8}
                className="fill-card stroke-border"
                strokeWidth={1}
            />
            <text
                x={0}
                y={showJob && !isRoot ? -10 : isRoot ? -6 : 4}
                textAnchor="middle"
                className="fill-card-foreground text-xs font-medium tracking-tight"
            >
                {displayTitle}
            </text>
            {showJob && !isRoot && (
                <text
                    x={0}
                    y={10}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[10px] leading-tight"
                >
                    {displayJob}
                </text>
            )}
            {isRoot && (
                <text
                    x={0}
                    y={14}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[9px] leading-tight"
                >
                    Reporting tree (HR lines)
                </text>
            )}
        </g>
    );
}

/** Initial zoom so typical orgs fit without manual zoom-out; user can zoom/pan inside. */
const INITIAL_ZOOM = 0.58;

export function WorkerAgentsOrgTree({ orgChart, handoffEdges, tenantSlug }: Props) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const [dim, setDim] = useState({ width: 960, height: 640 });

    useEffect(() => {
        const el = wrapRef.current;
        if (!el) {
            return;
        }
        const update = () => {
            const r = el.getBoundingClientRect();
            const w = Math.max(360, Math.floor(r.width));
            const h = Math.max(520, Math.floor(r.height));
            setDim({ width: w, height: h });
        };
        update();
        const ro = new ResizeObserver(() => {
            requestAnimationFrame(update);
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    if (orgChart === null) {
        return (
            <p className="text-muted-foreground text-sm">
                Add worker agents to see the org chart. Reporting lines come from each seat&apos;s HR manager (staff
                reporting).
            </p>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <p className="text-muted-foreground text-xs">
                Drag to pan, scroll or pinch to zoom. The chart starts zoomed out so the full tree fits more often.
            </p>
            <div
                ref={wrapRef}
                className="border-muted bg-muted/20 w-full rounded-md border"
                style={{
                    height: 'min(78vh, 880px)',
                    minHeight: 520,
                }}
            >
                <Tree
                    data={orgChart}
                    orientation="vertical"
                    pathFunc="step"
                    translate={{ x: dim.width / 2, y: 72 }}
                    dimensions={{ width: dim.width, height: dim.height }}
                    nodeSize={{ x: 240, y: 150 }}
                    separation={{ siblings: 1.05, nonSiblings: 1.1 }}
                    collapsible={false}
                    zoomable
                    draggable
                    zoom={INITIAL_ZOOM}
                    scaleExtent={{ min: 0.15, max: 1.5 }}
                    renderCustomNodeElement={(rd3tProps) => <OrgNode nodeDatum={rd3tProps.nodeDatum} />}
                    onNodeClick={(node) => {
                        const uuid = node.data.attributes?.uuid;
                        const syn = node.data.attributes?.synthetic_root === true;
                        if (typeof uuid !== 'string' || uuid === '' || syn) {
                            return;
                        }
                        router.visit(route('worker-agents.show', { tenant: tenantSlug, worker_agent: uuid }));
                    }}
                />
            </div>
            {handoffEdges.length > 0 && (
                <div className="rounded-md border border-dashed p-4">
                    <p className="text-foreground mb-2 text-sm font-medium">Handoff links (workflow)</p>
                    <p className="text-muted-foreground mb-3 text-xs">
                        These are run-time handoffs between agents — not the same as the reporting tree above. A worker
                        may hand off to others without a direct reporting line.
                    </p>
                    <ul className="divide-y rounded-md border text-sm">
                        {handoffEdges.map((e, i) => (
                            <li key={`${e.from_uuid}-${e.to_uuid}-${i}`} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 px-3 py-2">
                                <span className="font-medium">{e.from_name}</span>
                                <span className="text-muted-foreground">→</span>
                                <span className="font-medium">{e.to_name}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
