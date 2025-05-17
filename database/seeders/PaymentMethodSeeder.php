<?php

namespace Database\Seeders;

use App\Models\PaymentMethod;
use App\Models\User;
use Illuminate\Database\Seeder;

class PaymentMethodSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the first user or create a default one
        $user = User::first();
        if (!$user) {
            $user = User::create([
                'name' => 'System Admin',
                'email' => 'admin@example.com',
                'password' => bcrypt('password'),
            ]);
        }

        // Delete any existing payment methods for this user
        PaymentMethod::where('user_id', $user->id)->delete();

        $paymentMethods = [
            [
                'name' => 'Bank Transfer',
                'method_type' => 'bank_account',
                'is_active' => true,
                'is_default' => true,
                'is_online' => false,
                'user_id' => $user->id,
            ],
            [
                'name' => 'Card Payment',
                'method_type' => 'credit_card',
                'is_active' => true,
                'is_default' => false,
                'is_online' => true,
                'user_id' => $user->id,
            ],
            [
                'name' => 'USSD',
                'method_type' => 'payment_gateway',
                'is_active' => true,
                'is_default' => false,
                'is_online' => true,
                'user_id' => $user->id,
            ],
            [
                'name' => 'Mobile Money',
                'method_type' => 'mobile_money',
                'is_active' => true,
                'is_default' => false,
                'user_id' => $user->id,
            ],
            [
                'name' => 'Cash',
                'method_type' => 'payment_gateway',
                'is_active' => true,
                'is_default' => false,
                'is_online' => false,
                'user_id' => $user->id,
            ],
        ];

        // Create all payment methods
        foreach ($paymentMethods as $method) {
            PaymentMethod::create($method);
        }
    }
} 