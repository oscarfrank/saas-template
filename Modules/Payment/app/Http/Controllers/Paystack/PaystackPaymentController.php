<?php

namespace Modules\Payment\Http\Controllers\Paystack;

use App\Http\Controllers\Controller;
use Modules\Payment\Services\Paystack\PaystackService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PaystackPaymentController extends Controller
{
    protected $paystackService;

    public function __construct(PaystackService $paystackService)
    {
        $this->paystackService = app(PaystackService::class);
    }

    /**
     * Initialize payment
     */
    public function initializePayment(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'amount' => 'required|numeric|min:1',
            'currency' => 'sometimes|string|max:3',
            'callback_url' => 'sometimes|url',
            'metadata' => 'sometimes|array',
        ]);

        try {
            // Generate unique reference
            $reference = 'txn_' . time() . '_' . Str::random(10);

            // Convert amount to subunit
            $amountInSubunit = $this->paystackService->convertToSubunit($request->amount);

            $data = [
                'email' => $request->email,
                'amount' => $amountInSubunit,
                'reference' => $reference,
                'currency' => $request->currency ?? config('paystack.currency'),
                'callback_url' => $request->callback_url ?? url('/payment/callback'),
                'metadata' => $request->metadata ?? [],
            ];

            // Store transaction in database (optional)
            DB::table('transactions')->insert([
                'reference' => $reference,
                'email' => $request->email,
                'amount' => $request->amount,
                'currency' => $data['currency'],
                'status' => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $response = $this->paystackService->initializeTransaction($data);

            if ($response['status']) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'authorization_url' => $response['data']['authorization_url'],
                        'access_code' => $response['data']['access_code'],
                        'reference' => $response['data']['reference'],
                    ]
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => $response['message'] ?? 'Payment initialization failed'
            ], 400);

        } catch (\Exception $e) {
            Log::error('Payment initialization error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Payment initialization failed'
            ], 500);
        }
    }

    /**
     * Handle payment callback
     */
    public function handleCallback(Request $request)
    {
        $reference = $request->query('reference');

        if (!$reference) {
            return redirect('/payment/failed')->with('error', 'Invalid payment reference');
        }

        try {
            $response = $this->paystackService->verifyTransaction($reference);

            if ($response['status'] && $response['data']['status'] === 'success') {
                // Update transaction status
                DB::table('transactions')
                    ->where('reference', $reference)
                    ->update([
                        'status' => 'completed',
                        'paystack_reference' => $response['data']['id'],
                        'gateway_response' => $response['data']['gateway_response'],
                        'paid_at' => $response['data']['paid_at'],
                        'updated_at' => now(),
                    ]);

                // Process successful payment (deliver value to customer)
                $this->processSuccessfulPayment($response['data']);

                return redirect('/payment/success')->with('success', 'Payment successful');
            }

            return redirect('/payment/failed')->with('error', 'Payment verification failed');

        } catch (\Exception $e) {
            Log::error('Payment callback error: ' . $e->getMessage());
            return redirect('/payment/failed')->with('error', 'Payment verification failed');
        }
    }

    /**
     * Verify payment (API endpoint)
     */
    public function verifyPayment($reference)
    {
        try {
            $response = $this->paystackService->verifyTransaction($reference);

            if ($response['status']) {
                // Update local transaction record
                $transaction = DB::table('transactions')
                    ->where('reference', $reference)
                    ->first();

                if ($transaction && $response['data']['status'] === 'success') {
                    DB::table('transactions')
                        ->where('reference', $reference)
                        ->update([
                            'status' => 'completed',
                            'paystack_reference' => $response['data']['id'],
                            'gateway_response' => $response['data']['gateway_response'],
                            'paid_at' => $response['data']['paid_at'],
                            'updated_at' => now(),
                        ]);

                    // Verify amount matches
                    $expectedAmount = $this->paystackService->convertToSubunit($transaction->amount);
                    if ($response['data']['amount'] != $expectedAmount) {
                        Log::warning("Amount mismatch for transaction {$reference}");
                        return response()->json([
                            'success' => false,
                            'message' => 'Amount verification failed'
                        ], 400);
                    }

                    $this->processSuccessfulPayment($response['data']);
                }

                return response()->json([
                    'success' => true,
                    'data' => $response['data']
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => $response['message'] ?? 'Verification failed'
            ], 400);

        } catch (\Exception $e) {
            Log::error('Payment verification error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Verification failed'
            ], 500);
        }
    }

    /**
     * Process successful payment
     */
    private function processSuccessfulPayment($transactionData)
    {
        // Implement your business logic here
        // e.g., update user account, send confirmation email, etc.
        
        Log::info('Processing successful payment', [
            'reference' => $transactionData['reference'],
            'amount' => $transactionData['amount'],
            'customer_email' => $transactionData['customer']['email']
        ]);

        // Example: Update user account balance, send email, etc.
    }
}
