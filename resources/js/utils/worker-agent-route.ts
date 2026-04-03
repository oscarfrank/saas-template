/** Segments under `worker-agents/` that are not a worker UUID. */
const RESERVED_SEGMENTS = new Set(['create', 'proposals']);

/**
 * Resolve the `worker_agent` route parameter for Ziggy. Prefer `worker.uuid` from Inertia;
 * if missing, parse the current path (edit and show URLs include the key).
 */
export function resolveWorkerAgentRouteParam(worker: { uuid?: string | null }, pageUrl: string): string | null {
    if (typeof worker.uuid === 'string' && worker.uuid.length > 0) {
        return worker.uuid;
    }

    const edit = pageUrl.match(/\/worker-agents\/([^/]+)\/edit(?:\?|#|$|\/)/);
    if (edit?.[1]) {
        return edit[1];
    }

    const seg = pageUrl.match(/\/worker-agents\/([^/?#]+)/);
    if (seg?.[1] && !RESERVED_SEGMENTS.has(seg[1])) {
        return seg[1];
    }

    return null;
}
