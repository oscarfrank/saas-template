<?php

namespace Modules\Payment\Database\Seeders;

use Illuminate\Database\Seeder;

use Modules\Payment\Database\Seeders\PaymentMethodSeeder;
use Modules\Payment\Database\Seeders\SubscriptionPlanSeeder;
class PaymentDatabaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->call([
            PaymentMethodSeeder::class,
            SubscriptionPlanSeeder::class,
        ]);
    }
}
