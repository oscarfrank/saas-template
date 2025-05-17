<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;

return new class extends Migration
{
        /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create roles
        $roles = [
            ['name' => 'super-admin', 'level' => 90],
            ['name' => 'admin', 'level' => 80],
            ['name' => 'manager', 'level' => 50],
            ['name' => 'loan-officer', 'level' => 30],
            ['name' => 'investment-officer', 'level' => 30],
            ['name' => 'support', 'level' => 20],
            ['name' => 'lender', 'level' => 5],
            ['name' => 'borrower', 'level' => 5],
            ['name' => 'user', 'level' => 1],
        ];

        foreach ($roles as $role) {
            Role::create([
                'name' => $role['name'],
                'guard_name' => 'web',
                'level' => $role['level']
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

        // Assign roles to specific users
        try {
            // Find user with ID 1 and assign super-admin role
            $user1 = User::find(1);
            if ($user1) {
                $user1->assignRole('super-admin');
            }

            // Find user with ID 2 and assign admin role
            $user2 = User::find(2);
            if ($user2) {
                $user2->assignRole('admin');
            }

            // Find user with ID 3 and assign user role
            $user3 = User::find(3);
            if ($user3) {
                $user3->assignRole('user');
            }
        } catch (\Exception $e) {
            // Log the error but don't fail the migration
            \Log::error('Error assigning roles to users: ' . $e->getMessage());
        }
    }

     /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove roles from specific users
        try {
            $user1 = User::find(1);
            if ($user1) {
                $user1->syncRoles([]);
            }

            $user2 = User::find(2);
            if ($user2) {
                $user2->syncRoles([]);
            }

            $user3 = User::find(3);
            if ($user3) {
                $user3->syncRoles([]);
            }
        } catch (\Exception $e) {
            \Log::error('Error removing roles from users: ' . $e->getMessage());
        }

        // Get all roles
        $roles = Role::all();
        
        // Remove all permissions from roles and delete roles
        foreach ($roles as $role) {
            $role->syncPermissions([]);
            $role->delete();
        }
        
        // Delete all permissions
        $permissions = Permission::all();
        foreach ($permissions as $permission) {
            $permission->delete();
        }
    }
};
