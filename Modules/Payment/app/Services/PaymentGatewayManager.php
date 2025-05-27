<?php

namespace Modules\Payment\Services;

use Exception;

use Modules\Payment\Http\Controllers\Paystack\PaystackPaymentController;
use Modules\Payment\Http\Controllers\Flutterwave\FlutterwavePaymentController;
use Modules\Payment\Http\Controllers\Stripe\StripePaymentController;


class PaymentGatewayManager
{
    public function resolve($currency)
    {

        $gateways = config('payments.gateways');
        $ngnPreferred = config('payments.ngn_priority', 'paystack');

        $enabledGateways = array_filter($gateways, fn($g) => $g['enabled']);

        // If only one gateway, use it
        if (count($enabledGateways) === 1) {
            $key = array_key_first($enabledGateways);
            return $this->getService($key);
        }

        // If Stripe + another, use Stripe for non-NGN, other for NGN
        if (isset($enabledGateways['stripe'])) {
            if ($currency === 'NGN') {
                // First try preferred gateway if enabled
                if (isset($enabledGateways[$ngnPreferred])) {
                    return $this->getService($ngnPreferred);
                }
                
                // Try any other enabled gateway except Stripe
                foreach ($enabledGateways as $key => $gateway) {
                    if ($key !== 'stripe') {
                        return $this->getService($key);
                    }
                }
                
                // If only Stripe is enabled, use it as fallback
                return $this->getService('stripe');
            }
            
            // For non-NGN, always use Stripe
            return $this->getService('stripe');
        }

        // If multiple but no Stripe, use NGN-preferred for NGN, fallback to first for others
        if ($currency === 'NGN' && isset($enabledGateways[$ngnPreferred])) {
            return $this->getService($ngnPreferred);
        }

        // Fallback to first available
        $first = array_key_first($enabledGateways);
        return $this->getService($first);
    }

    protected function getService($key)
    {
        return match ($key) {
            'paystack' => app(PaystackPaymentController::class),
            'flutterwave' => app(FlutterwavePaymentController::class),
            'stripe' => app(StripePaymentController::class),
            default => throw new Exception("Unsupported gateway: $key"),
        };
    }
}
