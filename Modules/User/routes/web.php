<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

use Laravel\Socialite\Facades\Socialite;


// Local Modular Dependencies
use Modules\User\Http\Controllers\UserController; 
use Modules\User\Http\Controllers\RoleController;

use Modules\User\Models\User;

use Modules\User\Http\Controllers\Auth\AuthenticatedSessionController;
use Modules\User\Http\Controllers\Auth\ConfirmablePasswordController;
use Modules\User\Http\Controllers\Auth\EmailVerificationNotificationController;
use Modules\User\Http\Controllers\Auth\EmailVerificationPromptController;
use Modules\User\Http\Controllers\Auth\NewPasswordController;
use Modules\User\Http\Controllers\Auth\PasswordResetLinkController;
use Modules\User\Http\Controllers\Auth\RegisteredUserController;
use Modules\User\Http\Controllers\Auth\VerifyEmailController;

use App\Traits\LevelBasedAuthorization;
use App\Helpers\AccessLevel;


Route::middleware(['auth', 'verified'])->group(function () {

    
    // ======================================================================
    // ========================== ADMIN ROUTES ==============================
    // ======================================================================
    // This section contains all routes related to administrative functions
    // including user management, role permissions, and system configuration.
    // These routes are protected by authentication and admin middleware.
    // ======================================================================

    // Admin routes group
    Route::prefix('admin')->middleware(['except.user'])->group(function () {

        // Role and Permission Management
        Route::get('roles', [RoleController::class, 'index'])->middleware(['role:super-admin'])->name('roles.index');
        Route::post('roles', [RoleController::class, 'store'])->middleware(['role:super-admin'])->name('roles.store');
        Route::put('roles/{role}', [RoleController::class, 'update'])->middleware(['role:super-admin'])->name('roles.update');
        Route::delete('roles/{role}', [RoleController::class, 'destroy'])->middleware(['role:super-admin'])->name('roles.destroy');

        // User Management
        Route::get('users', [UserController::class, 'index'])->name('admin.users.index');
        Route::get('users/create', [UserController::class, 'create'])->name('admin.users.create');
        Route::post('users', [UserController::class, 'store'])->name('admin.users.store');
        Route::get('users/{user}', [UserController::class, 'show'])->name('admin.users.show');
        Route::get('users/{user}/edit', [UserController::class, 'edit'])->name('admin.users.edit');
        Route::put('users/{user}', [UserController::class, 'update'])->name('admin.users.update');
        Route::delete('users/{user}', [UserController::class, 'destroy'])->name('admin.users.destroy');
        Route::post('users/export', [UserController::class, 'export'])->name('admin.users.export');

    });



});



Route::middleware('guest')->group(function () {

    Route::get('auth/google/redirect', function(){
        return Socialite::driver('google')->redirect();
    })->name('auth.google');

    Route::get('auth/google/callback', function(){
        $googleUser = Socialite::driver('google')->user();

        // Split the name into first and last name
        $nameParts = explode(' ', $googleUser->name);
        $firstName = $nameParts[0];
        $lastName = count($nameParts) > 1 ? implode(' ', array_slice($nameParts, 1)) : '';

        $user = User::updateOrCreate([
            'email' => $googleUser->email,
        ], [
            'first_name' => $firstName,
            'last_name' => $lastName,
            'password' => bcrypt(Str::random(10)),
            'email_verified_at' => now(),
            'google_id' => $googleUser->id,
            'oauth_provider' => 'google',
        ]);

        // Store OAuth tokens
        $user->setOAuthTokens('google', [
            'access_token' => $googleUser->token,
            'refresh_token' => $googleUser->refreshToken,
            'expires_at' => now()->addSeconds($googleUser->expiresIn),
        ]);

        $user->assignRole('user');

        Auth::login($user);

        // Check if 2FA is required
        if ($user->two_factor_secret) {
            return Inertia::render('auth/login', [
                'canResetPassword' => true,
                'status' => session('status'),
                'requiresTwoFactor' => true,
                'email' => $user->email,
                'password' => '',
                'remember' => false,
            ]);
        }

        return redirect()->route('dashboard');
    })->name('auth.google.callback');

    Route::get('auth/facebook/redirect', function(){
        return Socialite::driver('facebook')->redirect();
    })->name('auth.facebook');

    Route::get('auth/facebook/callback', function(){
        $facebookUser = Socialite::driver('facebook')->user();

        // Split the name into first and last name
        $nameParts = explode(' ', $facebookUser->name);
        $firstName = $nameParts[0];
        $lastName = count($nameParts) > 1 ? implode(' ', array_slice($nameParts, 1)) : '';

        $user = User::updateOrCreate([
            'email' => $facebookUser->email,
        ], [
            'first_name' => $firstName,
            'last_name' => $lastName,
            'password' => bcrypt(Str::random(10)),
            'email_verified_at' => now(),
            'facebook_id' => $facebookUser->id,
            'oauth_provider' => 'facebook',
        ]);

        // Store OAuth tokens
        $user->setOAuthTokens('facebook', [
            'access_token' => $facebookUser->token,
            'refresh_token' => $facebookUser->refreshToken,
            'expires_at' => now()->addSeconds($facebookUser->expiresIn),
        ]);

        $user->assignRole('user');

        Auth::login($user);

        // Check if 2FA is required
        if ($user->two_factor_secret) {
            return Inertia::render('auth/login', [
                'canResetPassword' => true,
                'status' => session('status'),
                'requiresTwoFactor' => true,
                'email' => $user->email,
                'password' => '',
                'remember' => false,
            ]);
        }

        return redirect()->route('dashboard');
    })->name('auth.facebook.callback');

    Route::get('auth/github/redirect', function(){
        return Socialite::driver('github')->redirect();
    })->name('auth.github');

    Route::get('auth/github/callback', function(){
        $githubUser = Socialite::driver('github')->user();

        // GitHub might not provide a full name, so we'll use the nickname
        $nameParts = explode(' ', $githubUser->name ?? $githubUser->nickname);
        $firstName = $nameParts[0];
        $lastName = count($nameParts) > 1 ? implode(' ', array_slice($nameParts, 1)) : '';

        $user = User::updateOrCreate([
            'email' => $githubUser->email,
        ], [
            'first_name' => $firstName,
            'last_name' => $lastName,
            'password' => bcrypt(Str::random(10)),
            'email_verified_at' => now(),
            'github_id' => $githubUser->id,
            'oauth_provider' => 'github',
        ]);

        // Store OAuth tokens
        $user->setOAuthTokens('github', [
            'access_token' => $githubUser->token,
            'refresh_token' => $githubUser->refreshToken,
            'expires_at' => now()->addSeconds($githubUser->expiresIn),
        ]);

        $user->assignRole('user');

        Auth::login($user);

        // Check if 2FA is required
        if ($user->two_factor_secret) {
            return Inertia::render('auth/login', [
                'canResetPassword' => true,
                'status' => session('status'),
                'requiresTwoFactor' => true,
                'email' => $user->email,
                'password' => '',
                'remember' => false,
            ]);
        }

        return redirect()->route('dashboard');
    })->name('auth.github.callback');

    Route::get('register', [RegisteredUserController::class, 'create'])
        ->name('register');

    Route::post('register', [RegisteredUserController::class, 'store']);

    Route::get('login', [AuthenticatedSessionController::class, 'create'])
        ->name('login');

    Route::post('login', [AuthenticatedSessionController::class, 'store']);

    Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])
        ->name('password.request');

    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])
        ->name('password.email');

    Route::get('reset-password/{token}', [NewPasswordController::class, 'create'])
        ->name('password.reset');

    Route::post('reset-password', [NewPasswordController::class, 'store'])
        ->name('password.store');
});

Route::middleware('auth')->group(function () {
    Route::get('verify-email', EmailVerificationPromptController::class)
        ->name('verification.notice');

    Route::get('verify-email/{id}/{hash}', VerifyEmailController::class)
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');

    Route::post('email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('verification.send');

    Route::get('confirm-password', [ConfirmablePasswordController::class, 'show'])
        ->name('password.confirm');

    Route::post('confirm-password', [ConfirmablePasswordController::class, 'store']);

    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');
});
