<?php

namespace Modules\Payment\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Modules\Payment\Models\Currency;

class SubscriptionPlanSeeder extends Seeder
{
    public function run(): void
    {
        // Get USD currency
        $usd = Currency::where('code', 'USD')->first();
        
        if (!$usd) {
            $usd = Currency::create([
                'code' => 'USD',
                'name' => 'US Dollar',
                'symbol' => '$',
                'type' => 'fiat',
                'decimal_places' => 2,
                'decimal_separator' => '.',
                'thousand_separator' => ',',
                'symbol_position' => 'before',
                'is_active' => true,
                'is_default' => true
            ]);
        }

        $plans = [
            // Monthly Plans
            [
                'name' => 'Basic Monthly',
                'slug' => 'basic-monthly',
                'description' => 'Perfect for individuals and small projects',
                'price' => 9.99,
                'currency_id' => $usd->id,
                'billing_period' => 'monthly',
                'features' => json_encode([
                    '1 User',
                    'Basic Support',
                    '1GB Storage',
                    'Basic Analytics'
                ]),
                'is_active' => true,
                'is_featured' => false,
                'sort_order' => 1,
                'provider_plans' => json_encode([
                    'stripe' => ['product_id' => 'prod_SLrvivd2ipcehZ', 'price_id' => 'price_1RR9w6R9ZcfVoXsQZe99J48q'],
                    'paypal' => ['product_id' => 'prod_SLrvivd2ipcehZ', 'price_id' => 'price_1RR9w6R9ZcfVoXsQZe99J48q']
                ])
            ],
            [
                'name' => 'Standard Monthly',
                'slug' => 'standard-monthly',
                'description' => 'Ideal for growing businesses',
                'price' => 14.99,
                'currency_id' => $usd->id,
                'billing_period' => 'monthly',
                'features' => json_encode([
                    '5 Users',
                    'Priority Support',
                    '10GB Storage',
                    'Advanced Analytics',
                    'API Access'
                ]),
                'is_active' => true,
                'is_featured' => true,
                'sort_order' => 2,
                'provider_plans' => json_encode([
                    'stripe' => ['product_id' => 'prod_SLrvkIyjn7trX5', 'price_id' => 'price_1RRABHR9ZcfVoXsQI2IMSSE5'],
                    'paypal' => ['product_id' => 'prod_SLrvkIyjn7trX5', 'price_id' => 'price_1RRABHR9ZcfVoXsQI2IMSSE5']
                ])
            ],
            [
                'name' => 'Premium Monthly',
                'slug' => 'premium-monthly',
                'description' => 'For large organizations with advanced needs',
                'price' => 19.99,
                'currency_id' => $usd->id,
                'billing_period' => 'monthly',
                'features' => json_encode([
                    'Unlimited Users',
                    '24/7 Support',
                    'Unlimited Storage',
                    'Custom Analytics',
                    'API Access',
                    'Custom Integrations',
                    'Dedicated Account Manager'
                ]),
                'is_active' => true,
                'is_featured' => false,
                'sort_order' => 3,
                'provider_plans' => json_encode([
                    'stripe' => ['product_id' => 'prod_SLrvivd2ipcehZ', 'price_id' => 'price_1RRABbR9ZcfVoXsQ8T7yaF7E'],
                    'paypal' => ['product_id' => 'prod_SLrvivd2ipcehZ', 'price_id' => 'price_1RRABbR9ZcfVoXsQ8T7yaF7E']
                ])
            ],
            // Yearly Plans (with 20% discount)
            [
                'name' => 'Basic Yearly',
                'slug' => 'basic-yearly',
                'description' => 'Perfect for individuals and small projects - Save 20% with yearly billing',
                'price' => 86.40, // $9.99 * 12 * 0.8
                'currency_id' => $usd->id,
                'billing_period' => 'yearly',
                'features' => json_encode([
                    '1 User',
                    'Basic Support',
                    '1GB Storage',
                    'Basic Analytics',
                    '20% Yearly Discount'
                ]),
                'is_active' => true,
                'is_featured' => false,
                'sort_order' => 4,
                'provider_plans' => json_encode([
                    'stripe' => ['product_id' => 'prod_SLrvivd2ipcehZ', 'price_id' => 'price_1RR9w6R9ZcfVoXsQZe99J48q'],
                    'paypal' => ['product_id' => 'prod_SLrvivd2ipcehZ', 'price_id' => 'price_1RR9w6R9ZcfVoXsQZe99J48q']
                ])
            ],
            [
                'name' => 'Pro Yearly',
                'slug' => 'pro-yearly',
                'description' => 'Ideal for growing businesses - Save 20% with yearly billing',
                'price' => 278.40, // $29 * 12 * 0.8
                'currency_id' => $usd->id,
                'billing_period' => 'yearly',
                'features' => json_encode([
                    '5 Users',
                    'Priority Support',
                    '10GB Storage',
                    'Advanced Analytics',
                    'API Access',
                    '20% Yearly Discount'
                ]),
                'is_active' => true,
                'is_featured' => true,
                'sort_order' => 5,
                'provider_plans' => json_encode([
                    'stripe' => ['product_id' => 'prod_SLrvkIyjn7trX5', 'price_id' => 'price_1RRABHR9ZcfVoXsQI2IMSSE5'],
                    'paypal' => ['product_id' => 'prod_SLrvkIyjn7trX5', 'price_id' => 'price_1RRABHR9ZcfVoXsQI2IMSSE5']
                ])
            ],
            [
                'name' => 'Enterprise Yearly',
                'slug' => 'enterprise-yearly',
                'description' => 'For large organizations with advanced needs - Save 20% with yearly billing',
                'price' => 950.40, // $99 * 12 * 0.8
                'currency_id' => $usd->id,
                'billing_period' => 'yearly',
                'features' => json_encode([
                    'Unlimited Users',
                    '24/7 Support',
                    'Unlimited Storage',
                    'Custom Analytics',
                    'API Access',
                    'Custom Integrations',
                    'Dedicated Account Manager',
                    '20% Yearly Discount'
                ]),
                'is_active' => true,
                'is_featured' => false,
                'sort_order' => 6,
                'provider_plans' => json_encode([
                    'stripe' => ['product_id' => 'prod_SLrvivd2ipcehZ', 'price_id' => 'price_1RRABbR9ZcfVoXsQ8T7yaF7E'],
                    'paypal' => ['product_id' => 'prod_SLrvivd2ipcehZ', 'price_id' => 'price_1RRABbR9ZcfVoXsQ8T7yaF7E']
                ])
            ]
        ];

        foreach ($plans as $plan) {
            DB::table('subscription_plans')->insert($plan);
        }
    }
} 