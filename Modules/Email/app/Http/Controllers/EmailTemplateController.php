<?php

namespace Modules\Email\Http\Controllers;

use Modules\Email\Models\EmailTemplate;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Http\Controllers\Controller;
class EmailTemplateController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $templates = EmailTemplate::latest()->get();
        $types = EmailTemplate::getTypes();
        $placeholders = EmailTemplate::getDefaultPlaceholders();

        return Inertia::render('emails/index', [
            'templates' => $templates,
            'types' => $types,
            'placeholders' => $placeholders,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $types = EmailTemplate::getTypes();
        $placeholders = EmailTemplate::getDefaultPlaceholders();

        return Inertia::render('emails/create', [
            'types' => $types,
            'placeholders' => $placeholders,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'subject' => 'required|string|max:255',
            'content' => 'required|string',
            'type' => 'required|string|in:' . implode(',', array_keys(EmailTemplate::getTypes())),
            'placeholders' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        EmailTemplate::create($validated);

        return redirect()->route('email-templates.index')
            ->with('success', 'Email template created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(EmailTemplate $emailTemplate)
    {
        $types = EmailTemplate::getTypes();
        $placeholders = EmailTemplate::getDefaultPlaceholders();

        return Inertia::render('emails/edit', [
            'template' => $emailTemplate,
            'types' => $types,
            'placeholders' => $placeholders,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, EmailTemplate $emailTemplate)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'subject' => 'required|string|max:255',
            'content' => 'required|string',
            'type' => 'required|string|in:' . implode(',', array_keys(EmailTemplate::getTypes())),
            'placeholders' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        $emailTemplate->update($validated);

        return redirect()->route('email-templates.index')
            ->with('success', 'Email template updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(EmailTemplate $emailTemplate)
    {
        $emailTemplate->delete();

        return redirect()->route('email-templates.index')
            ->with('success', 'Email template deleted successfully.');
    }

    public function toggleStatus(EmailTemplate $emailTemplate)
    {
        $emailTemplate->update(['is_active' => !$emailTemplate->is_active]);

        return redirect()->route('email-templates.index')
            ->with('success', 'Email template status updated successfully.');
    }
}
