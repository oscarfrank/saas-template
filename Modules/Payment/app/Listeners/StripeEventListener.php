<?php

namespace Modules\Payment\Listeners;

// use App\Notifications\PaymentSuccessful;
use Laravel\Cashier\Events\WebhookReceived;

use Modules\User\Models\User;
use Modules\Payment\Models\Customer;

class StripeEventListener
{
    public function handle(WebhookReceived $event)
    {
        if ($event->payload['type'] === 'invoice.payment_succeeded') {
            $user = $this->getUserFromStripeCustomerId(
                $event->payload['data']['object']['customer']
            );
            
            if ($user) {
                $amount = $event->payload['data']['object']['amount_paid'] / 100;
                // $user->notify(new PaymentSuccessful($amount));
            }
        }
    }
    
    protected function getUserFromStripeCustomerId($stripeId)
    {
        // If using dedicated Customer model
        $customer = Customer::where('stripe_id', $stripeId)->first();
        return $customer ? $customer->user : null;
        
        // If using User with Billable trait directly
        // return User::where('stripe_id', $stripeId)->first();
    }
}