<?php

namespace Modules\Transaction\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;


use Modules\Transaction\Models\Transaction;
use Modules\Payment\Models\Currency;
use Modules\Payment\Models\PaymentMethod;
use Modules\User\Models\User;


use Inertia\Inertia;

class TransactionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Transaction::query();

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('reference_number', 'like', "%{$search}%")
                    ->orWhere('transaction_type', 'like', "%{$search}%")
                    ->orWhere('status', 'like', "%{$search}%");
            });
        }

        // Sort
        if ($request->has('sort') && $request->has('direction')) {
            $query->orderBy($request->sort, $request->direction);
        } else {
            $query->latest();
        }

        // Pagination
        $perPage = $request->has('per_page') ? (int) $request->per_page : 10;
        $transactions = $query->paginate($perPage);

        return Inertia::render('transactions/index', [
            'transactions' => $transactions,
            'filters' => $request->only(['search', 'sort', 'direction']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('transactions/create', [
            'currencies' => Currency::all(),
            'payment_methods' => PaymentMethod::all(),
            'users' => User::all(['id', 'first_name', 'last_name', 'email']),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'reference_number' => 'required|string|unique:transactions',
            'transaction_type' => 'required|string',
            'amount' => 'required|numeric|min:0',
            'currency_id' => 'required|exists:currencies,id',
            'status' => 'required|string',
            'payment_method_id' => 'nullable|exists:payment_methods,id',
            'external_reference' => 'nullable|string',
            'failure_reason' => 'nullable|string',
            'failure_details' => 'nullable|string',
            'user_id' => 'required|exists:users,id',
        ]);

        // Calculate net amount (amount - fees - taxes)
        $amount = $validated['amount'];
        $feeAmount = 0; // You might want to calculate this based on your business logic
        $taxAmount = 0; // You might want to calculate this based on your business logic
        $netAmount = $amount - $feeAmount - $taxAmount;

        $transaction = Transaction::create([
            ...$validated,
            'fee_amount' => $feeAmount,
            'tax_amount' => $taxAmount,
            'net_amount' => $netAmount,
        ]);

        return redirect()->route('transactions.show', ['tenant' => tenant('id'), 'transaction' => $transaction]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Transaction $transaction)
    {
        return Inertia::render('transactions/show', [
            'transaction' => $transaction,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Transaction $transaction)
    {
        return Inertia::render('transactions/edit', [
            'transaction' => $transaction,
            'currencies' => Currency::all(),
            'payment_methods' => PaymentMethod::all(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Transaction $transaction)
    {
        $validated = $request->validate([
            'reference_number' => 'required|string|unique:transactions,reference_number,' . $transaction->id,
            'transaction_type' => 'required|string',
            'amount' => 'required|numeric|min:0',
            'currency_id' => 'required|exists:currencies,id',
            'status' => 'required|string',
            'payment_method_id' => 'nullable|exists:payment_methods,id',
            'external_reference' => 'nullable|string',
            'category' => 'nullable|string',
            'failure_reason' => 'nullable|string',
            'failure_details' => 'nullable|string',
        ]);

        $transaction->update($validated);

        return redirect()->route('transactions.show', ['tenant' => tenant('id'), 'transaction' => $transaction]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Transaction $transaction)
    {
        $transaction->delete();

        return redirect()->route('transactions.index', ['tenant' => tenant('id')]);
    }

    /**
     * Bulk delete transactions.
     */
    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:transactions,id',
        ]);

        Transaction::whereIn('id', $request->ids)->delete();

        return redirect()->route('transactions.index', ['tenant' => tenant('id')]);
    }

    /**
     * Bulk archive transactions.
     */
    public function bulkArchive(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:transactions,id',
        ]);

        Transaction::whereIn('id', $request->ids)->update(['status' => 'archived']);

        return redirect()->route('transactions.index', ['tenant' => tenant('id')]);
    }

    /**
     * Get all transactions for export/print.
     */
    public function getAllTransactions()
    {
        return Transaction::all();
    }

    /**
     * Export transactions.
     */
    public function export(Request $request)
    {
        $request->validate([
            'format' => 'required|in:csv,json',
        ]);

        $transactions = Transaction::all();

        if ($request->format === 'csv') {
            $headers = [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => 'attachment; filename="transactions.csv"',
            ];

            $callback = function () use ($transactions) {
                $file = fopen('php://output', 'w');

                // Add headers
                fputcsv($file, [
                    'Reference Number',
                    'Type',
                    'Amount',
                    'Status',
                    'Created At',
                ]);

                // Add data
                foreach ($transactions as $transaction) {
                    fputcsv($file, [
                        $transaction->reference_number,
                        $transaction->transaction_type,
                        $transaction->amount,
                        $transaction->status,
                        $transaction->created_at,
                    ]);
                }

                fclose($file);
            };

            return response()->stream($callback, 200, $headers);
        }

        return response()->json($transactions);
    }
}
