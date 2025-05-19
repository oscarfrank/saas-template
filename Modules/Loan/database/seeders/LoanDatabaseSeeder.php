<?php

namespace Modules\Loan\Database\Seeders;

use Illuminate\Database\Seeder;

class LoanDatabaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->call([
            // LoanSeeder::class,
            LoanEmailTemplateSeeder::class,
        ]);
    }
}
