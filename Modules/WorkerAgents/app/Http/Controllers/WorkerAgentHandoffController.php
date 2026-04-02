<?php

declare(strict_types=1);

namespace Modules\WorkerAgents\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Modules\HR\Models\Task;
use Modules\WorkerAgents\Models\WorkerAgent;
use Modules\WorkerAgents\Models\WorkerAgentHandoff;
use Modules\WorkerAgents\Models\WorkerAgentMessage;
use Modules\WorkerAgents\Support\WorkerAgentHandoffStatus;
use Modules\WorkerAgents\Support\WorkerAgentMessageRole;

class WorkerAgentHandoffController extends Controller
{
    public function accept(WorkerAgent $worker_agent, WorkerAgentHandoff $handoff): RedirectResponse
    {
        $this->assertHandoffTarget($worker_agent, $handoff);

        if ($handoff->status !== WorkerAgentHandoffStatus::Pending) {
            return redirect()->back()->with('error', 'This handoff is no longer pending.');
        }

        DB::transaction(function () use ($handoff, $worker_agent): void {
            if ($handoff->hr_task_id !== null) {
                $task = Task::query()
                    ->where('tenant_id', $handoff->tenant_id)
                    ->whereKey($handoff->hr_task_id)
                    ->first();
                if ($task !== null && $worker_agent->staff_id !== null) {
                    $task->update(['assigned_to' => $worker_agent->staff_id]);
                }
            }

            $handoff->update([
                'status' => WorkerAgentHandoffStatus::Accepted,
                'resolved_by_user_id' => auth()->id(),
                'resolved_at' => now(),
            ]);

            WorkerAgentMessage::query()->create([
                'tenant_id' => $worker_agent->tenant_id,
                'worker_agent_id' => $worker_agent->id,
                'worker_agent_run_id' => $handoff->worker_agent_run_id,
                'role' => WorkerAgentMessageRole::Handoff,
                'user_id' => auth()->id(),
                'body' => 'Handoff accepted.',
                'metadata' => ['handoff_uuid' => $handoff->uuid],
            ]);
        });

        return redirect()->back()->with('success', 'Handoff accepted.');
    }

    public function decline(Request $request, WorkerAgent $worker_agent, WorkerAgentHandoff $handoff): RedirectResponse
    {
        $this->assertHandoffTarget($worker_agent, $handoff);

        if ($handoff->status !== WorkerAgentHandoffStatus::Pending) {
            return redirect()->back()->with('error', 'This handoff is no longer pending.');
        }

        $validated = $request->validate([
            'note' => ['nullable', 'string', 'max:2000'],
        ]);

        DB::transaction(function () use ($handoff, $worker_agent, $validated): void {
            $handoff->update([
                'status' => WorkerAgentHandoffStatus::Declined,
                'resolved_by_user_id' => auth()->id(),
                'resolved_at' => now(),
            ]);

            $note = isset($validated['note']) ? trim((string) $validated['note']) : '';
            if ($note !== '') {
                WorkerAgentMessage::query()->create([
                    'tenant_id' => $worker_agent->tenant_id,
                    'worker_agent_id' => $worker_agent->id,
                    'worker_agent_run_id' => $handoff->worker_agent_run_id,
                    'role' => WorkerAgentMessageRole::Human,
                    'user_id' => auth()->id(),
                    'body' => 'Handoff declined. Note: '.$note,
                    'metadata' => ['handoff_uuid' => $handoff->uuid],
                ]);
            }
        });

        return redirect()->back()->with('success', 'Handoff declined.');
    }

    private function assertHandoffTarget(WorkerAgent $worker_agent, WorkerAgentHandoff $handoff): void
    {
        if ((string) $handoff->tenant_id !== (string) tenant('id')) {
            abort(404);
        }

        if ($handoff->to_worker_agent_id !== $worker_agent->id) {
            abort(404);
        }
    }
}
