<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Permission;

class PermissionRoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create roles
        $roles = [
            'super-admin',
            'admin',
            'manager',
            'loan-officer',
            'investment-officer',
            'support',
            'lender',
            'borrower',
            'user',
        ];

        foreach ($roles as $role) {
            Role::create([
                'name' => $role,
                'guard_name' => 'web'
            ]);
        }

        // Create permissions
        $permissions = [
            // User Management
            'create-user',
            'edit-user',
            'delete-user',
            'view-users',
            
            // Loan Management
            'create-loan',
            'edit-loan',
            'delete-loan',
            'approve-loan',
            'reject-loan',
            'view-loans',
            
            // Investment Management
            'create-investment',
            'edit-investment',
            'delete-investment',
            'approve-investment',
            'reject-investment',
            'view-investments',
            
            // System Settings
            'manage-settings',
            'view-reports',
            'export-data',
            
            // Profile Management
            'edit-profile',
            'view-profile'
        ];

        foreach ($permissions as $permission) {
            Permission::create([
                'name' => $permission,
                'guard_name' => 'web'
            ]);
        }

        // Assign permissions to roles
        $superAdmin = Role::where('name', 'super-admin')->first();
        $superAdmin->givePermissionTo(Permission::all());

        $admin = Role::where('name', 'admin')->first();
        $admin->givePermissionTo([
            'create-user', 'edit-user', 'delete-user', 'view-users',
            'create-loan', 'edit-loan', 'delete-loan', 'approve-loan', 'reject-loan', 'view-loans',
            'create-investment', 'edit-investment', 'delete-investment', 'approve-investment', 'reject-investment', 'view-investments',
            'manage-settings', 'view-reports', 'export-data',
            'edit-profile', 'view-profile'
        ]);

        $manager = Role::where('name', 'manager')->first();
        $manager->givePermissionTo([
            'view-users',
            'create-loan', 'edit-loan', 'approve-loan', 'reject-loan', 'view-loans',
            'create-investment', 'edit-investment', 'approve-investment', 'reject-investment', 'view-investments',
            'view-reports', 'export-data',
            'edit-profile', 'view-profile'
        ]);

        $loanOfficer = Role::where('name', 'loan-officer')->first();
        $loanOfficer->givePermissionTo([
            'create-loan', 'edit-loan', 'approve-loan', 'reject-loan', 'view-loans',
            'view-reports',
            'edit-profile', 'view-profile'
        ]);

        $investmentOfficer = Role::where('name', 'investment-officer')->first();
        $investmentOfficer->givePermissionTo([
            'create-investment', 'edit-investment', 'approve-investment', 'reject-investment', 'view-investments',
            'view-reports',
            'edit-profile', 'view-profile'
        ]);

        $support = Role::where('name', 'support')->first();
        $support->givePermissionTo([
            'view-users',
            'view-loans',
            'view-investments',
            'edit-profile', 'view-profile'
        ]);

        $lender = Role::where('name', 'lender')->first();
        $lender->givePermissionTo([
            'view-loans',
            'view-investments',
            'edit-profile', 'view-profile'
        ]);

        $borrower = Role::where('name', 'borrower')->first();
        $borrower->givePermissionTo([
            'view-loans',
            'edit-profile', 'view-profile'
        ]);

        $user = Role::where('name', 'user')->first();
        $user->givePermissionTo([
            'edit-profile', 'view-profile'
        ]);
    }
} 