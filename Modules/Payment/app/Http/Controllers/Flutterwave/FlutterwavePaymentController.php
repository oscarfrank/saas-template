<?php

namespace Modules\Payment\Http\Controllers\Flutterwave;

use Modules\Payment\Services\Flutterwave\FlutterwaveService; 
use Modules\Payment\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Dump;
use App\Http\Controllers\Controller;
use Modules\Loan\Models\Loan;
use Modules\Loan\Models\LoanPayment;
use Modules\Loan\Http\Controllers\LoanPaymentController;
use Modules\Payment\Models\Currency; 


class FlutterwavePaymentController extends Controller
{
    protected $flutterwaveService;

    public function __construct(FlutterwaveService $flutterwaveService)
    {
        $this->flutterwaveService = app(FlutterwaveService::class);
    }

    public function initiatePayment(Request $request)
    {
        $user = auth()->user();

        $request->validate([
            'amount' => 'required|numeric|min:1',
        ]);

        DB::beginTransaction();
        
        try {


           // Payment Data
            $paymentData = [
                'tx_ref' => $request->txRef,
                'amount' => $request->amount,
                'currency' => Currency::find($request->currency_id)->code,
                'redirect_url' => 'https://larv.frank.ng/flutterwave/callback',

                // 'redirect_url' => route('user-loans.show', [ 'tenant' => tenant('id'), 'loan' => $request->loan_id]),

                'payment_options' => 'card,banktransfer,ussd',
                'customer' => [
                    'email' => $user->email,
                    // 'phonenumber' => $user->phone,
                    'name' => $user->first_name . ' ' . $user->last_name,
                ],
                'customizations' => [
                    'title' => 'Payment',
                    'description' => 'Payment for ' . $request->payment_type,
                    'logo' => config('app.logo'),
                ],
            ];

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

            if ($result['success']) {
                DB::commit();
                $redirectUrl = $result['data']['data']['link'];
                return $redirectUrl;
            }

            DB::rollBack();
            return back()->with('error', $result['message'] ?? 'Payment initialization failed');

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('FlutterwaveController: Payment Initiation Error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return back()->with('error', 'Something went wrong. Please try again.');
        }
    }

    public function handleCallback(Request $request)
    {

        $transactionId = $request->transaction_id;
        $txRef = $request->tx_ref;
        $status = $request->status;
        // Create a new request with transformed status
        $transformedRequest = new Request([
            'status' => $status,
            'transaction_id' => $transactionId,
            'tx_ref' => $txRef,
            'notes' => 'Flutterwave Payment'
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
        $verification = $this->flutterwaveService->verifyTransaction($transactionId);

        if ($verification['success'] && $verification['is_successful']) {
            try {
                // Send to Approval Calculations
                $loanPaymentController = new LoanPaymentController();
                $result = $loanPaymentController->handleCallback($transformedRequest, $payment);

                return redirect()->route('dashboard')->with('success', 'Payment processed successfully');
            } catch (\Exception $e) {
                \Log::error('FlutterwaveController: Error in LoanPaymentController->handleCallback', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                
                return response()->json([
                    'error' => 'Error processing payment',
                    'message' => $e->getMessage()
                ], 500);
            }
        } else {
            \Log::error('FlutterwaveController: Payment verification failed', [
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

    public function handleWebhook(Request $request)
    {
        $signature = $request->header('verif-hash');
        $payload = $request->all();

        // Validate webhook signature
        if (!$this->flutterwaveService->validateWebhookSignature($payload, $signature)) {
            return response('Unauthorized', 401);
        }

        if (isset($payload['event']) && $payload['event'] === 'charge.completed') {
            $txRef = $payload['data']['tx_ref'];
            $status = $payload['data']['status'];

            // $payment = Payment::where('tx_ref', $txRef)->first();
            $payment = LoanPayment::where('reference_number', $txRef)->first();

                $transformedRequest = new Request([
                    'status' => "completed",
                    'tx_ref' => $txRef,
                    'notes' => 'Flutterwave Payment'
                ]);
                
            
            if ($payment) {


                if ($status === 'successful') {
                    try {
                        // Send to Approval Calculations
                        $loanPaymentController = new LoanPaymentController();
                        $result = $loanPaymentController->handleCallback($transformedRequest, $payment);


                        // $payment->update([
                        //     'status' => 'completed',
                        //     'flw_transaction_id' => $payload['data']['id'],
                        //     'flw_ref' => $payload['data']['flw_ref'] ?? null,
                        //     'verified_at' => now(),
                        // ]);

                        $this->handleSuccessfulPayment($payment);

        
                        return redirect()->route('dashboard')->with('success', 'Payment processed successfully');
    
        
                    } catch (\Exception $e) {
                        \Log::error('FlutterwaveController: Error in LoanPaymentController->handleCallback', [
                            'error' => $e->getMessage(),
                            'trace' => $e->getTraceAsString()
                        ]);
                        
                        return response()->json([
                            'error' => 'Error processing payment',
                            'message' => $e->getMessage()
                        ], 500);
                    }
                    

                    return response()->json([
                        'message' => 'Payment processed successfully',
                        'result' => $result
                    ]);
                        
                } else {
                    $payment->update(['status' => 'failed']);
                }
            }
        }

        return response('OK', 200);
    }

    private function handleSuccessfulPayment(LoanPayment $payment)
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
        $pay = $payment;
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