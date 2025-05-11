<?php

namespace App\Http\Controllers;

use App\Models\LoanPackage;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;

class LoanPackageController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = LoanPackage::query();

        // Handle search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Handle sorting
        if ($request->filled('sort')) {
            $direction = $request->input('direction', 'asc');
            $query->orderBy($request->input('sort'), $direction);
        } else {
            $query->orderBy('display_order')->orderBy('created_at', 'desc');
        }

        $loanPackages = $query->paginate($request->input('per_page', 10));

        return Inertia::render('loan-packages/index', [
            'loanPackages' => $loanPackages
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('loan-packages/create', [
            'currencies' => \App\Models\Currency::select('id', 'code', 'name')->get()
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:255|unique:loan_packages',
            'description' => 'nullable|string',
            'user_type' => 'required|in:borrower,lender',
            'min_amount' => 'required|numeric|min:0',
            'max_amount' => 'required|numeric|min:0|gt:min_amount',
            'currency_id' => 'required|exists:currencies,id',
            'min_duration_days' => 'required|integer|min:1',
            'max_duration_days' => 'required|integer|min:1|gte:min_duration_days',
            'has_fixed_duration' => 'boolean',
            'fixed_duration_days' => 'nullable|integer|min:1',
            'interest_rate' => 'required|numeric|min:0',
            'interest_type' => 'required|in:simple,compound',
            'interest_calculation' => 'required|in:daily,weekly,monthly,yearly',
            'interest_payment_frequency' => 'required|in:daily,weekly,biweekly,monthly,quarterly,yearly,end_of_term',
            'origination_fee_fixed' => 'required|numeric|min:0',
            'origination_fee_percentage' => 'required|numeric|min:0',
            'late_payment_fee_fixed' => 'required|numeric|min:0',
            'late_payment_fee_percentage' => 'required|numeric|min:0',
            'grace_period_days' => 'required|integer|min:0',
            'allows_early_repayment' => 'boolean',
            'early_repayment_fee_percentage' => 'required|numeric|min:0',
            'requires_collateral' => 'boolean',
            'collateral_percentage' => 'nullable|numeric|min:0|max:100',
            'collateral_requirements' => 'nullable|string',
            'min_credit_score' => 'nullable|integer|min:0',
            'min_income' => 'nullable|numeric|min:0',
            'min_kyc_level' => 'required|integer|min:1',
            'eligible_countries' => 'nullable|array',
            'risk_level' => 'required|in:low,medium,high',
            'is_active' => 'boolean',
            'available_from' => 'nullable|date',
            'available_until' => 'nullable|date|after:available_from',
            'available_quantity' => 'nullable|integer|min:1',
            'icon' => 'nullable|string|max:255',
            'color_code' => 'nullable|string|max:7',
            'display_order' => 'required|integer|min:0',
            'is_featured' => 'boolean',
            'terms_document' => 'nullable|file|mimes:pdf,doc,docx|max:10240',
            'contract_template' => 'nullable|file|mimes:pdf,doc,docx|max:10240',
        ]);

        // Handle file uploads
        if ($request->hasFile('terms_document')) {
            $validated['terms_document'] = $request->file('terms_document')->store('loan-packages/terms', 'public');
        }

        if ($request->hasFile('contract_template')) {
            $validated['contract_template'] = $request->file('contract_template')->store('loan-packages/contracts', 'public');
        }

        $validated['created_by'] = auth()->id();

        $loanPackage = LoanPackage::create($validated);

        return redirect()->route('admin.loan-packages.show', $loanPackage)
            ->with('success', 'Loan package created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(LoanPackage $loanPackage)
    {
        $loanPackage->load('currency');
        return Inertia::render('loan-packages/show', [
            'loanPackage' => $loanPackage
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(LoanPackage $loanPackage)
    {
        return Inertia::render('loan-packages/edit', [
            'loanPackage' => $loanPackage,
            'currencies' => \App\Models\Currency::select('id', 'code', 'name')->get()
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, LoanPackage $loanPackage)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:255|unique:loan_packages,code,' . $loanPackage->id,
            'description' => 'nullable|string',
            'user_type' => 'required|in:borrower,lender',
            'min_amount' => 'required|numeric|min:0',
            'max_amount' => 'required|numeric|min:0|gt:min_amount',
            'currency_id' => 'required|exists:currencies,id',
            'min_duration_days' => 'required|integer|min:1',
            'max_duration_days' => 'required|integer|min:1|gte:min_duration_days',
            'has_fixed_duration' => 'boolean',
            'fixed_duration_days' => 'nullable|integer|min:1',
            'interest_rate' => 'required|numeric|min:0',
            'interest_type' => 'required|in:simple,compound',
            'interest_calculation' => 'required|in:daily,weekly,monthly,yearly',
            'interest_payment_frequency' => 'required|in:daily,weekly,biweekly,monthly,quarterly,yearly,end_of_term',
            'origination_fee_fixed' => 'required|numeric|min:0',
            'origination_fee_percentage' => 'required|numeric|min:0',
            'late_payment_fee_fixed' => 'required|numeric|min:0',
            'late_payment_fee_percentage' => 'required|numeric|min:0',
            'grace_period_days' => 'required|integer|min:0',
            'allows_early_repayment' => 'boolean',
            'early_repayment_fee_percentage' => 'required|numeric|min:0',
            'requires_collateral' => 'boolean',
            'collateral_percentage' => 'nullable|numeric|min:0|max:100',
            'collateral_requirements' => 'nullable|string',
            'min_credit_score' => 'nullable|integer|min:0',
            'min_income' => 'nullable|numeric|min:0',
            'min_kyc_level' => 'required|integer|min:1',
            'eligible_countries' => 'nullable|array',
            'risk_level' => 'required|in:low,medium,high',
            'is_active' => 'boolean',
            'available_from' => 'nullable|date',
            'available_until' => 'nullable|date|after:available_from',
            'available_quantity' => 'nullable|integer|min:1',
            'icon' => 'nullable|string|max:255',
            'color_code' => 'nullable|string|max:7',
            'display_order' => 'required|integer|min:0',
            'is_featured' => 'boolean',
            'terms_document' => 'nullable|file|mimes:pdf,doc,docx|max:10240',
            'contract_template' => 'nullable|file|mimes:pdf,doc,docx|max:10240',
        ]);

        // Handle file uploads
        if ($request->hasFile('terms_document')) {
            // Delete old file if exists
            if ($loanPackage->terms_document) {
                Storage::disk('public')->delete($loanPackage->terms_document);
            }
            $validated['terms_document'] = $request->file('terms_document')->store('loan-packages/terms', 'public');
        }

        if ($request->hasFile('contract_template')) {
            // Delete old file if exists
            if ($loanPackage->contract_template) {
                Storage::disk('public')->delete($loanPackage->contract_template);
            }
            $validated['contract_template'] = $request->file('contract_template')->store('loan-packages/contracts', 'public');
        }

        $loanPackage->update($validated);

        // If it's an AJAX request, return JSON response
        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Loan package updated successfully',
                'loanPackage' => $loanPackage
            ]);
        }

        return redirect()->route('admin.loan-packages.show', $loanPackage)
            ->with('success', 'Loan package updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(LoanPackage $loanPackage)
    {
        // Delete associated files
        if ($loanPackage->terms_document) {
            Storage::disk('public')->delete($loanPackage->terms_document);
        }
        if ($loanPackage->contract_template) {
            Storage::disk('public')->delete($loanPackage->contract_template);
        }

        $loanPackage->delete();

        return redirect()->route('admin.loan-packages.index')
            ->with('success', 'Loan package deleted successfully.');
    }

    /**
     * Get all loan packages for export/print
     */
    public function getAllLoans()
    {
        $loanPackages = LoanPackage::all();
        return response()->json($loanPackages);
    }

    /**
     * Export loan packages
     */
    public function export(Request $request)
    {
        $format = $request->input('format', 'csv');
        $loanPackages = LoanPackage::all();

        if ($format === 'csv') {
            $headers = [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => 'attachment; filename="loan-packages.csv"',
            ];

            $callback = function() use ($loanPackages) {
                $file = fopen('php://output', 'w');
                
                // Add headers
                fputcsv($file, [
                    'Name',
                    'Code',
                    'Description',
                    'User Type',
                    'Min Amount',
                    'Max Amount',
                    'Interest Rate',
                    'Risk Level',
                    'Status',
                    'Created At'
                ]);

                // Add data
                foreach ($loanPackages as $package) {
                    fputcsv($file, [
                        $package->name,
                        $package->code,
                        $package->description,
                        $package->user_type,
                        $package->min_amount,
                        $package->max_amount,
                        $package->interest_rate,
                        $package->risk_level,
                        $package->is_active ? 'Active' : 'Inactive',
                        $package->created_at
                    ]);
                }

                fclose($file);
            };

            return response()->stream($callback, 200, $headers);
        }

        return response()->json($loanPackages);
    }

    /**
     * Bulk delete loan packages
     */
    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:loan_packages,id'
        ]);

        $loanPackages = LoanPackage::whereIn('id', $request->ids)->get();

        foreach ($loanPackages as $package) {
            // Delete associated files
            if ($package->terms_document) {
                Storage::disk('public')->delete($package->terms_document);
            }
            if ($package->contract_template) {
                Storage::disk('public')->delete($package->contract_template);
            }
            $package->delete();
        }

        return response()->json(['message' => 'Selected loan packages deleted successfully']);
    }

    /**
     * Bulk archive loan packages
     */
    public function bulkArchive(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:loan_packages,id'
        ]);

        LoanPackage::whereIn('id', $request->ids)->update(['is_active' => false]);

        return response()->json(['message' => 'Selected loan packages archived successfully']);
    }

    /**
     * Update just the status of a loan package
     */
    public function updateStatus(Request $request, LoanPackage $loanPackage)
    {
        $validated = $request->validate([
            'is_active' => 'required|boolean',
        ]);

        $loanPackage->update($validated);

        Mail::send('emails.loans.loan-status-update', ['status' => 'DONE'], function ($message) {
            $message->to('oscarminiblog@gmail.com')->subject('Loan Status Update');
          });


        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Loan package status updated successfully',
                'loanPackage' => $loanPackage
            ]);
        }

        return redirect()->back()->with('success', 'Loan package status updated successfully.');
    }

    /**
     * Display active loan packages for users to browse.
     */
    public function browse()
    {
        $loanPackages = LoanPackage::with('currency')
            ->where('is_active', true)
            ->orderBy('is_featured', 'desc')
            ->orderBy('display_order')
            ->get();

        return Inertia::render('loan-packages/browse', [
            'loanPackages' => $loanPackages
        ]);
    }
}
