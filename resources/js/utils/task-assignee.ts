/**
 * HR tasks may be assigned to human staff (user linked) or digital workers (kind=agent, no user).
 */
export type TaskAssigneeLike = {
    id?: number;
    kind?: string | null;
    employee_id?: string | null;
    job_title?: string | null;
    user?: { first_name?: string; last_name?: string; email?: string } | null;
} | null | undefined;

export function formatTaskAssigneeLabel(assignee: TaskAssigneeLike): string {
    if (!assignee) {
        return '—';
    }
    if (assignee.user) {
        const name = `${assignee.user.first_name ?? ''} ${assignee.user.last_name ?? ''}`.trim();
        if (name !== '') {
            return name;
        }
    }
    if (assignee.kind === 'agent') {
        const label = assignee.job_title?.trim() || 'Digital worker';
        return assignee.employee_id ? `${label} (${assignee.employee_id})` : label;
    }
    if (assignee.employee_id) {
        return `Staff ${assignee.employee_id}`;
    }
    return assignee.id != null ? `Staff #${assignee.id}` : '—';
}
