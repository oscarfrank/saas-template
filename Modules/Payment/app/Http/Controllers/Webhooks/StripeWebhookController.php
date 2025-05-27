<?php

namespace Modules\Payment\app\Http\Controllers\Webhooks;

use Laravel\Cashier\Http\Controllers\WebhookController as CashierController;

class StripeWebhookController extends CashierController
{
    /**
     * Handle invoice payment succeeded.
     *
     * @param  array  $payload
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handleInvoicePaymentSucceeded($payload)
    {
        // Handle the event (e.g., activate features, send notification)
        $subscription = $this->getSubscriptionByStripeId($payload['data']['object']['subscription']);
        
        if ($subscription) {
            // Someone paid! Do something special for them...
            // Change the User Role to Admin
            $user = $subscription->user;
            $user->assignRole('theplan');


            // Maybe update a "paid until" date in your database
        }
        
        // Don't forget to call the parent method to ensure default behavior still occurs
        return parent::handleInvoicePaymentSucceeded($payload);
    }
}