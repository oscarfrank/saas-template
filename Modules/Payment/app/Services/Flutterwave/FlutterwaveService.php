<?php

namespace Modules\Payment\Services\Flutterwave;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;

class FlutterwaveService
{
    private $baseUrl;
    private $secretKey;
    private $publicKey;

    public function __construct()
    {
        $this->baseUrl = config('services.flutterwave.base_url', 'https://api.flutterwave.com/v3');
        $this->secretKey = config('services.flutterwave.secret_key');
        $this->publicKey = config('services.flutterwave.public_key');
    }

    /**
     * Initialize a payment
     */
    public function initiatePayment(array $data)
    {
        try {
            $response = Http::timeout(30)
                ->retry(2, 1000)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->secretKey,
                    'Content-Type' => 'application/json',
                ])
                ->post($this->baseUrl . '/payments', $data);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json()
                ];
            }

            Log::error('Flutterwave Payment Init Failed', [
                'status' => $response->status(),
                'response' => $response->json(),
                'data' => $data
            ]);

            return [
                'success' => false,
                'message' => 'Payment initialization failed',
                'data' => $response->json()
            ];

        } catch (Exception $e) {
            Log::error('Flutterwave Payment Exception', [
                'message' => $e->getMessage(),
                'data' => $data
            ]);

            return [
                'success' => false,
                'message' => 'Payment service unavailable'
            ];
        }
    }

    /**
     * Verify a transaction
     */
    public function verifyTransaction($transactionId)
    {
        try {
            $response = Http::timeout(30)
                ->retry(2, 1000)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->secretKey,
                    'Content-Type' => 'application/json',
                ])
                ->get($this->baseUrl . "/transactions/{$transactionId}/verify");

            if ($response->successful()) {
                $data = $response->json();
                
                return [
                    'success' => true,
                    'data' => $data,
                    'is_successful' => $data['status'] === 'success' && 
                                     $data['data']['status'] === 'successful'
                ];
            }

            Log::error('Flutterwave Verification Failed', [
                'transaction_id' => $transactionId,
                'status' => $response->status(),
                'response' => $response->json()
            ]);

            return [
                'success' => false,
                'message' => 'Transaction verification failed'
            ];

        } catch (Exception $e) {
            Log::error('Flutterwave Verification Exception', [
                'transaction_id' => $transactionId,
                'message' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'message' => 'Verification service unavailable'
            ];
        }
    }

    /**
     * Get all banks for a country (FIXED ENDPOINT)
     */
    public function getBanks($country = 'NG')
    {
        try {
            $response = Http::timeout(15)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->secretKey,
                    'Content-Type' => 'application/json',
                ])
                ->get($this->baseUrl . "/banks/{$country}");

            if ($response->successful()) {
                $responseData = $response->json();
                
                return [
                    'success' => true,
                    'data' => $responseData['data'] ?? []
                ];
            }

            Log::error('Flutterwave Get Banks Failed', [
                'country' => $country,
                'status' => $response->status(),
                'response' => $response->json()
            ]);

            return [
                'success' => false,
                'message' => 'Could not fetch banks',
                'details' => $response->json()
            ];

        } catch (Exception $e) {
            Log::error('Flutterwave Get Banks Exception', [
                'country' => $country,
                'message' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'message' => 'Service unavailable'
            ];
        }
    }

    /**
     * Resolve bank account (FIXED ENDPOINT)
     */
    public function resolveAccount($accountNumber, $bankCode)
    {
        try {
            $response = Http::timeout(15)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->secretKey,
                    'Content-Type' => 'application/json',
                ])
                ->post($this->baseUrl . '/accounts/resolve', [
                    'account_number' => $accountNumber,
                    'account_bank' => $bankCode
                ]);

            if ($response->successful()) {
                $responseData = $response->json();
                
                return [
                    'success' => true,
                    'data' => $responseData['data'] ?? null
                ];
            }

            Log::error('Flutterwave Resolve Account Failed', [
                'account_number' => $accountNumber,
                'bank_code' => $bankCode,
                'status' => $response->status(),
                'response' => $response->json()
            ]);

            return [
                'success' => false,
                'message' => 'Could not resolve account',
                'details' => $response->json()
            ];

        } catch (Exception $e) {
            Log::error('Flutterwave Resolve Account Exception', [
                'account_number' => $accountNumber,
                'bank_code' => $bankCode,
                'message' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'message' => 'Service unavailable'
            ];
        }
    }

    /**
     * Process transfer/payout
     */
    public function processTransfer(array $data)
    {
        try {
            $response = Http::timeout(30)
                ->retry(2, 1000)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->secretKey,
                    'Content-Type' => 'application/json',
                ])
                ->post($this->baseUrl . '/transfers', $data);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json()
                ];
            }

            Log::error('Flutterwave Transfer Failed', [
                'data' => $data,
                'status' => $response->status(),
                'response' => $response->json()
            ]);

            return [
                'success' => false,
                'message' => 'Transfer failed',
                'data' => $response->json()
            ];

        } catch (Exception $e) {
            Log::error('Flutterwave Transfer Exception', [
                'data' => $data,
                'message' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'message' => 'Transfer service unavailable'
            ];
        }
    }

    /**
     * Format payment data for Flutterwave
     */
    public function formatPaymentData($amount, $email, $name, $phone = null, $currency = 'NGN')
    {
        return [
            'tx_ref' => $this->generateReference(),
            'amount' => $amount,
            'currency' => $currency,
            'redirect_url' => route('payment.callback'),
            'payment_options' => 'card,banktransfer,ussd,mobilemoney',
            'customer' => [
                'email' => $email,
                'phonenumber' => $phone ?? '',
                'name' => $name,
            ],
            'customizations' => [
                'title' => config('app.name', 'Payment'),
                'description' => 'Payment for services',
                'logo' => asset('images/logo.png'),
            ],
        ];
    }

    /**
     * Generate unique transaction reference
     */
    public function generateReference($prefix = 'FLW')
    {
        return $prefix . '_' . uniqid() . '_' . time();
    }

    /**
     * Validate webhook signature
     */
    public function validateWebhookSignature($payload, $signature)
    {
        $secretHash = config('services.flutterwave.secret_hash');
        
        if (!$secretHash) {
            return true; // If no secret hash is set, skip validation
        }

        return hash_equals($secretHash, $signature);
    }

    /**
     * Debug method to test API connection
     */
    public function testConnection()
    {
        try {
            $response = Http::timeout(10)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->secretKey,
                    'Content-Type' => 'application/json',
                ])
                ->get($this->baseUrl . '/banks/NG');

            return [
                'success' => $response->successful(),
                'status' => $response->status(),
                'data' => $response->json(),
                'config' => [
                    'base_url' => $this->baseUrl,
                    'has_secret_key' => !empty($this->secretKey),
                    'secret_key_preview' => substr($this->secretKey, 0, 15) . '...',
                ]
            ];

        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'config' => [
                    'base_url' => $this->baseUrl,
                    'has_secret_key' => !empty($this->secretKey),
                    'secret_key_preview' => substr($this->secretKey, 0, 15) . '...',
                ]
            ];
        }
    }
}