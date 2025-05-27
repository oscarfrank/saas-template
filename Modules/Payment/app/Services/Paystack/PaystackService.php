<?php

namespace Modules\Payment\Services\Paystack;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;

class PaystackService
{
    protected $baseUrl;
    protected $secretKey;
    protected $publicKey;

    public function __construct()
    {
        $this->baseUrl = config('services.paystack.base_url');
        $this->secretKey = config('services.paystack.secret_key');
        $this->publicKey = config('services.paystack.public_key');
    }

    /**
     * Initialize a transaction
     */
    public function initializeTransaction(array $data)
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/transaction/initialize', $data);

            if ($response->successful()) {
                return $response->json();
            }

            throw new Exception('Failed to initialize transaction: ' . $response->body());
        } catch (Exception $e) {
            Log::error('Paystack initialization error: ' . $e->getMessage());
            throw $e;
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

            if ($response->successful()) {
                return $response->json();
            }

            throw new Exception('Failed to verify transaction: ' . $response->body());
        } catch (Exception $e) {
            Log::error('Paystack verification error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * List transactions
     */
    public function listTransactions($params = [])
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
            ])->get($this->baseUrl . '/transaction', $params);

            if ($response->successful()) {
                return $response->json();
            }

            throw new Exception('Failed to list transactions: ' . $response->body());
        } catch (Exception $e) {
            Log::error('Paystack list transactions error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Create a customer
     */
    public function createCustomer(array $data)
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/customer', $data);

            if ($response->successful()) {
                return $response->json();
            }

            throw new Exception('Failed to create customer: ' . $response->body());
        } catch (Exception $e) {
            Log::error('Paystack create customer error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Create a plan for subscriptions
     */
    public function createPlan(array $data)
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/plan', $data);

            if ($response->successful()) {
                return $response->json();
            }

            throw new Exception('Failed to create plan: ' . $response->body());
        } catch (Exception $e) {
            Log::error('Paystack create plan error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Charge authorization (for repeat payments)
     */
    public function chargeAuthorization(array $data)
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/transaction/charge_authorization', $data);

            if ($response->successful()) {
                return $response->json();
            }

            throw new Exception('Failed to charge authorization: ' . $response->body());
        } catch (Exception $e) {
            Log::error('Paystack charge authorization error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Verify webhook signature
     */
    public function verifyWebhookSignature($payload, $signature)
    {
        $computedSignature = hash_hmac('sha512', $payload, config('services.paystack.webhook_secret'));
        return hash_equals($signature, $computedSignature);
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
}
