<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Modules\WorkerAgents\Http\Controllers\WorkerAgentController;
use Modules\WorkerAgents\Http\Controllers\WorkerAgentDemoChainController;
use Modules\WorkerAgents\Http\Controllers\WorkerAgentHandoffController;
use Modules\WorkerAgents\Http\Controllers\WorkerAgentProposalController;
use Stancl\Tenancy\Middleware\InitializeTenancyByPath;

Route::middleware([
    'auth',
    'verified',
    'track.last.visited',
    InitializeTenancyByPath::class,
    'ensure.tenant.access',
])->prefix('{tenant}')->group(function () {
    Route::get('worker-agents/demo-chain', [WorkerAgentDemoChainController::class, 'show'])->name('worker-agents.demo-chain');
    Route::post('worker-agents/demo-chain', [WorkerAgentDemoChainController::class, 'store'])->name('worker-agents.demo-chain.store');

    Route::get('worker-agents/proposals', [WorkerAgentProposalController::class, 'index'])->name('worker-agents.proposals.index');
    Route::post('worker-agents/proposals/{proposal}/approve', [WorkerAgentProposalController::class, 'approve'])->name('worker-agents.proposals.approve');
    Route::post('worker-agents/proposals/{proposal}/reject', [WorkerAgentProposalController::class, 'reject'])->name('worker-agents.proposals.reject');

    Route::get('worker-agents', [WorkerAgentController::class, 'index'])->name('worker-agents.index');
    Route::get('worker-agents/create', [WorkerAgentController::class, 'create'])->name('worker-agents.create');
    Route::post('worker-agents', [WorkerAgentController::class, 'store'])->name('worker-agents.store');
    Route::get('worker-agents/{worker_agent}', [WorkerAgentController::class, 'show'])->name('worker-agents.show');
    Route::get('worker-agents/{worker_agent}/edit', [WorkerAgentController::class, 'edit'])->name('worker-agents.edit');
    Route::put('worker-agents/{worker_agent}', [WorkerAgentController::class, 'update'])->name('worker-agents.update');
    Route::delete('worker-agents/{worker_agent}', [WorkerAgentController::class, 'destroy'])->name('worker-agents.destroy');
    Route::patch('worker-agents/{worker_agent}/pause', [WorkerAgentController::class, 'pause'])->name('worker-agents.pause');
    Route::patch('worker-agents/{worker_agent}/resume', [WorkerAgentController::class, 'resume'])->name('worker-agents.resume');
    Route::post('worker-agents/{worker_agent}/run', [WorkerAgentController::class, 'runNow'])->name('worker-agents.run');
    Route::post('worker-agents/{worker_agent}/memories', [WorkerAgentController::class, 'storeMemory'])->name('worker-agents.memories.store');
    Route::delete('worker-agents/{worker_agent}/memories/{memory_uuid}', [WorkerAgentController::class, 'destroyMemory'])->name('worker-agents.memories.destroy');
    Route::post('worker-agents/{worker_agent}/handoffs/{handoff}/accept', [WorkerAgentHandoffController::class, 'accept'])->name('worker-agents.handoffs.accept');
    Route::post('worker-agents/{worker_agent}/handoffs/{handoff}/decline', [WorkerAgentHandoffController::class, 'decline'])->name('worker-agents.handoffs.decline');
});
