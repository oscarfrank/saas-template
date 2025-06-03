<?php

namespace Modules\User\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Modules\User\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\View\View;
use Inertia\Inertia;
use Inertia\Response;
use Modules\User\Events\UserLoggedIn;
use Illuminate\Support\Facades\Event;
use Jenssegers\Agent\Agent;
use Modules\User\Traits\HandlesTenancyAfterAuth;

use Modules\User\Models\User;

class AuthenticatedSessionController extends Controller
{
    use HandlesTenancyAfterAuth;

    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('auth/login', [
            'canResetPassword' => true,
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse|Response
    {
        try {
            Log::info('Starting authentication process', [
                'has_code' => $request->has('code'),
                'email' => $request->email,
                'remember' => $request->boolean('remember')
            ]);

            $request->authenticate();

            // If we get here, authentication was successful
            Log::info('Authentication successful, regenerating session');

            // Regenerate the session to prevent session fixation
            $request->session()->regenerate();

            // If this was a 2FA verification, we need to ensure the user is authenticated
            if ($request->has('code') || $request->has('recovery_code')) {
                Log::info('2FA verification successful, ensuring user is authenticated');
                
                // Get the user from the request
                $user = $request->user();
                
                if (!$user) {
                    Log::warning('User not found after 2FA verification, attempting to re-authenticate');
                    // Try to find the user by email
                    $user = \Modules\User\Models\User::where('email', $request->email)->first();
                    if ($user) {
                        Auth::login($user, $request->boolean('remember'));
                        Log::info('User re-authenticated successfully');
                    } else {
                        Log::error('Could not find user after 2FA verification');
                        throw new \Exception('Authentication failed after 2FA verification');
                    }
                }

                // Double-check authentication
                if (!Auth::check()) {
                    Log::warning('User not authenticated after 2FA, attempting final authentication');
                    Auth::login($user, $request->boolean('remember'));
                }

                Log::info('Final authentication state', [
                    'authenticated' => Auth::check(),
                    'user_id' => Auth::id()
                ]);
            }

            // Get the authenticated user
            $user = Auth::user();

            // Dispatch login notification event
            try {
                $agent = new Agent();
                $deviceInfo = $agent->browser() . ' on ' . $agent->platform();
                
                Event::dispatch(new UserLoggedIn(
                    $user,
                    now()->toDateTimeString(),
                    'Unknown', // You might want to use a geolocation service to get the actual location
                    $request->ip(),
                    $deviceInfo
                ));

                Log::info('Login notification dispatched', [
                    'user_id' => $user->id,
                    'email' => $user->email
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to send login notification', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }

            return $this->handleTenancyAfterAuth($user);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::info('Validation exception during authentication', [
                'errors' => $e->errors()
            ]);
            
            // If we have a code error or recovery code error, stay on the 2FA challenge page
            if (isset($e->errors()['code']) || isset($e->errors()['recovery_code'])) {
                $user = \Modules\User\Models\User::where('email', $request->email)->first();
                return Inertia::render('auth/two-factor-challenge', [
                    'email' => $request->email,
                    'password' => $request->password,
                    'remember' => $request->boolean('remember'),
                    'method' => $user->two_factor_method,
                    'errors' => $e->errors(),
                ]);
            }
            throw $e;
        } catch (\Exception $e) {
            Log::error('Unexpected error during authentication', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
