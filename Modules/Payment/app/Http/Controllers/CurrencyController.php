<?php

namespace Modules\Payment\Http\Controllers;

use App\Http\Controllers\Controller;

use Modules\Payment\Models\Currency;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Validator;

class CurrencyController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $currencies = Currency::orderBy('is_active', 'desc')
            ->orderBy('is_default', 'desc')
            ->orderBy('name')
            ->get();
        
        return Inertia::render('currency/index', [
            'currencies' => $currencies,
            'types' => [
                'fiat' => 'Fiat Currency',
                'crypto' => 'Cryptocurrency',
                'other' => 'Other'
            ],
            'riskLevels' => [
                'low' => 'Low Risk',
                'medium' => 'Medium Risk',
                'high' => 'High Risk'
            ]
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('currency/create', [
            'types' => [
                'fiat' => 'Fiat Currency',
                'crypto' => 'Cryptocurrency',
                'other' => 'Other'
            ],
            'riskLevels' => [
                'low' => 'Low Risk',
                'medium' => 'Medium Risk',
                'high' => 'High Risk'
            ]
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'code' => 'required|string|max:10|unique:currencies',
            'name' => 'required|string|max:100',
            'symbol' => 'required|string|max:10',
            'type' => 'required|in:fiat,crypto,other',
            'decimal_places' => 'required|integer|min:0|max:18',
            'decimal_separator' => 'required|string|size:1',
            'thousand_separator' => 'required|string|size:1',
            'symbol_position' => 'required|in:before,after',
            'is_base_currency' => 'boolean',
            'exchange_rate_to_base' => 'required|numeric|min:0',
            'is_active' => 'boolean',
            'is_loan_available' => 'boolean',
            'is_borrow_available' => 'boolean',
            'min_transaction_amount' => 'nullable|numeric|min:0',
            'max_transaction_amount' => 'nullable|numeric|min:0',
            'withdrawal_fee_fixed' => 'nullable|numeric|min:0',
            'withdrawal_fee_percent' => 'nullable|numeric|min:0|max:100',
            'deposit_fee_fixed' => 'nullable|numeric|min:0',
            'deposit_fee_percent' => 'nullable|numeric|min:0|max:100',
            'risk_level' => 'required|in:low,medium,high',
            'requires_enhanced_verification' => 'boolean',
            'description' => 'nullable|string',
            'additional_info' => 'nullable|array',
            'icon' => 'nullable|string',
            'is_default' => 'boolean'
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $currency = Currency::create($validator->validated());

        if ($request->is_default) {
            $currency->setAsDefault();
        }

        return redirect()->route('currencies.index')
            ->with('success', 'Currency created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Currency $currency)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Currency $currency)
    {
        return Inertia::render('currency/edit', [
            'currency' => $currency,
            'types' => [
                'fiat' => 'Fiat Currency',
                'crypto' => 'Cryptocurrency',
                'other' => 'Other'
            ],
            'riskLevels' => [
                'low' => 'Low Risk',
                'medium' => 'Medium Risk',
                'high' => 'High Risk'
            ]
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Currency $currency)
    {
        $validator = Validator::make($request->all(), [
            'code' => 'required|string|max:10|unique:currencies,code,' . $currency->id,
            'name' => 'required|string|max:100',
            'symbol' => 'required|string|max:10',
            'type' => 'required|in:fiat,crypto,other',
            'decimal_places' => 'required|integer|min:0|max:18',
            'decimal_separator' => 'required|string|size:1',
            'thousand_separator' => 'required|string|size:1',
            'symbol_position' => 'required|in:before,after',
            'is_base_currency' => 'boolean',
            'exchange_rate_to_base' => 'required|numeric|min:0',
            'is_active' => 'boolean',
            'is_loan_available' => 'boolean',
            'is_borrow_available' => 'boolean',
            'min_transaction_amount' => 'nullable|numeric|min:0',
            'max_transaction_amount' => 'nullable|numeric|min:0',
            'withdrawal_fee_fixed' => 'nullable|numeric|min:0',
            'withdrawal_fee_percent' => 'nullable|numeric|min:0|max:100',
            'deposit_fee_fixed' => 'nullable|numeric|min:0',
            'deposit_fee_percent' => 'nullable|numeric|min:0|max:100',
            'risk_level' => 'required|in:low,medium,high',
            'requires_enhanced_verification' => 'boolean',
            'description' => 'nullable|string',
            'additional_info' => 'nullable|array',
            'icon' => 'nullable|string',
            'is_default' => 'boolean'
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $currency->update($validator->validated());

        if ($request->is_default) {
            $currency->setAsDefault();
        }

        return redirect()->route('currencies.index')
            ->with('success', 'Currency updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Currency $currency)
    {
        if ($currency->is_default) {
            return back()->with('error', 'Cannot delete the default currency.');
        }

        $currency->delete();

        return redirect()->route('currencies.index')
            ->with('success', 'Currency deleted successfully.');
    }

    public function setDefault(Currency $currency)
    {
        $currency->setAsDefault();

        return redirect()->route('currencies.index')
            ->with('success', 'Default currency updated successfully.');
    }

    public function toggleActive(Currency $currency)
    {
        if ($currency->is_default) {
            return back()->with('error', 'Cannot disable the default currency.');
        }

        $currency->update(['is_active' => !$currency->is_active]);

        return redirect()->route('currencies.index')
            ->with('success', 'Currency status updated successfully.');
    }
}
