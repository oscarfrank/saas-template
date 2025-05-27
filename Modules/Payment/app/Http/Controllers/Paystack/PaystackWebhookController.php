<?php

namespace Modules\Payment\Http\Controllers\Paystack;


use Illuminate\Http\Request;
use Modules\Payment\Services\Paystack\PaystackService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

use App\Http\Controllers\Controller;

class PaystackPaymentController extends Controller
{
    protected $paystackService;

    public function __construct(PaystackService $paystackService)
    {
        $this->paystackService = app(PaystackService::class);
    }

    /**
     * Handle Paystack webhooks
     */
    public function handle(Request $request)
    {
        // Get the signature from headers
        $signature = $request->header('x-paystack-signature');
        
        if (!$signature) {
            Log::warning('Webhook received without signature');
            return response()->json(['message' => 'No signature provided'], 400);
        }

        // Get raw payload
        $payload = $request->getContent();

        // Verify webhook signature
        if (!$this->paystackService->verifyWebhookSignature($payload, $signature)) {
            Log::warning('Webhook signature verification failed');
            return response()->json(['message' => 'Invalid signature'], 400);
        }

        // Parse the event
        $event = json_decode($payload, true);

        if (!$event) {
            Log::error('Invalid JSON payload in webhook');
            return response()->json(['message' => 'Invalid JSON'], 400);
        }

        // Log the event
        Log::info('Webhook received', ['event' => $event['event'], 'data' => $event['data']]);

        try {
            // Handle different event types
            switch ($event['event']) {
                case 'charge.success':
                    $this->handleChargeSuccess($event['data']);
                    break;

                case 'charge.failed':
                    $this->handleChargeFailed($event['data']);
                    break;

                case 'transfer.success':
                    $this->handleTransferSuccess($event['data']);
                    break;

                case 'transfer.failed':
                    $this->handleTransferFailed($event['data']);
                    break;

                case 'subscription.create':
                    $this->handleSubscriptionCreate($event['data']);
                    break;

                case 'subscription.not_renew':
                    $this->handleSubscriptionNotRenew($event['data']);
                    break;

                case 'invoice.create':
                    $this->handleInvoiceCreate($event['data']);
                    break;

                case 'invoice.payment_failed':
                    $this->handleInvoicePaymentFailed($event['data']);
                    break;

                default:
                    Log::info('Unhandled webhook event: ' . $event['event']);
                    break;
            }

            return response()->json(['message' => 'Webhook processed successfully'], 200);

        } catch (\Exception $e) {
            Log::error('Webhook processing error: ' . $e->getMessage(), [
                'event' => $event,
                'exception' => $e
            ]);

            return response()->json(['message' => 'Webhook processing failed'], 500);
        }
    }

    /**
     * Handle successful charge
     */
    private function handleChargeSuccess($data)
    {
        $reference = $data['reference'];

        // Update transaction status
        $updated = DB::table('transactions')
            ->where('reference', $reference)
            ->update([
                'status' => 'completed',
                'paystack_reference' => $data['id'],
                'gateway_response' => $data['gateway_response'],
                'paid_at' => $data['paid_at'],
                'updated_at' => now(),
            ]);

        if ($updated) {
            Log::info("Transaction {$reference} marked as successful via webhook");
            
            // Process successful payment
            $this->processSuccessfulPayment($data);
        } else {
            Log::warning("Transaction {$reference} not found in database");
        }
    }

    /**
     * Handle failed charge
     */
    private function handleChargeFailed($data)
    {
        $reference = $data['reference'];

        DB::table('transactions')
            ->where('reference', $reference)
            ->update([
                'status' => 'failed',
                'gateway_response' => $data['gateway_response'] ?? 'Payment failed',
                'updated_at' => now(),
            ]);

        Log::info("Transaction {$reference} marked as failed via webhook");
    }

    /**
     * Handle subscription creation
     */
    private function handleSubscriptionCreate($data)
    {
        // Store subscription data
        DB::table('subscriptions')->updateOrInsert(
            ['subscription_code' => $data['subscription_code']],
            [
                'customer_id' => $data['customer']['id'],
                'customer_email' => $data['customer']['email'],
                'plan_code' => $data['plan']['plan_code'],
                'status' => $data['status'],
                'amount' => $data['amount'],
                'next_payment_date' => $data['next_payment_date'],
                'created_at' => $data['createdAt'],
                'updated_at' => now(),
            ]
        );

        Log::info("Subscription {$data['subscription_code']} created via webhook");
    }

    /**
     * Handle subscription not renewing
     */
    private function handleSubscriptionNotRenew($data)
    {
        DB::table('subscriptions')
            ->where('subscription_code', $data['subscription_code'])
            ->update([
                'status' => 'cancelled',
                'updated_at' => now(),
            ]);

        Log::info("Subscription {$data['subscription_code']} cancelled via webhook");
    }

    /**
     * Handle invoice creation
     */
    private function handleInvoiceCreate($data)
    {
        // Log invoice creation for subscription billing
        Log::info("Invoice created for subscription", [
            'subscription_code' => $data['subscription']['subscription_code'],
            'amount' => $data['amount'],
            'due_date' => $data['due_date']
        ]);
    }

    /**
     * Handle invoice payment failure
     */
    private function handleInvoicePaymentFailed($data)
    {
        // Handle failed subscription payment
        Log::warning("Invoice payment failed", [
            'subscription_code' => $data['subscription']['subscription_code'],
            'amount' => $data['amount']
        ]);

        // You might want to notify the customer or retry payment
    }

    /**
     * Process successful payment
     */
    private function processSuccessfulPayment($data)
    {
        // Implement your business logic here
        Log::info('Processing successful payment from webhook', [
            'reference' => $data['reference'],
            'amount' => $data['amount'],
            'customer_email' => $data['customer']['email']
        ]);

        // Example: Send confirmation email, update user account, etc.
    }
}