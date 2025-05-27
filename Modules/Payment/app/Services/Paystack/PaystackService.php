<?php

namespace Modules\Payment\Services\Paystack;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;
use Modules\Payment\Models\Payment;
use Modules\Payment\Models\Currency;

class PaystackService
{
    protected $baseUrl;
    protected $secretKey;
    protected $publicKey;
    protected $webhookSecret;

    public function __construct()
    {
        $this->baseUrl = config('services.paystack.base_url');
        $this->secretKey = config('services.paystack.secret_key');
        $this->publicKey = config('services.paystack.public_key');
        $this->webhookSecret = config('services.paystack.webhook_secret');
    }

    /**
     * Initialize a transaction (Legacy method for backward compatibility)
     */
    public function initializeTransaction(array $data)
    {
        return $this->initiatePayment($data);
    }

    /**
     * Initialize a payment transaction
     */
    public function initiatePayment(array $data)
    {
        try {
            // Ensure amount is in kobo (subunit)
            if (!isset($data['amount_in_subunit'])) {
                $data['amount'] = $this->convertToSubunit($data['amount'], $data['currency'] ?? 'NGN');
            }

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/transaction/initialize', $data);

            if ($response->successful()) {
                $result = $response->json();
                return [
                    'success' => true,
                    'data' => [
                        'authorization_url' => $result['data']['authorization_url'],
                        'access_code' => $result['data']['access_code'],
                        'reference' => $result['data']['reference'],
                    ]
                ];
            }

            return [
                'success' => false,
                'message' => $response->json()['message'] ?? 'Payment initialization failed'
            ];

        } catch (Exception $e) {
            Log::error('Paystack initialization error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Payment initialization failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Verify a transaction
     */
    public function verifyTransaction($reference)
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
            ])->get($this->baseUrl . '/transaction/verify/' . $reference);

            \Log::info('Paystack verify transaction response', [
                'response' => $response->json()
            ]);
            // dd("WWWW");

            if ($response->successful()) {
                $result = $response->json();
                return [
                    'success' => true,
                    'is_successful' => isset($result['data']) && $result['data']['status'] === 'success',
                    'data' => $result['data'] ?? []
                ];

            }

            return [
                'success' => false,
                'message' => $response->json()['message'] ?? 'Transaction verification failed'
            ];

        } catch (Exception $e) {
            Log::error('Paystack verification error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Transaction verification failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * List transactions with pagination
     */
    public function listTransactions($params = [])
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
            ])->get($this->baseUrl . '/transaction', $params);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json()['data']
                ];
            }

            return [
                'success' => false,
                'message' => $response->json()['message'] ?? 'Failed to list transactions'
            ];

        } catch (Exception $e) {
            Log::error('Paystack list transactions error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to list transactions: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Create or update a customer
     */
    public function createCustomer(array $data)
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/customer', $data);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json()['data']
                ];
            }

            return [
                'success' => false,
                'message' => $response->json()['message'] ?? 'Failed to create customer'
            ];

        } catch (Exception $e) {
            Log::error('Paystack create customer error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to create customer: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Create a subscription plan
     */
    public function createPlan(array $data)
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/plan', $data);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json()['data']
                ];
            }

            return [
                'success' => false,
                'message' => $response->json()['message'] ?? 'Failed to create plan'
            ];

        } catch (Exception $e) {
            Log::error('Paystack create plan error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to create plan: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Charge a saved authorization
     */
    public function chargeAuthorization(array $data)
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/transaction/charge_authorization', $data);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json()['data']
                ];
            }

            return [
                'success' => false,
                'message' => $response->json()['message'] ?? 'Failed to charge authorization'
            ];

        } catch (Exception $e) {
            Log::error('Paystack charge authorization error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to charge authorization: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Validate webhook signature
     * 
     * @param string $payload The raw request body as string
     * @param string $signature The x-paystack-signature header
     * @return bool
     */
    public function validateWebhookSignature($payload, $signature)
    {
        if (empty($signature)) {
            \Log::error('Paystack webhook: Empty signature');
            return false;
        }

        try {
            // Create HMAC hash using the webhook secret key and raw payload
            $computedSignature = hash_hmac('sha512', $payload, $this->secretKey);
            
            // Log for debugging
            \Log::info('Paystack webhook signature validation', [
                'computed' => $computedSignature,
                'received' => $signature,
                'raw_payload' => $payload
            ]);

            // Compare the computed signature with the one from Paystack
            return hash_equals($signature, $computedSignature);
        } catch (\Exception $e) {
            \Log::error('Paystack webhook: Signature validation error', [
                'error' => $e->getMessage(),
                'raw_payload' => $payload
            ]);
            return false;
        }
    }

    /**
     * Convert amount to subunit (kobo for NGN)
     */
    public function convertToSubunit($amount, $currency = 'NGN')
    {
        // For NGN, multiply by 100 to convert to kobo
        return intval($amount * 100);
    }

    /**
     * Convert amount from subunit
     */
    public function convertFromSubunit($amount, $currency = 'NGN')
    {
        // For NGN, divide by 100 to convert from kobo
        return $amount / 100;
    }

    /**
     * Get list of supported banks
     */
    public function getBanks()
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
            ])->get($this->baseUrl . '/bank');

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json()['data']
                ];
            }

            return [
                'success' => false,
                'message' => $response->json()['message'] ?? 'Failed to get banks'
            ];

        } catch (Exception $e) {
            Log::error('Paystack get banks error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to get banks: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Resolve bank account number
     */
    public function resolveBankAccount($accountNumber, $bankCode)
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
            ])->get($this->baseUrl . '/bank/resolve', [
                'account_number' => $accountNumber,
                'bank_code' => $bankCode
            ]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json()['data']
                ];
            }

            return [
                'success' => false,
                'message' => $response->json()['message'] ?? 'Failed to resolve bank account'
            ];

        } catch (Exception $e) {
            Log::error('Paystack resolve bank account error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to resolve bank account: ' . $e->getMessage()
            ];
        }
    }
}
