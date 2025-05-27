<?php

namespace Modules\Payment\Http\Controllers\Flutterwave;

use Modules\Payment\Services\Flutterwave\SubscriptionService;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class SubscriptionController extends Controller
{
    protected $subscriptionService;

    public function __construct(SubscriptionService $subscriptionService)
    {
        $this->subscriptionService = $subscriptionService;
    }

    public function subscribe(Request $request)
    {
        $request->validate([
            'plan_id' => 'required|string',
            'email' => 'required|email',
            'name' => 'required|string'
        ]);

        $result = $this->subscriptionService->subscribeToPaymentPlan(
            $request->plan_id,
            $request->email,
            $request->name,
            $request->phone
        );

        if ($result['success']) {
            return redirect($result['data']['data']['link']);
        }

        return back()->with('error', $result['message']);
    }
}