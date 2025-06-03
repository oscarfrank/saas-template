<?php

namespace Modules\User\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Laravel\Socialite\Facades\Socialite;
use Modules\User\Models\User;
use Modules\User\Traits\HandlesTenancyAfterAuth;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;

class SocialAuthCallbackController extends Controller
{
    use HandlesTenancyAfterAuth;

    /**
     * Handle Google OAuth callback
     */
    public function handleGoogleCallback()
    {
        try {
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

            return $this->handleTenancyAfterAuth($user);
        } catch (\Exception $e) {
            return redirect()->route('login')->with('error', 'Google authentication failed: ' . $e->getMessage());
        }
    }

    /**
     * Handle Facebook OAuth callback
     */
    public function handleFacebookCallback()
    {
        try {
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

            return $this->handleTenancyAfterAuth($user);
        } catch (\Exception $e) {
            return redirect()->route('login')->with('error', 'Facebook authentication failed: ' . $e->getMessage());
        }
    }

    /**
     * Handle GitHub OAuth callback
     */
    public function handleGithubCallback()
    {
        try {
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

            return $this->handleTenancyAfterAuth($user);
        } catch (\Exception $e) {
            return redirect()->route('login')->with('error', 'GitHub authentication failed: ' . $e->getMessage());
        }
    }
} 