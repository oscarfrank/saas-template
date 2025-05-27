<?php

namespace Modules\Payment\Http\Controllers\Stripe;

use App\Models\Dump;
use Laravel\Cashier\Http\Controllers\WebhookController as CashierController;
use Illuminate\Http\Request;

class StripeWebhookController extends CashierController
{
    /**
     * Handle a Stripe webhook call.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handleWebhook(Request $request)
    {
        // Dump the webhook payload
        Dump::create([
            'payload' => $request->all(),
            'source' => 'stripe'
        ]);

        return parent::handleWebhook($request);
    }
} 