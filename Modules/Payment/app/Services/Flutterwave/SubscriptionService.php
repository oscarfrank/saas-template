<?php

namespace Modules\Payment\Services\Flutterwave;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SubscriptionService
{
    private $flutterwaveService;

    public function __construct(FlutterwaveService $flutterwaveService)
    {
        $this->flutterwaveService = $flutterwaveService;
    }

    /**
     * Create a payment plan for subscriptions
     */
    public function createPaymentPlan($name, $amount, $interval, $currency = 'NGN')
    {
        try {
            $baseUrl = config('services.flutterwave.base_url');
            $secretKey = config('services.flutterwave.secret_key');

            $data = [
                'amount' => $amount,
                'name' => $name,
                'interval' => $interval, // daily, weekly, monthly, quarterly, yearly
                'currency' => $currency,
                'duration' => 0, // 0 means indefinite
            ];

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $secretKey,
                'Content-Type' => 'application/json',
            ])->post($baseUrl . '/payment-plans', $data);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json()['data']
                ];
            }

            Log::error('Flutterwave Payment Plan Creation Failed', [
                'status' => $response->status(),
                'response' => $response->json()
            ]);

            return [
                'success' => false,
                'message' => 'Payment plan creation failed'
            ];

        } catch (\Exception $e) {
            Log::error('Flutterwave Payment Plan Exception', [
                'message' => $e->getMessage(),
                'data' => compact('name', 'amount', 'interval', 'currency')
            ]);

            return [
                'success' => false,
                'message' => 'Service unavailable'
            ];
        }
    }

    /**
     * Subscribe a customer to a payment plan
     */
    public function subscribeToPaymentPlan($planId, $customerEmail, $customerName, $customerPhone = null)
    {
        $paymentData = [
            'tx_ref' => $this->flutterwaveService->generateReference('SUB'),
            'amount' => 0, // Will be determined by the payment plan
            'currency' => 'NGN',
            'redirect_url' => route('subscription.callback'),
            'payment_plan' => $planId,
            'customer' => [
                'email' => $customerEmail,
                'phonenumber' => $customerPhone ?? '',
                'name' => $customerName,
            ],
            'customizations' => [
                'title' => 'Subscription Payment',
                'description' => 'Subscribe to our service',
                'logo' => asset('images/logo.png'),
            ],
        ];

        return $this->flutterwaveService->initiatePayment($paymentData);
    }

    /**
     * Get all payment plans
     */
    public function getPaymentPlans()
    {
        try {
            $baseUrl = config('services.flutterwave.base_url');
            $secretKey = config('services.flutterwave.secret_key');

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $secretKey,
            ])->get($baseUrl . '/payment-plans');

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json()['data']
                ];
            }

            return [
                'success' => false,
                'message' => 'Could not fetch payment plans'
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Service unavailable'
            ];
        }
    }

    /**
     * Get specific payment plan
     */
    public function getPaymentPlan($planId)
    {
        try {
            $baseUrl = config('services.flutterwave.base_url');
            $secretKey = config('services.flutterwave.secret_key');

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $secretKey,
            ])->get($baseUrl . "/payment-plans/{$planId}");

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json()['data']
                ];
            }

            return [
                'success' => false,
                'message' => 'Payment plan not found'
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Service unavailable'
            ];
        }
    }

    /**
     * Cancel a payment plan
     */
    public function cancelPaymentPlan($planId)
    {
        try {
            $baseUrl = config('services.flutterwave.base_url');
            $secretKey = config('services.flutterwave.secret_key');

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $secretKey,
            ])->put($baseUrl . "/payment-plans/{$planId}/cancel");

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json()['data']
                ];
            }

            return [
                'success' => false,
                'message' => 'Could not cancel payment plan'
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Service unavailable'
            ];
        }
    }

    /**
     * Get subscriptions for a customer
     */
    public function getCustomerSubscriptions($customerEmail)
    {
        try {
            $baseUrl = config('services.flutterwave.base_url');
            $secretKey = config('services.flutterwave.secret_key');

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $secretKey,
            ])->get($baseUrl . '/subscriptions', [
                'customer_email' => $customerEmail
            ]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json()['data']
                ];
            }

            return [
                'success' => false,
                'message' => 'Could not fetch subscriptions'
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Service unavailable'
            ];
        }
    }

    /**
     * Cancel a subscription
     */
    public function cancelSubscription($subscriptionId)
    {
        try {
            $baseUrl = config('services.flutterwave.base_url');
            $secretKey = config('services.flutterwave.secret_key');

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $secretKey,
            ])->put($baseUrl . "/subscriptions/{$subscriptionId}/cancel");

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json()['data']
                ];
            }

            return [
                'success' => false,
                'message' => 'Could not cancel subscription'
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Service unavailable'
            ];
        }
    }

    /**
     * Update payment plan
     */
    public function updatePaymentPlan($planId, $data)
    {
        try {
            $baseUrl = config('services.flutterwave.base_url');
            $secretKey = config('services.flutterwave.secret_key');

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $secretKey,
                'Content-Type' => 'application/json',
            ])->put($baseUrl . "/payment-plans/{$planId}", $data);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json()['data']
                ];
            }

            return [
                'success' => false,
                'message' => 'Could not update payment plan'
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Service unavailable'
            ];
        }
    }

    /**
     * Create tokenized charge (for existing customers)
     */
    public function chargeWithToken($token, $amount, $email, $currency = 'NGN')
    {
        try {
            $baseUrl = config('services.flutterwave.base_url');
            $secretKey = config('services.flutterwave.secret_key');

            $data = [
                'token' => $token,
                'currency' => $currency,
                'country' => 'NG',
                'amount' => $amount,
                'email' => $email,
                'tx_ref' => $this->flutterwaveService->generateReference('TOKEN'),
            ];

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $secretKey,
                'Content-Type' => 'application/json',
            ])->post($baseUrl . '/tokenized-charges', $data);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json()
                ];
            }

            return [
                'success' => false,
                'message' => 'Tokenized charge failed'
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Service unavailable'
            ];
        }
    }
}