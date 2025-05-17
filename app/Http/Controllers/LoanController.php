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
use App\Models\PaymentMethod;
use App\Models\LoanDocument;
use App\Models\LoanPayment;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Validation\Rule;

class LoanController extends Controller
{
    use AuthorizesRequests;

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
        // Check if user's KYC is verified, but only if loans without KYC are not allowed
        $allowLoansWithoutKyc = \App\Models\LoanSetting::getValue('allow_loans_without_kyc', false);
        if (!$allowLoansWithoutKyc && !auth()->user()->isKycVerified()) {
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

        // Get the loan package if package_id is provided
        $package = null;
        if ($validated['package_id']) {
            $package = \App\Models\LoanPackage::findOrFail($validated['package_id']);
        }

        // Add user_id from authenticated user
        $validated['user_id'] = auth()->id();
        $validated['reference_number'] = 'LOAN-' . strtoupper(Str::random(8));
        $validated['status'] = 'pending';
        $validated['submitted_at'] = now();

        // Add package-specific fields if package exists
        if ($package) {
            // Origination fee
            $validated['origination_fee_amount'] = $package->origination_fee_type === 'fixed' 
                ? $package->origination_fee_fixed 
                : ($validated['amount'] * $package->origination_fee_percentage / 100);

            // Late payment fee
            if ($package->late_payment_fee_type === 'fixed') {
                $validated['late_payment_fee_fixed'] = $package->late_payment_fee_fixed;
                $validated['late_payment_fee_percentage'] = 0;
            } else {
                $validated['late_payment_fee_fixed'] = 0;
                $validated['late_payment_fee_percentage'] = $package->late_payment_fee_percentage;
            }

            // Grace period
            $validated['grace_period_days'] = $package->grace_period_days;

            // Early repayment settings
            $validated['allows_early_repayment'] = $package->allows_early_repayment;
            if ($package->allows_early_repayment) {
                if ($package->early_repayment_type === 'fixed') {
                    $validated['early_repayment_fixed_fee'] = $package->early_repayment_fee_fixed;
                    $validated['early_repayment_fee_percentage'] = 0;
                } else {
                    $validated['early_repayment_fixed_fee'] = 0;
                    $validated['early_repayment_fee_percentage'] = $package->early_repayment_fee_percentage;
                }
                $validated['early_repayment_period_days'] = $package->early_repayment_period_days;
            } else {
                $validated['early_repayment_fixed_fee'] = 0;
                $validated['early_repayment_fee_percentage'] = 0;
                $validated['early_repayment_period_days'] = 0;
            }

            // Set has_early_repayment to false initially
            $validated['has_early_repayment'] = false;
        }

        $loan = Loan::create($validated);

        // Add Activity
        activity()->log('Applied for a Loan', [
            'loan_id' => $loan->id,
            'user_id' => auth()->id(),
            'loan_package_id' => $validated['package_id'],
            'amount' => $validated['amount'],
        ]);

        return redirect()->route('user-loans.show', $loan)
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
            'approved_by_user:id,first_name,last_name,email',
            'payment_method',
            'documents' => function ($query) {
                $query->with('uploadedBy')
                      ->orderBy('created_at', 'desc');
            },
            'notes' => function ($query) {
                $query->with(['createdBy', 'updatedBy'])
                      ->orderBy('created_at', 'desc');
            },
            'payments' => function ($query) {
                $query->orderBy('due_date', 'desc');
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
            // 'custom_package_id' => 'nullable|exists:custom_packages,id',
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
            'status' => 'required|in:pending,approved,rejected,active,in_arrears,defaulted,paid,cancelled',
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
     * Update the loan status
     *
     * @param Request $request
     * @param Loan $loan
     * @return \Illuminate\Http\RedirectResponse
     */
    public function updateStatus(Request $request, Loan $loan)
    {
        $request->validate([
            'status' => ['required', 'string', Rule::in([
                'pending',
                'approved',
                'rejected',
                'active',
                'in_arrears',
                'defaulted',
                'paid',
                'cancelled'
            ])],
            'approval_notes' => ['nullable', 'string', 'required_if:status,approved'],
            'rejection_reason' => ['nullable', 'string', 'required_if:status,rejected'],
            'payment_method_id' => ['nullable', 'exists:payment_methods,id', 'required_if:status,active'],
            'disbursement_transaction_id' => ['nullable', 'string', 'required_if:status,active'],
            'start_date' => ['nullable', 'date', 'required_if:status,active'],
            'end_date' => ['nullable', 'date', 'after:start_date', 'required_if:status,active'],
        ]);

        $oldStatus = $loan->status;
        $newStatus = $request->status;

        // Update the status
        $loan->status = $newStatus;

        // Update the corresponding timestamp and related information
        switch ($newStatus) {
            case 'approved':
                $loan->approved_at = now();
                $loan->approved_by = auth()->id();
                $loan->approval_notes = $request->approval_notes;
                break;
            case 'rejected':
                $loan->rejected_at = now();
                $loan->rejection_reason = $request->rejection_reason;
                break;
            case 'active':
                $loan->start_date = $request->start_date;
                $loan->end_date = $request->end_date;
                $loan->payment_method_id = $request->payment_method_id;
                $loan->disbursement_transaction_id = $request->disbursement_transaction_id;
                // Set current_balance equal to amount when loan is activated
                $loan->current_balance = $loan->amount;
                break;
            case 'defaulted':
                $loan->defaulted_at = now();
                break;
            case 'paid':
                $loan->paid_at = now();
                break;
            case 'cancelled':
                $loan->rejected_at = now();
                break;
        }

        $loan->save();

        // Log the status change
        activity()
            ->performedOn($loan)
            ->causedBy(auth()->user())
            ->withProperties([
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
                'approval_notes' => $request->approval_notes,
                'rejection_reason' => $request->rejection_reason,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'disbursement_transaction_id' => $request->disbursement_transaction_id
            ])
            ->log('Loan status updated');

        return back()->with('success', 'Loan status updated successfully');
    }

    /**
     * Display a listing of the user's loans.
     */
    public function userIndex()
    {
        $loans = auth()->user()->loans()
            ->with(['currency', 'user'])
            ->latest()
            ->paginate(10);

        return Inertia::render('loans/user-loans', [
            'loans' => $loans,
        ]);
    }

    /**
     * Display the specified loan for the user.
     */
    public function userShow(Loan $loan)
    {
        // Simple check to ensure user can only view their own loans
        if ($loan->user_id !== auth()->id()) {
            abort(403);
        }

        $loan->load([
            'currency',
            'user',
            'documents',
            'notes' => function ($query) {
                $query->with(['createdBy', 'updatedBy']);
            },
            'payments' => function ($query) {
                $query->orderBy('due_date', 'desc');
            },
        ]);

        return Inertia::render('loans/user-show', [
            'loan' => $loan,
            'payment_methods' => PaymentMethod::all(),
        ]);
    }

    /**
     * Display the documents for a specific loan.
     */
    public function userDocuments(Loan $loan)
    {
        if ($loan->user_id !== auth()->id()) {
            abort(403);
        }

        $loan->load('documents');

        return Inertia::render('loans/user-documents', [
            'loan' => $loan,
        ]);
    }

    /**
     * Display the notes for a specific loan.
     */
    public function userNotes(Loan $loan)
    {
        if ($loan->user_id !== auth()->id()) {
            abort(403);
        }

        $loan->load(['notes' => function ($query) {
            $query->with(['createdBy', 'updatedBy']);
        }]);

        return Inertia::render('loans/user-notes', [
            'loan' => $loan,
        ]);
    }

    /**
     * Upload a document for a loan.
     */
    public function userUploadDocument(Request $request, Loan $loan)
    {
        if ($loan->user_id !== auth()->id()) {
            abort(403);
        }

        $validated = $request->validate([
            'file' => 'required|file|max:10240', // 10MB max
            'type' => 'required|string',
            'description' => 'nullable|string|max:1000',
        ]);

        $file = $request->file('file');
        $path = $file->store('loan-documents');

        $document = $loan->documents()->create([
            'name' => $file->getClientOriginalName(),
            'type' => $validated['type'],
            'file_path' => $path,
            'file_size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
            'description' => $validated['description'],
            'uploaded_by' => auth()->id(),
        ]);

        return back()->with('success', 'Document uploaded successfully.');
    }

    /**
     * Download a loan document.
     */
    public function userDownloadDocument(Loan $loan, LoanDocument $document)
    {
        if ($loan->user_id !== auth()->id()) {
            abort(403);
        }

        if ($document->loan_id !== $loan->id) {
            abort(404);
        }

        return Storage::download($document->file_path, $document->name);
    }

    /**
     * Submit a payment for a loan.
     */
    public function userSubmitPayment(Request $request, Loan $loan)
    {
        if ($loan->user_id !== auth()->id()) {
            abort(403);
        }

        if ($loan->status !== 'active') {
            return back()->with('error', 'Payments can only be made on active loans.');
        }

        $validated = $request->validate([
            'payment_method_id' => 'required|exists:payment_methods,id',
            'amount' => 'required|numeric|min:' . $loan->next_payment_amount,
            'payment_proof' => 'required|file|max:10240', // 10MB max
            'notes' => 'nullable|string|max:1000',
        ]);

        $file = $request->file('payment_proof');
        $path = $file->store('payment-proofs');

        $payment = $loan->payments()->create([
            'payment_number' => $loan->payments()->count() + 1,
            'amount' => $validated['amount'],
            'status' => 'pending',
            'due_date' => $loan->next_payment_due_date,
            'payer_name' => auth()->user()->name,
            'notes' => $validated['notes'],
            'attachment' => $path,
        ]);

        return back()->with('success', 'Payment submitted successfully.');
    }

    /**
     * Download payment proof.
     */
    public function userDownloadPaymentProof(Loan $loan, LoanPayment $payment)
    {
        if ($loan->user_id !== auth()->id()) {
            abort(403);
        }

        if ($payment->loan_id !== $loan->id) {
            abort(404);
        }

        if (!$payment->attachment) {
            abort(404);
        }

        return Storage::download($payment->attachment, 'payment-proof-' . $payment->id);
    }

    /**
     * Cancel a loan application.
     */
    public function userCancel(Loan $loan)
    {
        if ($loan->user_id !== auth()->id()) {
            abort(403);
        }

        if ($loan->status !== 'pending') {
            return back()->with('error', 'Only pending loans can be cancelled.');
        }

        $loan->update([
            'status' => 'cancelled',
            'rejected_at' => now(),
        ]);

        return redirect()->route('user-loans')
            ->with('success', 'Loan application cancelled successfully.');
    }
}
