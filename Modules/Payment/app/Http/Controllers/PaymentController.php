<?php

namespace Modules\Payment\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

use Illuminate\Support\Facades\Validator;

use Modules\Payment\Models\SubscriptionPlan; 
use Modules\Payment\Services\PaymentGatewayManager;
use Modules\Payment\Models\Currency;


use Modules\User\Models\User;
use Modules\Payment\Models\Customer;


class PaymentController extends Controller
{
    /**
     * Display the billing settings page.
     */
    public function billing()
    {
        $user = auth()->user();
        $subscription = $user->subscription();
        $paymentMethods = $user->paymentMethods();
        $invoices = $user->invoices();
        
        $plans = SubscriptionPlan::with(['currency' => function($query) {
                $query->select('id', 'code', 'symbol', 'symbol_position', 'decimal_places', 'decimal_separator', 'thousand_separator');
            }])
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->groupBy('billing_period');

        return Inertia::render('payment/billing', [
            'subscription' => $subscription,
            'paymentMethods' => $paymentMethods,
            'invoices' => $invoices,
            'user' => $user,
            'plans' => $plans,
        ]);
    }


    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('payment/index');
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return view('payment::create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request) {}

    /**
     * Show the specified resource.
     */
    public function show($id)
    {
        return view('payment::show');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        return view('payment::edit');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id) {}

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id) {}


    public function initiatePayment(Request $request)
    {


        $customer = auth()->user();
        $amount = $request->amount;
        $currency_id = $request->currency_id;
        $currency = Currency::where('id', $currency_id)->first();
        $txRef = $request->txRef;

        // Determine what Gateway to use
        $paymentGatewayManager = app(PaymentGatewayManager::class);
        $gateway = $paymentGatewayManager->resolve($currency->code);

        $response = $gateway->initiatePayment($request);
        
        // For regular requests, return the redirect response
        return $response;

    }



    public function settleTransactionReceived(Request $request)
    {
        $payload = $request->all();

        if ($payload['event'] === 'charge.completed') {
            $txRef = $payload['data']['tx_ref'];
            $status = $payload['data']['status'];
        }

        
        // Get all pending payments from various tables
        $pendingBorrowPayments = BorrowPayment::where('status', 'pending')->get();
        $pendingFlutterwaveTransactions = FlutterwaveTransaction::where('status', 'pending')->get();
        $pendingLoanPayments = LoanPayment::where('status', 'pending')->get();
        $pendingTransactions = Transaction::where('status', 'pending')->get();

        // Process each type of payment
        foreach ($pendingBorrowPayments as $payment) {
            if ($payment->payment_id) {
                $payment->update([
                    'status' => 'completed',
                    'settled_at' => now()
                ]);
            }
        }

        foreach ($pendingFlutterwaveTransactions as $transaction) {
            if ($transaction->payment_id) {
                $transaction->update([
                    'status' => 'completed',
                    'settled_at' => now()
                ]);
            }
        }

        foreach ($pendingLoanPayments as $payment) {
            if ($payment->payment_id) {
                $payment->update([
                    'status' => 'completed',
                    'settled_at' => now()
                ]);
            }
        }

        foreach ($pendingTransactions as $transaction) {
            if ($transaction->payment_id) {
                $transaction->update([
                    'status' => 'completed',
                    'settled_at' => now()
                ]);
            }
        }

        return response()->json([
            'message' => 'Payments settled successfully'
        ]);
    }


}