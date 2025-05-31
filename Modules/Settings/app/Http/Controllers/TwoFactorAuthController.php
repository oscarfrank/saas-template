<?php

namespace Modules\Settings\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Laravel\Fortify\Actions\EnableTwoFactorAuthentication;
use Laravel\Fortify\Actions\DisableTwoFactorAuthentication;
use Laravel\Fortify\Actions\GenerateNewRecoveryCodes;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Modules\User\Events\TwoFactorAuthenticationCodeSent;
use Modules\User\Events\TwoFactorAuthenticationEnabled;
use Modules\User\Events\TwoFactorAuthenticationDisabled;
use Illuminate\Support\Facades\Event;
use Modules\Settings\Traits\GeneratesTwoFactorCode;

class TwoFactorAuthController extends Controller
{
    use GeneratesTwoFactorCode;

    /**
     * Show the 2FA settings page.
     */
    public function edit(): Response
    {
        $user = auth()->user();
        $enabled = $user->two_factor_secret !== null;
        $showingQrCode = false;
        $showingRecoveryCodes = false;
        $qrCode = null;
        $recoveryCodes = null;

        // Check if we're in setup mode
        if (session('two_factor_setup_secret')) {
            $showingQrCode = true;
            $qrCode = session('two_factor_setup_qr_code');
        } else if ($enabled) {
            $showingQrCode = true;
            $qrCode = $user->two_factor_secret ? app('pragmarx.google2fa')->getQRCodeInline(
                config('app.name'),
                $user->email,
                decrypt($user->two_factor_secret)
            ) : null;

            if ($user->two_factor_recovery_codes) {
                $showingRecoveryCodes = true;
                $recoveryCodes = json_decode(decrypt($user->two_factor_recovery_codes), true);
            }
        }

        return Inertia::render('settings/two-factor-auth', [
            'enabled' => $enabled,
            'showingQrCode' => $showingQrCode,
            'showingRecoveryCodes' => $showingRecoveryCodes,
            'qrCode' => $qrCode,
            'recoveryCodes' => $recoveryCodes,
            'method' => session('two_factor_setup_method') ?? $user->two_factor_method ?? 'authenticator',
            'setup' => session('two_factor_setup_secret') !== null,
        ]);
    }

    /**
     * Enable 2FA for the user.
     */
    public function enable(Request $request)
    {
        \Log::info('2FA Enable Request:', [
            'method' => $request->method,
            'all' => $request->all()
        ]);

        $request->validate([
            'method' => ['required', 'string', 'in:authenticator,email'],
        ]);

        $user = $request->user();
        
        \Log::info('User details:', [
            'id' => $user->id,
            'email' => $user->email,
            'has_2fa' => !is_null($user->two_factor_secret)
        ]);
        
        if ($user->two_factor_secret) {
            return back()->with('error', 'Two-factor authentication is already enabled.');
        }

        // Generate the secret but don't enable 2FA yet
        $secret = app('pragmarx.google2fa')->generateSecretKey();
        
        \Log::info('Generated secret for 2FA setup');
        
        // Store the secret and method temporarily in the session
        session([
            'two_factor_setup_secret' => encrypt($secret),
            'two_factor_setup_method' => $request->method,
        ]);

        // If email method is selected, send the first code
        if ($request->method === 'email') {
            \Log::info('Attempting to send email code for 2FA setup');
            $result = $this->generateAndSendTwoFactorCode($user);
            
            if (!$result['success']) {
                \Log::error('Failed to send initial 2FA email code');
                return back()->with('error', $result['error']);
            }
            
            \Log::info('Successfully sent initial 2FA email code');
            return redirect()->route('two-factor-auth.edit')->with('status', 'Please verify your code to enable two-factor authentication.');
        }

        // For authenticator method, generate the QR code
        $google2fa = app('pragmarx.google2fa');
        $qrCode = $google2fa->getQRCodeInline(
            config('app.name'),
            $user->email,
            $secret
        );

        \Log::info('Generated QR code for authenticator setup', [
            'qr_code_length' => strlen($qrCode),
            'secret_length' => strlen($secret),
            'qr_code_preview' => substr($qrCode, 0, 100) . '...',
            'app_name' => config('app.name'),
            'user_email' => $user->email
        ]);

        // Store the QR code in the session
        session(['two_factor_setup_qr_code' => $qrCode]);

        // Redirect to the 2FA settings page
        return redirect()->route('two-factor-auth.edit')->with([
            'status' => 'Please scan the QR code and enter the code to enable two-factor authentication.',
            'setup' => true
        ]);
    }

    /**
     * Disable 2FA for the user.
     */
    public function disable(Request $request)
    {
        $user = $request->user();
        
        if (!$user->two_factor_secret) {
            return back()->with('error', 'Two-factor authentication is not enabled.');
        }

        $result = $this->generateAndSendTwoFactorCode($user);
        
        if (!$result['success']) {
            return back()->with('error', $result['error']);
        }

        // Store the disable intent in session
        session(['two_factor_disable_intent' => true]);

        return redirect()->route('two-factor-auth.edit')->with('status', 'Please enter the verification code sent to your email to disable two-factor authentication.');
    }

    /**
     * Confirm 2FA disable.
     */
    public function confirmDisable(Request $request)
    {
        $request->validate([
            'code' => ['required', 'string', 'size:6'],
        ]);

        $user = $request->user();
        
        if (!$user->two_factor_secret) {
            return back()->with('error', 'Two-factor authentication is not enabled.');
        }

        // Verify the code
        $storedCode = $request->session()->get('two_factor_code');
        $expiresAt = $request->session()->get('two_factor_code_expires_at');
        
        $isValid = $storedCode && 
                  $storedCode === $request->input('code') && 
                  $expiresAt && 
                  !now()->isAfter($expiresAt);

        if (!$isValid) {
            return Inertia::render('settings/two-factor-auth', [
                'enabled' => true,
                'showingQrCode' => false,
                'showingRecoveryCodes' => false,
                'qrCode' => null,
                'recoveryCodes' => null,
                'method' => $user->two_factor_method,
                'error' => 'Invalid verification code.'
            ]);
        }

        // Clear the disable intent
        $request->session()->forget('two_factor_disable_intent');

        // Disable 2FA
        app(DisableTwoFactorAuthentication::class)($user);

        // Reset the method to default
        $user->forceFill([
            'two_factor_method' => 'authenticator',
        ])->save();

        // Dispatch the 2FA disabled event
        Event::dispatch(new TwoFactorAuthenticationDisabled($user));

        return redirect()->route('two-factor-auth.edit')->with('status', 'Two-factor authentication has been disabled.');
    }

    /**
     * Generate new recovery codes.
     */
    public function generateRecoveryCodes(Request $request)
    {
        $user = $request->user();
        
        if (!$user->two_factor_secret) {
            return back()->with('error', 'Two-factor authentication is not enabled.');
        }

        app(GenerateNewRecoveryCodes::class)($user);

        return back()->with('status', 'Recovery codes have been regenerated.');
    }

    /**
     * Send a new 2FA code via email.
     */
    public function sendCode(Request $request)
    {
        \Log::info('2FA Send Code Request:', [
            'all' => $request->all()
        ]);

        $user = $request->user();
        
        \Log::info('User details for code resend:', [
            'id' => $user->id,
            'email' => $user->email,
            'has_2fa' => !is_null($user->two_factor_secret),
            'method' => $user->two_factor_method
        ]);
        
        // Allow sending code during setup even if 2FA is not enabled yet
        $setupMethod = session('two_factor_setup_method');
        if (!$user->two_factor_secret && $setupMethod === 'email') {
            \Log::info('Sending initial setup code for email 2FA');
            $result = $this->generateAndSendTwoFactorCode($user);
            
            if (!$result['success']) {
                \Log::error('Failed to send initial 2FA email code');
                return response()->json(['error' => $result['error']], 500);
            }
            
            return response()->json(['message' => 'A new two-factor authentication code has been sent to your email.']);
        }
        
        // For existing 2FA users
        if (!$user->two_factor_secret || $user->two_factor_method !== 'email') {
            \Log::warning('Invalid attempt to send 2FA code', [
                'has_secret' => !is_null($user->two_factor_secret),
                'method' => $user->two_factor_method
            ]);
            return response()->json(['error' => 'Email two-factor authentication is not enabled.'], 400);
        }

        \Log::info('Attempting to resend 2FA email code');
        $result = $this->generateAndSendTwoFactorCode($user);
        
        if (!$result['success']) {
            \Log::error('Failed to resend 2FA email code');
            return response()->json(['error' => $result['error']], 500);
        }
        
        \Log::info('Successfully resent 2FA email code');
        return response()->json(['message' => 'A new two-factor authentication code has been sent to your email.']);
    }

    /**
     * Confirm 2FA setup.
     */
    public function confirm(Request $request)
    {
        \Log::info('2FA Confirm Request:', [
            'all' => $request->all(),
            'code' => $request->input('code'),
            'has_code' => $request->has('code'),
            'content' => $request->getContent(),
            'headers' => $request->headers->all(),
        ]);

        try {
            $request->validate([
                'code' => ['required', 'string', 'size:6'],
            ]);

            $user = $request->user();
            $setupSecret = session('two_factor_setup_secret');
            $setupMethod = session('two_factor_setup_method');

            if (!$setupSecret || !$setupMethod) {
                \Log::warning('No 2FA setup data found in session');
                return back()->with('error', 'Two-factor authentication setup has expired. Please try again.');
            }

            $isValid = false;

            if ($setupMethod === 'authenticator') {
                $secret = decrypt($setupSecret);
                $google2fa = app('pragmarx.google2fa');
                
                // Set a more lenient window for verification
                $google2fa->setWindow(2); // Allow codes from 2 time periods before and after
                
                \Log::info('Authenticator verification:', [
                    'code' => $request->input('code'),
                    'secret_length' => strlen($secret),
                    'code_length' => strlen($request->input('code')),
                    'secret_preview' => substr($secret, 0, 4) . '...' . substr($secret, -4),
                    'window' => $google2fa->getWindow(),
                    'timestamp' => $google2fa->getTimestamp(),
                ]);

                // Try verification with the current code
                $isValid = $google2fa->verifyKey($secret, $request->input('code'));
                
                // If verification fails, try with a larger window
                if (!$isValid) {
                    \Log::info('First verification failed, trying with larger window');
                    $google2fa->setWindow(4);
                    $isValid = $google2fa->verifyKey($secret, $request->input('code'));
                    
                    \Log::info('Second verification attempt result:', [
                        'is_valid' => $isValid,
                        'window' => $google2fa->getWindow(),
                        'timestamp' => $google2fa->getTimestamp()
                    ]);
                }
            } else if ($setupMethod === 'email') {
                $storedCode = $request->session()->get('two_factor_code');
                $expiresAt = $request->session()->get('two_factor_code_expires_at');
                
                \Log::info('Email verification:', [
                    'stored_code' => $storedCode,
                    'provided_code' => $request->input('code'),
                    'has_stored_code' => !is_null($storedCode),
                    'expires_at' => $expiresAt,
                    'is_expired' => $expiresAt ? now()->isAfter($expiresAt) : true,
                ]);

                $isValid = $storedCode && 
                          $storedCode === $request->input('code') && 
                          $expiresAt && 
                          !now()->isAfter($expiresAt);

                \Log::info('Email verification result:', [
                    'is_valid' => $isValid,
                ]);
            } else if ($request->has('recovery_code')) {
                // Handle recovery code verification
                if (!$user->two_factor_recovery_codes) {
                    \Log::warning('No recovery codes found for user');
                    return back()->with('error', 'Invalid recovery code.');
                }

                try {
                    $recoveryCodes = json_decode(decrypt($user->two_factor_recovery_codes), true);
                    
                    if (!is_array($recoveryCodes)) {
                        \Log::error('Invalid recovery codes format', [
                            'recovery_codes_type' => gettype($recoveryCodes)
                        ]);
                        return back()->with('error', 'Invalid recovery code.');
                    }

                    $isValid = in_array($request->input('recovery_code'), $recoveryCodes, true); // Strict comparison

                    if ($isValid) {
                        // Remove the used recovery code
                        $recoveryCodes = array_diff($recoveryCodes, [$request->input('recovery_code')]);
                        $user->forceFill([
                            'two_factor_recovery_codes' => encrypt(json_encode(array_values($recoveryCodes))),
                        ])->save();

                        \Log::info('Recovery code verified and removed', [
                            'remaining_codes' => count($recoveryCodes)
                        ]);
                    } else {
                        \Log::warning('Invalid recovery code provided', [
                            'recovery_code_length' => strlen($request->input('recovery_code')),
                            'recovery_codes_count' => count($recoveryCodes)
                        ]);
                        return back()->with('error', 'Invalid recovery code.');
                    }
                } catch (\Exception $e) {
                    \Log::error('Error processing recovery code', [
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                    return back()->with('error', 'Invalid recovery code.');
                }
            }

            if (!$isValid) {
                \Log::warning('Invalid 2FA code provided', [
                    'code' => $request->input('code'),
                    'timestamp' => now()->timestamp,
                    'method' => $setupMethod,
                ]);
                
                // Preserve the setup state in the session
                session([
                    'two_factor_setup_secret' => $setupSecret,
                    'two_factor_setup_method' => $setupMethod,
                ]);
                
                // For authenticator method, regenerate the QR code
                if ($setupMethod === 'authenticator') {
                    $google2fa = app('pragmarx.google2fa');
                    $qrCode = $google2fa->getQRCodeInline(
                        config('app.name'),
                        $user->email,
                        decrypt($setupSecret)
                    );
                    session(['two_factor_setup_qr_code' => $qrCode]);
                }
                
                return Inertia::render('settings/two-factor-auth', [
                    'enabled' => false,
                    'showingQrCode' => true,
                    'showingRecoveryCodes' => false,
                    'qrCode' => $setupMethod === 'authenticator' ? $qrCode : null,
                    'recoveryCodes' => null,
                    'method' => $setupMethod,
                    'setup' => true,
                    'error' => 'The provided two factor authentication code was invalid. Please make sure you are using the correct code from your authenticator app.'
                ]);
            }

            \Log::info('Code verified successfully, enabling 2FA');
            
            // Instead of using Fortify's EnableTwoFactorAuthentication action,
            // manually enable 2FA with our verified secret
            $user->forceFill([
                'two_factor_secret' => $setupSecret, // Use our verified secret
                'two_factor_method' => $setupMethod,
                'two_factor_confirmed_at' => now(),
            ])->save();

            // Generate recovery codes
            app(GenerateNewRecoveryCodes::class)($user);

            // Get the recovery codes
            $recoveryCodes = json_decode(decrypt($user->two_factor_recovery_codes), true);

            // Clear all setup data from the session
            $request->session()->forget([
                'two_factor_setup_secret',
                'two_factor_setup_method',
                'two_factor_code',
                'two_factor_code_expires_at'
            ]);

            // Dispatch the 2FA enabled event
            Event::dispatch(new TwoFactorAuthenticationEnabled($user));

            return redirect()->route('two-factor-auth.edit')->with([
                'status' => 'Two-factor authentication has been enabled.',
                'recoveryCodes' => $recoveryCodes
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validation error:', [
                'errors' => $e->errors(),
                'request' => $request->all(),
            ]);
            throw $e;
        } catch (\Exception $e) {
            \Log::error('Unexpected error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return back()->with('error', 'An unexpected error occurred.');
        }
    }

    /**
     * Send a new 2FA code during the challenge.
     */
    public function sendChallengeCode(Request $request)
    {
        \Log::info('2FA Challenge Send Code Request:', [
            'all' => $request->all()
        ]);

        $email = $request->input('email');
        $user = \Modules\User\Models\User::where('email', $email)->first();

        if (!$user) {
            \Log::warning('User not found for 2FA code resend', ['email' => $email]);
            return Inertia::render('auth/two-factor-challenge', [
                'email' => $email,
                'password' => $request->input('password'),
                'remember' => $request->boolean('remember'),
                'method' => 'email',
                'errors' => ['code' => 'User not found.']
            ]);
        }

        \Log::info('User details for challenge code resend:', [
            'id' => $user->id,
            'email' => $user->email,
            'has_2fa' => !is_null($user->two_factor_secret),
            'method' => $user->two_factor_method
        ]);

        if (!$user->two_factor_secret || $user->two_factor_method !== 'email') {
            \Log::warning('Invalid attempt to send 2FA code', [
                'has_secret' => !is_null($user->two_factor_secret),
                'method' => $user->two_factor_method
            ]);
            return Inertia::render('auth/two-factor-challenge', [
                'email' => $email,
                'password' => $request->input('password'),
                'remember' => $request->boolean('remember'),
                'method' => 'email',
                'errors' => ['code' => 'Email two-factor authentication is not enabled.']
            ]);
        }

        \Log::info('Attempting to resend 2FA email code');
        $result = $this->generateAndSendTwoFactorCode($user);
        
        if (!$result['success']) {
            \Log::error('Failed to resend 2FA email code');
            return Inertia::render('auth/two-factor-challenge', [
                'email' => $email,
                'password' => $request->input('password'),
                'remember' => $request->boolean('remember'),
                'method' => 'email',
                'errors' => ['code' => 'Failed to send verification code. Please try again.']
            ]);
        }
        
        \Log::info('Successfully resent 2FA email code');
        return Inertia::render('auth/two-factor-challenge', [
            'email' => $email,
            'password' => $request->input('password'),
            'remember' => $request->boolean('remember'),
            'method' => 'email',
            'status' => 'A new two-factor authentication code has been sent to your email.'
        ]);
    }
} 