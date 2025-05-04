<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\TicketReply;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class TicketController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request)
    {
        $query = Ticket::with(['user', 'assignedTo', 'replies'])
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('subject', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when($request->status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($request->priority, function ($query, $priority) {
                $query->where('priority', $priority);
            })
            ->when($request->category, function ($query, $category) {
                $query->where('category', $category);
            });

        if (!Auth::user()->hasRole('admin')) {
            $query->where('user_id', Auth::id());
        }

        $tickets = $query->latest()->paginate(10);

        return Inertia::render('tickets/index', [
            'tickets' => $tickets,
            'filters' => $request->only(['search', 'status', 'priority', 'category']),
        ]);
    }

    public function create()
    {
        return Inertia::render('tickets/create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'subject' => 'required|string|max:255',
            'description' => 'required|string',
            'priority' => 'required|in:low,medium,high,urgent',
            'category' => 'required|in:technical,billing,account,general',
        ]);

        $ticket = Ticket::create([
            ...$validated,
            'user_id' => Auth::id(),
            'status' => 'open',
        ]);

        return redirect()->route('admin.tickets.show', $ticket)
            ->with('success', 'Ticket created successfully.');
    }

    public function show(Ticket $ticket)
    {
        $this->authorize('view', $ticket);

        $ticket->load(['user', 'assignedTo', 'replies.user']);

        return Inertia::render('tickets/show', [
            'ticket' => $ticket,
        ]);
    }

    public function edit(Ticket $ticket)
    {
        $this->authorize('update', $ticket);

        return Inertia::render('tickets/edit', [
            'ticket' => $ticket,
        ]);
    }

    public function update(Request $request, Ticket $ticket)
    {
        $this->authorize('update', $ticket);

        // If only status is being updated
        if ($request->has('status') && count($request->all()) === 1) {
            $validated = $request->validate([
                'status' => 'required|in:open,in_progress,resolved,closed',
            ]);

            $ticket->update($validated);

            return redirect()->back()
                ->with('success', 'Ticket status updated successfully.');
        }

        // Full update with all fields
        $validated = $request->validate([
            'subject' => 'required|string|max:255',
            'description' => 'required|string',
            'status' => 'required|in:open,in_progress,resolved,closed',
            'priority' => 'required|in:low,medium,high,urgent',
            'category' => 'required|in:technical,billing,account,general',
            'assigned_to' => 'nullable|exists:users,id',
        ]);

        $ticket->update($validated);

        return redirect()->route('admin.tickets.show', $ticket)
            ->with('success', 'Ticket updated successfully.');
    }

    public function destroy(Ticket $ticket)
    {
        $this->authorize('delete', $ticket);

        $ticket->delete();

        return redirect()->route('admin.tickets.index')
            ->with('success', 'Ticket deleted successfully.');
    }

    public function reply(Request $request, Ticket $ticket)
    {
        $this->authorize('view', $ticket);

        $validated = $request->validate([
            'message' => 'required|string',
            'is_internal' => 'boolean',
        ]);

        $reply = $ticket->replies()->create([
            ...$validated,
            'user_id' => Auth::id(),
        ]);

        $ticket->update(['last_reply_at' => now()]);

        return redirect()->route('admin.tickets.show', $ticket)
            ->with('success', 'Reply added successfully.');
    }

    public function export()
    {
        $tickets = Ticket::with(['user', 'assignedTo'])
            ->when(!Auth::user()->hasRole('admin'), function ($query) {
                $query->where('user_id', Auth::id());
            })
            ->get();

        return response()->streamDownload(function () use ($tickets) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['ID', 'Subject', 'Status', 'Priority', 'Category', 'Created At', 'Last Reply']);

            foreach ($tickets as $ticket) {
                fputcsv($handle, [
                    $ticket->id,
                    $ticket->subject,
                    $ticket->status,
                    $ticket->priority,
                    $ticket->category,
                    $ticket->created_at,
                    $ticket->last_reply_at,
                ]);
            }

            fclose($handle);
        }, 'tickets.csv');
    }

    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:tickets,id',
        ]);

        $tickets = Ticket::whereIn('id', $request->ids)
            ->when(!Auth::user()->hasRole('admin'), function ($query) {
                $query->where('user_id', Auth::id());
            })
            ->get();

        foreach ($tickets as $ticket) {
            $ticket->delete();
        }

        return redirect()->route('admin.tickets.index')
            ->with('success', 'Selected tickets deleted successfully.');
    }

    public function userTickets(Request $request)
    {
        $tickets = Ticket::where('user_id', auth()->id())
            ->with(['user', 'assignedTo'])
            ->latest()
            ->paginate(10);

        return Inertia::render('tickets/user-tickets', [
            'tickets' => $tickets,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function userShow(Ticket $ticket)
    {
        // Ensure the ticket belongs to the authenticated user
        if ($ticket->user_id !== auth()->id()) {
            // abort(403, 'Unauthorized action.');
            return redirect()->route('tickets.user');
        }

        $ticket->load(['user', 'assignedTo', 'replies.user']);

        return Inertia::render('tickets/user-show', [
            'ticket' => $ticket,
        ]);
    }
} 