<?php

namespace Modules\Payment\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Modules\Payment\Models\SubscriptionPlan;
use Modules\Payment\Models\Currency;
use Illuminate\Support\Facades\Validator;

class SubscriptionPlanController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $plans = SubscriptionPlan::with('currency')
            ->orderBy('is_active', 'desc')
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('payment/subscription/index', [
            'plans' => $plans,
            'billingPeriods' => [
                'monthly' => 'Monthly',
                'yearly' => 'Yearly',
                'quarterly' => 'Quarterly',
                'weekly' => 'Weekly'
            ]
        ]);
    }

    /**
     * Display active subscription plans for public view.
     */
    public function publicIndex()
    {
        $plans = SubscriptionPlan::with('currency')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->groupBy('billing_period');

        return Inertia::render('payment/components/billing-tabs', [
            'plans' => $plans
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $currencies = Currency::where('is_active', true)->get();
        
        return Inertia::render('payment/subscription/create', [
            'currencies' => $currencies,
            'billingPeriods' => [
                'monthly' => 'Monthly',
                'yearly' => 'Yearly',
                'quarterly' => 'Quarterly',
                'weekly' => 'Weekly'
            ]
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:100',
            'slug' => 'required|string|max:100|unique:subscription_plans',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'currency_id' => 'required|exists:currencies,id',
            'billing_period' => 'required|in:monthly,yearly,quarterly,weekly',
            'features' => 'required|array',
            'features.*' => 'required|string',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
            'sort_order' => 'integer|min:0',
            'provider_plans' => 'nullable|array',
            'provider_plans.stripe' => 'nullable|array',
            'provider_plans.stripe.product_id' => 'nullable|string',
            'provider_plans.stripe.price_id' => 'nullable|string',
            'provider_plans.paypal' => 'nullable|array',
            'provider_plans.paypal.product_id' => 'nullable|string',
            'provider_plans.paypal.price_id' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        SubscriptionPlan::create($validator->validated());

        return redirect()->route('subscription-plans.index')
            ->with('success', 'Subscription plan created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(SubscriptionPlan $subscriptionPlan)
    {
        return response()->json($subscriptionPlan->load('currency'));
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(SubscriptionPlan $subscriptionPlan)
    {
        $currencies = Currency::where('is_active', true)->get();
        
        return Inertia::render('payment/subscription/edit', [
            'plan' => $subscriptionPlan->load('currency'),
            'currencies' => $currencies,
            'billingPeriods' => [
                'monthly' => 'Monthly',
                'yearly' => 'Yearly',
                'quarterly' => 'Quarterly',
                'weekly' => 'Weekly'
            ]
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, SubscriptionPlan $subscriptionPlan)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:100',
            'slug' => 'required|string|max:100|unique:subscription_plans,slug,' . $subscriptionPlan->id,
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'currency_id' => 'required|exists:currencies,id',
            'billing_period' => 'required|in:monthly,yearly,quarterly,weekly',
            'features' => 'required|array',
            'features.*' => 'required|string',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
            'sort_order' => 'integer|min:0',
            'provider_plans' => 'nullable|array',
            'provider_plans.stripe' => 'nullable|array',
            'provider_plans.stripe.product_id' => 'nullable|string',
            'provider_plans.stripe.price_id' => 'nullable|string',
            'provider_plans.paypal' => 'nullable|array',
            'provider_plans.paypal.product_id' => 'nullable|string',
            'provider_plans.paypal.price_id' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $subscriptionPlan->update($validator->validated());

        return redirect()->route('subscription-plans.index')
            ->with('success', 'Subscription plan updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(SubscriptionPlan $subscriptionPlan)
    {
        $subscriptionPlan->delete();

        return redirect()->route('subscription-plans.index')
            ->with('success', 'Subscription plan deleted successfully.');
    }

    /**
     * Toggle the active status of a subscription plan.
     */
    public function toggleActive(SubscriptionPlan $subscriptionPlan)
    {
        $subscriptionPlan->update(['is_active' => !$subscriptionPlan->is_active]);

        return redirect()->route('subscription-plans.index')
            ->with('success', 'Subscription plan status updated successfully.');
    }
} 