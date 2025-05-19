<?php

namespace Database\Seeders;

use Modules\User\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        $this->call([
            // UserSeeder::class,
            // PaymentMethodSeeder::class,
            // ProductSeeder::class,
            // TransactionSeeder::class,
            // LoanSeeder::class,
            // EmailTemplateSeeder::class,
        ]);
    }
}
