<?php

namespace Modules\Payment\Http\Controllers\Stripe;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

use Illuminate\Support\Facades\Validator;

use Modules\Payment\Models\SubscriptionPlan; 


use Modules\User\Models\User;
use Modules\Payment\Models\Customer;

use Laravel\Cashier\Exceptions\IncompletePayment;


class StripePaymentController extends Controller
{
    
    /**
     * Process checkout for single purchase using Stripe Checkout
     */
    public function checkoutSinglePurchase(Request $request)
    {
        $customer = Customer::findOrFail($request->customer_id);
        $priceId = $request->price_id; // Stripe Price ID
        
        return $customer->checkout($priceId, [
            'success_url' => route('payment.success') . '?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url' => route('payment.cancel'),
        ]);
    }

    /**
     * Create a new subscription
     */
    public function checkoutSubscription(Request $request)
    {
        $user = $request->user();
        // Auto-create a Customer record if it doesn't exist
        $customer = $user->customer ?? $user->customer()->create();

        $priceId = $request->price_id; // Stripe Price ID for the subscription
        
        // Validate that the price_id exists in our subscription plans
        $plan = SubscriptionPlan::where('provider_plans->stripe->price_id', $priceId)
            ->where('is_active', true)
            ->first();

        if (!$plan) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid subscription plan selected'
            ], 422);
        }
        
        try {
            $customer->createOrGetStripeCustomer();

            $subscription = $customer->newSubscription('default', $priceId)
                ->trialDays(5)
                ->allowPromotionCodes()
                ->checkout([
                    'success_url' => route('payment.success') . '?session_id={CHECKOUT_SESSION_ID}',
                    'cancel_url' => route('payment.cancel'),
                ]);
                
            return Inertia::render('payment/checkout', [
                'checkoutUrl' => $subscription->url
            ]);
            
        } catch (IncompletePayment $exception) {
            // Handle payments that require additional confirmation
            return redirect()->route(
                'cashier.payment',
                [$exception->payment->id, 'redirect' => route('subscription.success')]
            );
        } catch (\Exception $e) {
            // Handle subscription creation failure
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }




    /**
 * Process a balance funding request
 */
public function fundBalance(Request $request)
{
    $user = $request->user();
    
    // Auto-create a Customer record if it doesn't exist
    $customer = $user->customer ?? $user->customer()->create();
    
    // Validate the amount
    $validator = Validator::make($request->all(), [
        'amount' => 'required|numeric|min:5|max:10000', // Set your own min/max limits
    ]);
    
    if ($validator->fails()) {
        return response()->json([
            'success' => false,
            'message' => $validator->errors()->first('amount')
        ], 422);
    }
    
    // Convert amount to cents (Stripe uses smallest currency unit)
    $amountInCents = (int) ($request->amount * 100);
    
    try {
        // Ensure the customer exists in Stripe
        $customer->createOrGetStripeCustomer();
        
        // Create a Checkout session for a one-time charge
        $checkout = $customer->checkoutCharge(
            $amountInCents,
            'Account Balance Funding', // Product name
            1, // Quantity
            [
                'success_url' => route('payment.success') . '?session_id={CHECKOUT_SESSION_ID}&type=fund',
                'cancel_url' => route('payment.cancel'),
                'metadata' => [
                    'customer_id' => $customer->id,
                    'funding_amount' => $request->amount,
                    'transaction_type' => 'balance_funding'
                ]
            ]
        );
        
        // Return Inertia render like your subscription checkout
        return Inertia::render('payment/checkout', [
            'checkoutUrl' => $checkout->url
        ]);
        
    } catch (\Exception $e) {
        // Handle funding creation failure
        return response()->json([
            'success' => false,
            'message' => $e->getMessage()
        ], 422);
    }
}
    
    /**
     * Handle successful payment
     */
    public function handlePaymentSuccess(Request $request)
    {
        $sessionId = $request->get('session_id');
        
        if ($sessionId) {
            $session = \Laravel\Cashier\Cashier::stripe()->checkout->sessions->retrieve($sessionId);
            
            // Process the completed payment
            // You might want to update your order status, send email, etc.
            
            return Inertia::render('payment/success', ['session' => $session]);
        }
        
        return Inertia::render('payment/success');
    }
    
    /**
     * Handle cancelled payment
     */
    public function handlePaymentCancel()
    {
        return Inertia::render('payment/cancel');
    }
}
