<?php

namespace Modules\Payment\Http\Controllers\Flutterwave;

use Modules\Payment\Services\Flutterwave\FlutterwaveService; 
use Modules\Payment\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

use App\Http\Controllers\Controller;
use Modules\Loan\Models\Loan;

class FlutterwavePaymentController extends Controller
{
    protected $flutterwaveService;

    public function __construct(FlutterwaveService $flutterwaveService)
    {
        $this->flutterwaveService = app(FlutterwaveService::class);
    }

    public function initiatePayment(Request $request)
    {

        // $request->validate([
        //     'amount' => 'required|numeric|min:1',
        //     'email' => 'required|email',
        //     'name' => 'required|string|max:255',
        //     'phone' => 'nullable|string|max:20'
        // ]);

        DB::beginTransaction();
        
        try {
            // Format payment data
            // $paymentData = $this->flutterwaveService->formatPaymentData(
            //     $request->amount,
            //     $request->email,
            //     $request->name,
            //     $request->phone
            // );

           // Test data
            $paymentData = [
            'tx_ref' => 'TEST_' . uniqid(),
            'amount' => 1000,
            'currency' => 'NGN',
            'redirect_url' => 'https://larv.frank.ng/flutterwave/callback',
            'payment_options' => 'card,banktransfer,ussd',
            'customer' => [
                'email' => 'test@example.com',
                'phonenumber' => '08012345678',
                'name' => 'Test User',
            ],
            'customizations' => [
                'title' => 'Amount Top Up',
                'description' => 'Amount Top Up for user',
                'logo' => 'https://oscarmini.com/logo.png',
            ],
        ];

        // dd($result);

            // Store payment record
            // $payment = Payment::create([
            //     'tx_ref' => $paymentData['tx_ref'],
            //     'amount' => $request->amount,
            //     'currency' => 'NGN',
            //     'email' => $request->email,
            //     'name' => $request->name,
            //     'phone' => $request->phone,
            //     'status' => 'pending',
            //     'user_id' => auth()->id(),
            // ]);

            // Initialize payment with Flutterwave
            $result = $this->flutterwaveService->initiatePayment($paymentData);
            // dd($result);

            if ($result['success']) {
                DB::commit();
                return redirect($result['data']['data']['link']);
            }

            DB::rollBack();
            return back()->with('error', $result['message'] ?? 'Payment initialization failed');

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Payment Initiation Error: ' . $e->getMessage());
            return back()->with('error', 'Something went wrong. Please try again.');
        }
    }

    public function handleCallback(Request $request)
    {
        $transactionId = $request->transaction_id;
        $txRef = $request->tx_ref;
        $status = $request->status;


        $loan = Loan::create([
            // Required fields from migration
            'user_id' => 1, // Using authenticated user
            'reference_number' => json_encode($request->all()), // Generating unique reference
            'amount' => 1000,
            'currency_id' => 1, // Assuming 1 is the default currency ID
            'interest_rate' => 0.05, // 5% interest rate
            'duration_days' => 30, // 30 days duration
            'status' => 'pending',
            'package_id' => 1,
            
            // Optional fields with defaults
            'interest_type' => 'simple',
            'interest_calculation' => 'monthly',
            'interest_payment_frequency' => 'monthly',
            'allows_early_repayment' => true,
            'has_collateral' => false,
            'auto_payments_enabled' => false,
            
            // Timestamps
            'submitted_at' => now(),
        ]);

        return response('OK', 200);




        if (!$transactionId || !$txRef) {
            return redirect()->route('payment.failed')
                   ->with('error', 'Invalid payment response');
        }

        // Find the payment record
        $payment = Payment::where('tx_ref', $txRef)->first();
        
        if (!$payment) {
            return redirect()->route('payment.failed')
                   ->with('error', 'Payment record not found');
        }

        // Verify transaction with Flutterwave
        $verification = $this->flutterwaveService->verifyTransaction($transactionId);

        if ($verification['success'] && $verification['is_successful']) {
            // Payment successful
            $payment->update([
                'status' => 'completed',
                'flw_transaction_id' => $verification['data']['data']['id'],
                'flw_ref' => $verification['data']['data']['flw_ref'] ?? null,
                'verified_at' => now(),
            ]);

            // Trigger any post-payment actions
            $this->handleSuccessfulPayment($payment);

            return redirect()->route('payment.success')
                   ->with('success', 'Payment completed successfully!');
        } else {
            // Payment failed
            $payment->update([
                'status' => 'failed',
                'failure_reason' => $verification['message'] ?? 'Payment verification failed'
            ]);

            return redirect()->route('payment.failed')
                   ->with('error', 'Payment verification failed');
        }
    }

    public function handleWebhook(Request $request)
    {
        $signature = $request->header('verif-hash');
        $payload = $request->all();

        // Validate webhook signature
        if (!$this->flutterwaveService->validateWebhookSignature($payload, $signature)) {
            return response('Unauthorized', 401);
        }
        // Add a new loan
        $loan = Loan::create([
            // Required fields from migration
            'user_id' => 1, // Using authenticated user
            // 'reference_number' => 'WEBHOOK_' . uniqid(), // Generating unique reference
            'reference_number' => json_encode($payload), // Generating unique reference
            'amount' => 1000,
            'currency_id' => 1, // Assuming 1 is the default currency ID
            'interest_rate' => 0.05, // 5% interest rate
            'duration_days' => 30, // 30 days duration
            'status' => 'pending',
            'package_id' => 2,
            
            // Optional fields with defaults
            'interest_type' => 'simple',
            'interest_calculation' => 'monthly',
            'interest_payment_frequency' => 'monthly',
            'allows_early_repayment' => true,
            'has_collateral' => false,
            'auto_payments_enabled' => false,
            
            // Timestamps
            'submitted_at' => now(),
        ]);

        return response('OK', 200);

        if (isset($payload['event']) && $payload['event'] === 'charge.completed') {
            $txRef = $payload['data']['tx_ref'];
            $status = $payload['data']['status'];

            $payment = Payment::where('tx_ref', $txRef)->first();
            
            if ($payment) {
                if ($status === 'successful') {
                    $payment->update([
                        'status' => 'completed',
                        'flw_transaction_id' => $payload['data']['id'],
                        'flw_ref' => $payload['data']['flw_ref'] ?? null,
                        'verified_at' => now(),
                    ]);
                    
                    $this->handleSuccessfulPayment($payment);
                } else {
                    $payment->update(['status' => 'failed']);
                }
            }
        }

        return response('OK', 200);
    }

    private function handleSuccessfulPayment(Payment $payment)
    {
        // Add your business logic here:
        // - Send confirmation email
        // - Update user account/subscription
        // - Grant access to services
        // - Send notifications
        // - Update inventory
        
        // Example:
        // Mail::to($payment->email)->send(new PaymentConfirmation($payment));
        // event(new PaymentCompleted($payment));
    }

    
    // Admin/Testing methods
    public function verifyTransaction($transactionId)
    {
        if (!app()->environment('local')) {
            abort(404);
        }

        $result = $this->flutterwaveService->verifyTransaction($transactionId);
        return response()->json($result);
    }

    public function getBanks()
    {
        $result = $this->flutterwaveService->getBanks();
        return response()->json($result);
    }

}