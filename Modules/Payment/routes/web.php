<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Local Modular Dependencies
use Modules\Payment\Http\Controllers\PaymentController;
use Modules\Payment\Http\Controllers\Stripe\StripePaymentController;
use Modules\Payment\Http\Controllers\Paystack\PaystackPaymentController;
use Modules\Payment\Http\Controllers\Paystack\PaystackWebhookController;
use Modules\Payment\Http\Controllers\CurrencyController;
use Modules\Payment\Http\Controllers\SubscriptionPlanController;
use Modules\Payment\Http\Controllers\Flutterwave\FlutterwavePaymentController;

use App\Traits\LevelBasedAuthorization;
use App\Helpers\AccessLevel;

// ======================================================================
// ====================== WEBHOOK ROUTES ================================
// ======================================================================
Route::post(
    'stripe/webhook',
    [\Laravel\Cashier\Http\Controllers\WebhookController::class, 'handleWebhook']
)->name('cashier.webhook');

// ======================================================================
// ====================== AUTHENTICATED ROUTES ==========================
// ======================================================================
Route::middleware(['auth', 'verified'])->group(function () {
    // Billing Settings
    Route::get('/settings/billing', [PaymentController::class, 'billing'])
        ->name('settings.billing');

    // ======================================================================
    // ====================== ADMIN ROUTES ==================================
    // ======================================================================
    Route::prefix('admin')->middleware(['except.user'])->group(function () {
        // Currency Management
        Route::resource('currencies', CurrencyController::class);
        Route::post('/currencies/{currency}/set-default', [CurrencyController::class, 'setDefault'])
            ->name('currencies.set-default');
        Route::post('/currencies/{currency}/toggle-active', [CurrencyController::class, 'toggleActive'])
            ->name('currencies.toggle-active');

        // Subscription Management
        Route::resource('subscription-plans', SubscriptionPlanController::class);
        Route::post('/subscription-plans/{subscriptionPlan}/toggle-active', [SubscriptionPlanController::class, 'toggleActive'])
            ->name('subscription-plans.toggle-active');
    });
});

// ======================================================================
// ====================== PAYMENT ROUTES ================================
// ======================================================================
Route::middleware(['web', 'auth'])->group(function () {
    // General Payment Routes
    Route::post('/payment/fund-balance', [StripePaymentController::class, 'fundBalance']) ->name('payment.fund-balance');
    Route::post('/checkout/single', [StripePaymentController::class, 'checkoutSinglePurchase'])->name('checkout.single');
    Route::post('/checkout/subscription', [StripePaymentController::class, 'checkoutSubscription'])->name('checkout.subscription');
    Route::get('/payment/success', [StripePaymentController::class, 'handlePaymentSuccess'])->name('payment.success');
    Route::get('/payment/cancel', [StripePaymentController::class, 'handlePaymentCancel'])->name('payment.cancel');

    // Flutterwave Payment Routes
    Route::post('flutterwave/initiate', [FlutterwavePaymentController::class, 'initiatePayment'])
        ->name('flutterwave.initiate');
    Route::get('flutterwave/verify/{transaction_id}', [FlutterwavePaymentController::class, 'verifyTransaction'])
        ->name('flutterwave.verify')
        ->middleware('local');

    // Paystack Payment Routes
    Route::post('paystack/initialize', [PaystackPaymentController::class, 'initializePayment']);
});

// ======================================================================
// ====================== PUBLIC PAYMENT ROUTES =========================
// ======================================================================
// Flutterwave Public Routes
Route::get('flutterwave/callback', [FlutterwavePaymentController::class, 'handleCallback'])->name('flutterwave.callback');
Route::post('flutterwave/webhooks', [FlutterwavePaymentController::class, 'handleWebhook'])->name('flutterwave.webhooks');
Route::get('flutterwave/banks', [FlutterwavePaymentController::class, 'getBanks'])->name('flutterwave.banks');
Route::get('flutterwave/debug', [FlutterwavePaymentController::class, 'debugPayment'])->name('flutterwave.debug');
Route::get('flutterwave/initiate', [FlutterwavePaymentController::class, 'initiatePayment'])->name('initiate');

// Paystack Public Routes
Route::post('paystack/initialize', [PaystackPaymentController::class, 'initializePayment']);
Route::get('paystack/callback', [PaystackPaymentController::class, 'handleCallback']);
Route::post('paystack/payment/verify/{reference}', [PaystackPaymentController::class, 'verifyPayment']);
Route::post('paystack/webhooks', [PaystackWebhookController::class, 'handle']);
