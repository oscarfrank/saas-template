<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    public function up()
    {
        // Admin User
        DB::table('users')->insert([
            'id' => 1,
            'first_name' => 'Admin',
            'last_name' => 'User',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        DB::table('users')->insert([
            'id' => 2,
            'first_name' => 'Oscar',
            'last_name' => 'Frank',
            'email' => 'oscar@localhost.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Premium Client
        DB::table('users')->insert([
            'id' => 3,
            'first_name' => 'Premium',
            'last_name' => 'Client',
            'email' => 'premium@example.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // VIP Investor
        DB::table('users')->insert([
            'id' => 4,
            'first_name' => 'VIP',
            'last_name' => 'Investor',
            'email' => 'vip@example.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Crypto Client
        DB::table('users')->insert([
            'id' => 5,
            'first_name' => 'Crypto',
            'last_name' => 'Client',
            'email' => 'crypto@example.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
            'created_at' => now(),
            'updated_at' => now()
        ]);

    }

    public function down()
    {
        DB::table('users')->whereIn('id', [1, 2, 3, 4])->delete();
    }
}; 