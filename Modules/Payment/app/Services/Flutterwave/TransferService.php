<?php

namespace Modules\Payment\Services\Flutterwave;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TransferService
{
    private $flutterwaveService;

    public function __construct(FlutterwaveService $flutterwaveService)
    {
        $this->flutterwaveService = $flutterwaveService;
    }

    /**
     * Transfer to bank account
     */
    public function transferToBank($amount, $accountNumber, $bankCode, $narration = null, $reference = null)
    {
        $reference = $reference ?: $this->flutterwaveService->generateReference('TXF');
        
        $data = [
            'account_bank' => $bankCode,
            'account_number' => $accountNumber,
            'amount' => $amount,
            'narration' => $narration ?: 'Transfer from ' . config('app.name'),
            'currency' => 'NGN',
            'reference' => $reference,
            'callback_url' => route('transfer.webhook'),
            'debit_currency' => 'NGN'
        ];

        return $this->flutterwaveService->processTransfer($data);
    }

    /**
     * Transfer to mobile money
     */
    public function transferToMobileMoney($amount, $phoneNumber, $network, $reference = null)
    {
        $reference = $reference ?: $this->flutterwaveService->generateReference('TXF');
        
        $data = [
            'account_bank' => $network, // MTN, AIRTEL, etc.
            'account_number' => $phoneNumber,
            'amount' => $amount,
            'narration' => 'Mobile money transfer',
            'currency' => 'NGN',
            'reference' => $reference,
            'callback_url' => route('transfer.webhook'),
            'debit_currency' => 'NGN'
        ];

        return $this->flutterwaveService->processTransfer($data);
    }

    /**
     * Bulk transfer to multiple recipients
     */
    public function bulkTransfer(array $transfers)
    {
        try {
            $baseUrl = config('services.flutterwave.base_url');
            $secretKey = config('services.flutterwave.secret_key');

            $bulkData = [
                'title' => 'Bulk Transfer ' . now()->format('Y-m-d H:i'),
                'bulk_data' => collect($transfers)->map(function ($transfer) {
                    return [
                        'bank_code' => $transfer['bank_code'],
                        'account_number' => $transfer['account_number'],
                        'amount' => $transfer['amount'],
                        'currency' => $transfer['currency'] ?? 'NGN',
                        'narration' => $transfer['narration'] ?? 'Bulk transfer',
                        'reference' => $transfer['reference'] ?? $this->flutterwaveService->generateReference('BULK')
                    ];
                })->toArray()
            ];

            $response = Http::timeout(60)
                ->retry(2, 2000)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $secretKey,
                    'Content-Type' => 'application/json',
                ])
                ->post($baseUrl . '/bulk-transfers', $bulkData);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json()
                ];
            }

            Log::error('Flutterwave Bulk Transfer Failed', [
                'status' => $response->status(),
                'response' => $response->json()
            ]);

            return [
                'success' => false,
                'message' => 'Bulk transfer failed'
            ];

        } catch (\Exception $e) {
            Log::error('Flutterwave Bulk Transfer Exception', [
                'message' => $e->getMessage(),
                'transfers' => $transfers
            ]);

            return [
                'success' => false,
                'message' => 'Bulk transfer service unavailable'
            ];
        }
    }

    /**
     * Get transfer fee
     */
    public function getTransferFee($amount, $currency = 'NGN')
    {
        try {
            $baseUrl = config('services.flutterwave.base_url');
            $secretKey = config('services.flutterwave.secret_key');

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $secretKey,
            ])->get($baseUrl . '/transfers/fee', [
                'amount' => $amount,
                'currency' => $currency
            ]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json()['data']
                ];
            }

            return [
                'success' => false,
                'message' => 'Could not get transfer fee'
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Service unavailable'
            ];
        }
    }

    /**
     * Get wallet balance
     */
    public function getBalance($currency = 'NGN')
    {
        try {
            $baseUrl = config('services.flutterwave.base_url');
            $secretKey = config('services.flutterwave.secret_key');

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $secretKey,
            ])->get($baseUrl . '/balances');

            if ($response->successful()) {
                $balances = $response->json()['data'];
                
                // Find balance for specific currency
                $balance = collect($balances)->firstWhere('currency', $currency);
                
                return [
                    'success' => true,
                    'balance' => $balance ? $balance['available_balance'] : 0,
                    'currency' => $currency,
                    'all_balances' => $balances
                ];
            }

            return [
                'success' => false,
                'message' => 'Could not get balance'
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Service unavailable'
            ];
        }
    }

    /**
     * Verify transfer status
     */
    public function verifyTransfer($transferId)
    {
        try {
            $baseUrl = config('services.flutterwave.base_url');
            $secretKey = config('services.flutterwave.secret_key');

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $secretKey,
            ])->get($baseUrl . "/transfers/{$transferId}");

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json()['data']
                ];
            }

            return [
                'success' => false,
                'message' => 'Transfer not found'
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Verification failed'
            ];
        }
    }
}