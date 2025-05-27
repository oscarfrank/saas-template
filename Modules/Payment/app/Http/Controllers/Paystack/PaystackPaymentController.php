<?php

namespace Modules\Payment\Http\Controllers\Paystack;

use App\Http\Controllers\Controller;
use Modules\Payment\Services\Paystack\PaystackService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use App\Models\Dump;
use Modules\Payment\Models\Currency;
use Modules\Loan\Models\LoanPayment;
use Modules\Loan\Http\Controllers\LoanPaymentController;


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
    public function initiatePayment(Request $request)
    {

        $user = auth()->user();
        $request->validate([
            'amount' => 'required|numeric|min:1',
        ]);

        DB::beginTransaction();


        try {
            // Generate unique reference
            $reference = 'PAY_PST_' . time() . '_' . Str::random(10);

            $data = [
                'email' => $user->email,
                'amount' => $request->amount,
                'reference' =>$request->txRef,
                // 'currency' => 'NGN',
                'currency' => Currency::find($request->currency_id)->code,
                'callback_url' => 'https://larv.frank.ng/paystack/callback',
                // 'callback_url' => $request->callback_url ?? url('/payment/callback'),
                'metadata' => $request->metadata ?? [],
            ];

            // // Store transaction in database (optional)
            // DB::table('transactions')->insert([
            //     'reference' => $reference,
            //     'email' => $request->email,
            //     'amount' => $request->amount,
            //     'currency' => $data['currency'],
            //     'status' => 'pending',
            //     'created_at' => now(),
            //     'updated_at' => now(),
            // ]);

            $response = $this->paystackService->initializeTransaction($data);

            if ($response['success']) {

                    DB::commit();

                    $redirectUrl = $response['data']['authorization_url'];
                    return $redirectUrl;
                
                // return response()->json([
                //     'success' => true,
                //     'data' => $response['data']
                // ]);
            }

            DB::rollBack();
            return back()->with('error', $result['message'] ?? 'Payment initialization failed');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Something went wrong. Please try again.');
            
            // return response()->json([
            //     'success' => false,
            //     'message' => 'Payment initialization failed'
            // ], 500);
        }
    }

    /**
     * Handle payment callback
     */
    public function handleCallback(Request $request)
    {

        $transactionId = $request->trxref;
        $txRef = $request->reference;
        // Create a new request with transformed status

        $transformedRequest = new Request([
            'transaction_id' => $transactionId,
            'tx_ref' => $txRef,
            'notes' => 'Paystack Payment',
            'status' => "completed"
        ]);

        // Find the payment record
        $payment = LoanPayment::where('reference_number', $txRef)->first();
        
        if (!$payment) {
            return response()->json([
                'error' => 'Payment record not found',
                'tx_ref' => $txRef
            ], 404);
        }

        // Verify transaction with Flutterwave
            $verification = $this->verifyPayment($transactionId);

            // dd($verification);

            if ($verification['success'] && $verification['data']['status'] === 'success') {

                try {
                    // Send to Approval Calculations
                    $loanPaymentController = new LoanPaymentController();
                    $result = $loanPaymentController->handleCallback($transformedRequest, $payment);
    
                    return redirect()->route('dashboard')->with('success', 'Payment processed successfully');
                } catch (\Exception $e) {
                    \Log::error('PaystackController: Error in LoanPaymentController->handleCallback', [
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                    
                    return response()->json([
                        'error' => 'Error processing payment',
                        'message' => $e->getMessage()
                    ], 500);
                }

            }
            else {
                \Log::error('PaystackController: Payment verification failed', [
                    'verification' => $verification
                ]);
                
                $payment->update([
                    'status' => 'failed',
                    'failure_reason' => $verification['message'] ?? 'Payment verification failed'
                ]);
    
                return response()->json([
                    'error' => 'Payment verification failed',
                    'verification' => $verification
                ], 400);
            }


    }

    /**
     * Verify payment (API endpoint)
     */
    public function verifyPayment($reference)
    {
        try {
            $response = $this->paystackService->verifyTransaction($reference);


            if ($response['success']) {

                return $response;

                // return response()->json([
                //     'success' => true,
                //     'data' => $response['data']
                // ]);
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


    public function handleWebhook(Request $request)
    {

        // Get the signature and raw request body
        $signature = $request->header('x-paystack-signature');
        $rawPayload = $request->getContent();

        // Validate webhook signature using raw payload
        if (!$this->paystackService->validateWebhookSignature($rawPayload, $signature)) {
            \Log::error('Paystack webhook: Invalid signature', [
                'signature' => $signature,
                'raw_payload' => $rawPayload
            ]);
            return response('Unauthorized', 401);
        }

        // Decode the payload for processing
        $payload = json_decode($rawPayload, true);

        // Paystack sends different event types, we're interested in charge.success
        if (isset($payload['event']) && $payload['event'] === 'charge.success') {
            $reference = $payload['data']['reference'];
            $status = $payload['data']['status'];

            \Log::info('Paystack webhook: Processing charge.success', [
                'reference' => $reference,
                'status' => $status,
                'amount' => $payload['data']['amount'],
                'customer_email' => $payload['data']['customer']['email']
            ]);

            // Find the payment record
            $payment = LoanPayment::where('reference_number', $reference)->first();

            if ($payment) {
                if ($status === 'success') {
                    try {
                        // Create transformed request for loan payment controller
                        $transformedRequest = new Request([
                            'status' => "completed",
                            'tx_ref' => $reference,
                            'notes' => 'Paystack Payment',
                        ]);

                        // Send to Approval Calculations
                        $loanPaymentController = new LoanPaymentController();
                        $result = $loanPaymentController->handleCallback($transformedRequest, $payment);

                        // $this->handleSuccessfulPayment($payment);

                        return redirect()->route('dashboard')->with('success', 'Payment processed successfully');

                        return response()->json([
                            'message' => 'Payment processed successfully',
                            'result' => $result
                        ]);

                    } catch (\Exception $e) {
                        \Log::error('PaystackController: Error in LoanPaymentController->handleCallback', [
                            'error' => $e->getMessage(),
                            'trace' => $e->getTraceAsString(),
                            'reference' => $reference
                        ]);
                        
                        return response()->json([
                            'error' => 'Error processing payment',
                            'message' => $e->getMessage()
                        ], 500);
                    }
                } else {
                    $payment->update([
                        'status' => 'failed',
                        'verified_at' => now()
                    ]);

                    \Log::warning('Paystack webhook: Payment failed', [
                        'reference' => $reference,
                        'reason' => $payload['data']['gateway_response'] ?? 'Payment failed'
                    ]);
                }
            } else {
                \Log::warning('Paystack webhook: Payment record not found', [
                    'reference' => $reference
                ]);
            }
        }

        return response('OK', 200);
    }
}
