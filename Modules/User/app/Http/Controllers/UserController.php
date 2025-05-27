<?php

namespace Modules\User\Http\Controllers;
use Modules\User\Models\User;
use Spatie\Permission\Models\Role;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use League\Csv\Writer;
use Illuminate\Support\Str;

use App\Http\Controllers\Controller;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with('roles');

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Sorting
        if ($request->has('sort') && $request->has('direction')) {
            $query->orderBy($request->sort, $request->direction);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        // Pagination
        $perPage = $request->input('per_page', 10);
        $users = $query->paginate($perPage);

        return Inertia::render('users/index', [
            'users' => $users->items(),
            'pagination' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    public function create()
    {
        $roles = Role::all();
        return Inertia::render('users/create', [
            'roles' => $roles,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role' => ['required', 'string', 'exists:roles,name'],
        ]);

        $user = User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $user->assignRoleByName($request->role);

        return redirect()->route('admin.users.index');
    }

    public function show(User $user)
    {
        $user->load('roles');
        return Inertia::render('users/show', [
            'user' => $user,
        ]);
    }

    public function edit(User $user)
    {
        $roles = Role::all();
        $user->load('roles');
        return Inertia::render('users/edit', [
            'user' => $user,
            'roles' => $roles,
        ]);
    }

    public function update(Request $request, User $user)
    {
        $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'role' => ['required', 'string', 'exists:roles,name'],
        ]);

        $user->update([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
        ]);

        if ($request->filled('password')) {
            $request->validate([
                'password' => ['required', 'confirmed', Rules\Password::defaults()],
            ]);
            $user->update([
                'password' => Hash::make($request->password),
            ]);
        }

        $user->syncRoles([$request->role]);

        return redirect()->route('admin.users.index');
    }

    public function destroy(User $user)
    {
        try {
            DB::beginTransaction();

            // Prevent deleting the last admin user
            $adminRole = Role::where('name', 'admin')->first();
            if ($adminRole) {
                $adminUsers = User::whereHas('roles', function ($query) use ($adminRole) {
                    $query->where('id', $adminRole->id);
                })->count();

                if ($adminUsers === 1 && $user->roles->contains($adminRole)) {
                    return response()->json([
                        'error' => 'Cannot delete the last admin user.'
                    ], 422);
                }
            }

            // Delete related records in order of dependency
            // 1. Delete notifications first (they reference user_id)
            DB::table('notifications')
                ->where('user_id', $user->id)
                ->orWhere('created_by', $user->id)
                ->delete();

            // 2. Delete KYC verifications
            DB::table('kyc_verifications')
                ->where('user_id', $user->id)
                ->orWhere('verified_by', $user->id)
                ->delete();

            // 3. Delete payment methods
            DB::table('payment_methods')
                ->where('user_id', $user->id)
                ->delete();

            // 4. Delete loan payments and borrow payments
            DB::table('loan_payments')
                ->where('recorded_by', $user->id)
                ->orWhere('adjusted_by', $user->id)
                ->delete();

            DB::table('borrow_payments')
                ->where('processed_by', $user->id)
                ->orWhere('adjusted_by', $user->id)
                ->delete();

            // 5. Delete loans and borrows
            DB::table('loans')
                ->where('user_id', $user->id)
                ->delete();

            DB::table('borrows')
                ->where('user_id', $user->id)
                ->delete();

            // 7. Set null for foreign keys in transactions
            DB::table('transactions')
                ->where('sender_id', $user->id)
                ->orWhere('recipient_id', $user->id)
                ->orWhere('created_by', $user->id)
                ->orWhere('processed_by', $user->id)
                ->orWhere('adjusted_by', $user->id)
                ->orWhere('reviewed_by', $user->id)
                ->update([
                    'sender_id' => null,
                    'recipient_id' => null,
                    'created_by' => null,
                    'processed_by' => null,
                    'adjusted_by' => null,
                    'reviewed_by' => null
                ]);

            // 8. Set null for foreign keys in loan packages and borrow packages
            DB::table('loan_packages')
                ->where('created_by', $user->id)
                ->update(['created_by' => null]);

            DB::table('borrow_packages')
                ->where('created_by', $user->id)
                ->update(['created_by' => null]);

            // 9. Detach all roles
            $user->roles()->detach();

            // 10. Finally delete the user
            $user->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'User deleted successfully.'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Failed to delete user. ' . $e->getMessage()
            ], 500);
        }
    }

    public function export(Request $request)
    {
        $format = $request->input('format', 'csv');
        $users = User::with('roles')->get();

        if ($format === 'csv') {
            $headers = ['First Name', 'Last Name', 'Email', 'Roles', 'Created At'];
            $data = $users->map(function ($user) {
                return [
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'email' => $user->email,
                    'roles' => $user->roles->pluck('name')->join(', '),
                    'created_at' => $user->created_at->format('Y-m-d H:i:s')
                ];
            })->toArray();

            return response()->json([
                'format' => 'csv',
                'headers' => $headers,
                'data' => $data,
                'filename' => 'users_' . date('Y-m-d') . '.csv'
            ]);
        }

        if ($format === 'json') {
            $data = $users->map(function ($user) {
                return [
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'email' => $user->email,
                    'roles' => $user->roles->pluck('name'),
                    'created_at' => $user->created_at->format('Y-m-d H:i:s')
                ];
            });

            return response()->json([
                'format' => 'json',
                'data' => $data,
                'filename' => 'users_' . date('Y-m-d') . '.json'
            ]);
        }

        return response()->json(['error' => 'Invalid format'], 400);
    }
} 