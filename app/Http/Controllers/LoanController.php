<?php

namespace App\Http\Controllers;

use App\Models\Loan;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use App\Models\Transaction;
use Illuminate\Support\Str;
use App\Models\User;

class LoanController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $loans = Loan::with(['user', 'currency', 'package', 'customPackage'])
            ->latest()
            ->paginate(10);

        return Inertia::render('loans/index', [
            'loans' => $loans
        ]);
    }

    /**
     * Display a listing of the current user's loans.
     */
    public function userLoans()
    {
        $loans = Loan::with(['user', 'currency', 'package', 'customPackage'])
            ->where('user_id', auth()->id())
            ->latest()
            ->paginate(10);

        return Inertia::render('loans/user-loans', [
            'loans' => $loans
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('loans/create', [
            'users' => \App\Models\User::select('id', 'first_name', 'last_name', 'email')->get(),
            'currencies' => \App\Models\Currency::select('id', 'code', 'symbol')->get(),
            'packages' => \App\Models\LoanPackage::select('id', 'name')->get(),
            'customPackages' => \App\Models\CustomPackage::select('id', 'name')->get(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Check if user's KYC is verified
        if (!auth()->user()->isKycVerified()) {
            return response()->json([
                'error' => 'KYC verification required',
                'message' => 'You need to complete your KYC verification before you can apply for a loan.'
            ], 403);
        }

        $validated = $request->validate([
            'package_id' => 'nullable|exists:loan_packages,id',
            'custom_package_id' => 'nullable|exists:custom_packages,id',
            'amount' => 'required|numeric|min:0',
            'currency_id' => 'required|exists:currencies,id',
            'interest_rate' => 'required|numeric|min:0',
            'interest_type' => 'required|in:simple,compound',
            'interest_calculation' => 'required|in:daily,weekly,monthly,yearly',
            'interest_payment_frequency' => 'required|in:daily,weekly,biweekly,monthly,quarterly,yearly,end_of_term',
            'duration_days' => 'required|integer|min:1',
            'purpose' => 'nullable|string',
        ]);

        // Add user_id from authenticated user
        $validated['user_id'] = auth()->id();
        $validated['reference_number'] = 'LOAN-' . strtoupper(Str::random(8));
        $validated['status'] = 'pending';
        $validated['submitted_at'] = now();

        $loan = Loan::create($validated);

        // Add Activity
        activity()->log('Applied for a Loan', [
            'loan_id' => $loan->id,
            'user_id' => auth()->id(),
            'loan_package_id' => $validated['package_id'],
            'amount' => $validated['amount'],
        ]);

        return redirect()->route('loans.show', $loan)
            ->with('success', 'Loan created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Loan $loan)
    {
        $loan->load([
            'user',
            'currency',
            'documents' => function ($query) {
                $query->with('uploadedBy')
                      ->orderBy('created_at', 'desc');
            },
            'notes' => function ($query) {
                $query->with(['createdBy', 'updatedBy'])
                      ->orderBy('created_at', 'desc');
            }
        ]);
        
        return Inertia::render('loans/show', [
            'loan' => $loan,
            'payment_methods' => \App\Models\PaymentMethod::where('is_active', true)
                ->select('id', 'name', 'method_type')
                ->get()
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Loan $loan)
    {
        $loan->load(['user', 'currency', 'package', 'customPackage']);
        
        return Inertia::render('loans/edit', [
            'loan' => $loan,
            'users' => \App\Models\User::select('id', 'first_name', 'last_name', 'email')->get(),
            'currencies' => \App\Models\Currency::select('id', 'code', 'symbol')->get(),
            'packages' => \App\Models\LoanPackage::select('id', 'name')->get(),
            'customPackages' => \App\Models\CustomPackage::select('id', 'name')->get(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Loan $loan)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'package_id' => 'nullable|exists:loan_packages,id',
            'custom_package_id' => 'nullable|exists:custom_packages,id',
            'amount' => 'required|numeric|min:0',
            'currency_id' => 'required|exists:currencies,id',
            'interest_rate' => 'required|numeric|min:0',
            'interest_type' => 'required|in:simple,compound',
            'interest_calculation' => 'required|in:daily,weekly,monthly,yearly',
            'interest_payment_frequency' => 'required|in:daily,weekly,biweekly,monthly,quarterly,yearly,end_of_term',
            'duration_days' => 'required|integer|min:1',
            'purpose' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'status' => 'required|in:draft,pending_approval,approved,rejected,disbursed,active,in_arrears,defaulted,paid,closed,cancelled',
        ]);

        $loan->update($validated);

        // Add Activity
        activity()
        ->withProperties([
            'loan_id' => $loan->id,
            'user_id' => auth()->id(),
            'affected_user_id' => $validated['user_id'],
            'affected_user_name' => User::find($validated['user_id'])->first_name . ' ' . User::find($validated['user_id'])->last_name
        ])
        ->log('Loan status updated to ' . strtoupper($validated['status']));

        return redirect()->route('loans.show', $loan)
            ->with('success', 'Loan updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Loan $loan)
    {
        $loan->delete();

        return redirect()->route('loans.index')
            ->with('success', 'Loan deleted successfully.');
    }

    /**
     * Get all loans for export
     */
    public function getAllLoans()
    {
        $loans = Loan::with(['user', 'currency', 'package', 'customPackage'])
            ->get();

        return response()->json($loans);
    }

    /**
     * Export loans
     */
    public function export(Request $request)
    {
        $format = $request->input('format', 'csv');
        $loans = Loan::with(['user', 'currency', 'package', 'customPackage'])
            ->get();

        // Handle export based on format
        if ($format === 'csv') {
            // Implement CSV export
            return response()->streamDownload(function () use ($loans) {
                $file = fopen('php://output', 'w');
                fputcsv($file, ['ID', 'Reference', 'Amount', 'Currency', 'Status', 'Created At']);
                
                foreach ($loans as $loan) {
                    fputcsv($file, [
                        $loan->id,
                        $loan->reference_number,
                        $loan->amount,
                        $loan->currency->code,
                        $loan->status,
                        $loan->created_at
                    ]);
                }
                
                fclose($file);
            }, 'loans.csv');
        }

        return response()->json($loans);
    }

    /**
     * Bulk delete loans
     */
    public function bulkDelete(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:loans,id'
        ]);

        Loan::whereIn('id', $validated['ids'])->delete();

        return redirect()->route('loans.index')
            ->with('success', 'Selected loans deleted successfully.');
    }

    /**
     * Bulk archive loans
     */
    public function bulkArchive(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:loans,id'
        ]);

        Loan::whereIn('id', $validated['ids'])->update(['status' => 'closed']);

        return redirect()->route('loans.index')
            ->with('success', 'Selected loans archived successfully.');
    }

    /**
     * Show loan documents
     */
    public function documents(Loan $loan)
    {
        $loan->load(['documents']);
        
        return Inertia::render('loans/documents', [
            'loan' => $loan
        ]);
    }

    /**
     * Upload a document for a loan
     */
    public function uploadDocument(Request $request, Loan $loan)
    {
        $validated = $request->validate([
            'file' => 'required|file|max:10240', // 10MB max
            'type' => 'required|string',
            'description' => 'nullable|string',
        ]);

        $file = $request->file('file');
        $path = $file->store('loan-documents');

        $document = $loan->documents()->create([
            'name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'file_size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
            'type' => $validated['type'],
            'description' => $validated['description'],
            'uploaded_by' => auth()->id(),
        ]);

        return redirect()->back()->with('success', 'Document uploaded successfully.');
    }

    /**
     * Delete a loan document
     */
    public function deleteDocument(Loan $loan, $documentId)
    {
        $document = $loan->documents()->findOrFail($documentId);
        
        // Delete the file from storage
        if ($document->file_path) {
            Storage::delete($document->file_path);
        }
        
        // Delete the document record
        $document->delete();

        return redirect()->back()->with('success', 'Document deleted successfully.');
    }

    /**
     * Show loan notes
     */
    public function notes(Loan $loan)
    {
        $loan->load(['notes.user']);
        
        return Inertia::render('loans/notes', [
            'loan' => $loan
        ]);
    }

    /**
     * Add a note to a loan
     */
    public function addNote(Request $request, Loan $loan)
    {
        $validated = $request->validate([
            'content' => 'required|string',
        ]);

        $note = $loan->notes()->create([
            'content' => $validated['content'],
            'created_by' => auth()->id(),
            'updated_by' => auth()->id(),
        ]);

        return redirect()->back()->with('success', 'Note added successfully.');
    }

    /**
     * Update a loan note
     */
    public function updateNote(Request $request, Loan $loan, $noteId)
    {
        $validated = $request->validate([
            'content' => 'required|string',
        ]);

        $note = $loan->notes()->findOrFail($noteId);
        
        // Check if user has permission to edit this note
        if ($note->created_by !== auth()->id() && !auth()->user()->isAdmin()) {
            return redirect()->back()->with('error', 'You do not have permission to edit this note.');
        }

        $note->update([
            'content' => $validated['content'],
            'updated_by' => auth()->id(),
        ]);

        return redirect()->back()->with('success', 'Note updated successfully.');
    }

    /**
     * Delete a loan note
     */
    public function deleteNote(Loan $loan, $noteId)
    {
        $note = $loan->notes()->findOrFail($noteId);
        $note->delete();

        return redirect()->back()->with('success', 'Note deleted successfully.');
    }

    /**
     * Download a loan document
     */
    public function downloadDocument(Loan $loan, $documentId)
    {
        $document = $loan->documents()->findOrFail($documentId);
        
        // Check if the file exists
        if (!Storage::exists($document->file_path)) {
            return redirect()->back()->with('error', 'File not found.');
        }

        return Storage::download($document->file_path, $document->name);
    }

    /**
     * Submit a payment for a loan
     */
    public function submitPayment(Request $request, Loan $loan)
    {
        $validated = $request->validate([
            'payment_method_id' => ['required', 'exists:payment_methods,id'],
            'amount' => [
                'required',
                'numeric',
                function ($attribute, $value, $fail) use ($loan) {
                    if ($loan->next_payment_amount !== null && $value < $loan->next_payment_amount) {
                        $fail('The payment amount must be at least ' . $loan->next_payment_amount);
                    }
                }
            ],
            'payment_proof' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'], // 10MB max
            'notes' => ['nullable', 'string'],
        ]);

        // Store the payment proof
        $file = $request->file('payment_proof');
        $path = $file->store('payment-proofs');

        // Create the payment record
        $payment = $loan->payments()->create([
            'reference_number' => 'PAY-' . strtoupper(uniqid()),
            'payment_number' => $loan->completed_payments + 1,
            'amount' => $validated['amount'],
            'principal_amount' => $loan->next_payment_amount ?? $validated['amount'],
            'interest_amount' => 0, // Will be calculated based on payment schedule
            'currency_id' => $loan->currency_id,
            'due_date' => $loan->next_payment_due_date ?? now(), // Use current date if next_payment_due_date is null
            'status' => 'pending',
            'payment_method_id' => $validated['payment_method_id'],
            'notes' => $validated['notes'],
            'attachment' => $path,
            'payer_name' => auth()->user()->name,
            'payer_email' => auth()->user()->email,
        ]);

        return redirect()->back()->with('success', 'Payment submitted successfully. Waiting for admin approval.');
    }

    /**
     * Approve a loan payment
     */
    public function approvePayment(Request $request, Loan $loan, $paymentId)
    {
        $payment = $loan->payments()->findOrFail($paymentId);

        if ($payment->status !== 'pending') {
            return redirect()->back()->with('error', 'This payment cannot be approved.');
        }

        DB::transaction(function () use ($payment, $loan) {
            // Update payment status
            $payment->update([
                'status' => 'completed',
                'payment_date' => now(),
                'recorded_by' => auth()->id(),
            ]);

            // Update loan payment tracking
            $loan->update([
                'completed_payments' => $loan->completed_payments + 1,
                'principal_paid' => $loan->principal_paid + $payment->principal_amount,
                'interest_paid' => $loan->interest_paid + $payment->interest_amount,
                'last_payment_date' => now(),
                'last_payment_amount' => $payment->amount,
            ]);

            // Create transaction record
            $transaction = Transaction::create([
                'reference_number' => 'TRX-' . strtoupper(uniqid()),
                'user_id' => $loan->user_id,
                'transaction_type' => 'loan_repayment',
                'amount' => $payment->amount,
                'currency_id' => $loan->currency_id,
                'status' => 'completed',
                'payment_method_id' => $payment->payment_method_id,
                'loan_id' => $loan->id,
                'loan_payment_id' => $payment->id,
            ]);
        });

        return redirect()->back()->with('success', 'Payment approved successfully.');
    }

    /**
     * Reject a loan payment
     */
    public function rejectPayment(Request $request, Loan $loan, $paymentId)
    {
        $validated = $request->validate([
            'rejection_reason' => 'required|string',
        ]);

        $payment = $loan->payments()->findOrFail($paymentId);

        if ($payment->status !== 'pending') {
            return redirect()->back()->with('error', 'This payment cannot be rejected.');
        }

        $payment->update([
            'status' => 'failed',
            'failure_reason' => $validated['rejection_reason'],
            'failure_details' => 'Payment rejected by admin',
        ]);

        return redirect()->back()->with('success', 'Payment rejected successfully.');
    }

    /**
     * Download payment proof document
     */
    public function downloadPaymentProof(Loan $loan, $paymentId)
    {
        $payment = $loan->payments()->findOrFail($paymentId);
        
        if (!$payment->attachment) {
            return redirect()->back()->with('error', 'Payment proof not found.');
        }

        return Storage::download($payment->attachment);
    }

    /**
     * Update just the status of a loan
     */
    public function updateStatus(Request $request, Loan $loan)
    {
        $validated = $request->validate([
            'status' => 'required|in:draft,pending_approval,approved,rejected,disbursed,active,in_arrears,defaulted,paid,closed,cancelled',
        ]);

        $loan->update($validated);

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Loan status updated successfully',
                'loan' => $loan
            ]);
        }

        return redirect()->back()->with('success', 'Loan status updated successfully.');
    }
}
