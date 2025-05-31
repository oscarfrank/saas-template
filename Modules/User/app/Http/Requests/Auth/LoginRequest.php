<?php

namespace Modules\User\Http\Requests\Auth;

use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Modules\User\Events\TwoFactorAuthenticationCodeSent;
use Modules\Settings\Traits\GeneratesTwoFactorCode;

class LoginRequest extends FormRequest
{
    use GeneratesTwoFactorCode;

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
            'code' => ['nullable', 'string'],
            'recovery_code' => ['nullable', 'string'],
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        // If we have a code, we're in the 2FA verification step
        if ($this->has('code') || $this->has('recovery_code')) {
            $user = Auth::user();
            
            // If no user is authenticated, try to authenticate with email/password
            if (!$user) {
                if (!Auth::attempt($this->only('email', 'password'), $this->boolean('remember'))) {
                    RateLimiter::hit($this->throttleKey());
                    throw ValidationException::withMessages([
                        'email' => __('auth.failed'),
                    ]);
                }
                $user = Auth::user();
            }

            // Verify the 2FA code based on the method
            $isValid = false;

            \Log::info('Starting 2FA verification', [
                'has_code' => $this->has('code'),
                'has_recovery_code' => $this->has('recovery_code'),
                'method' => $user->two_factor_method,
                'code_length' => $this->has('code') ? strlen($this->code) : null,
                'recovery_code_length' => $this->has('recovery_code') ? strlen($this->recovery_code) : null
            ]);

            // Check recovery code if explicitly provided
            if ($this->has('recovery_code') && !empty($this->recovery_code)) {
                \Log::info('Attempting to verify recovery code', [
                    'has_recovery_codes' => !is_null($user->two_factor_recovery_codes),
                    'recovery_code_length' => strlen($this->recovery_code)
                ]);

                if (!$user->two_factor_recovery_codes) {
                    \Log::warning('No recovery codes found for user');
                    throw ValidationException::withMessages([
                        'recovery_code' => __('auth.2fa_invalid'),
                    ]);
                }

                try {
                    $recoveryCodes = json_decode(decrypt($user->two_factor_recovery_codes), true);
                    
                    if (!is_array($recoveryCodes)) {
                        \Log::error('Invalid recovery codes format', [
                            'recovery_codes_type' => gettype($recoveryCodes)
                        ]);
                        throw ValidationException::withMessages([
                            'recovery_code' => __('auth.2fa_invalid'),
                        ]);
                    }

                    $isValid = in_array($this->recovery_code, $recoveryCodes, true); // Strict comparison

                    if ($isValid) {
                        // Remove the used recovery code
                        $recoveryCodes = array_diff($recoveryCodes, [$this->recovery_code]);
                        $user->forceFill([
                            'two_factor_recovery_codes' => encrypt(json_encode(array_values($recoveryCodes))),
                        ])->save();

                        \Log::info('Recovery code verified and removed', [
                            'remaining_codes' => count($recoveryCodes)
                        ]);
                    } else {
                        \Log::warning('Invalid recovery code provided', [
                            'recovery_code_length' => strlen($this->recovery_code),
                            'recovery_codes_count' => count($recoveryCodes)
                        ]);
                        throw ValidationException::withMessages([
                            'recovery_code' => __('auth.2fa_invalid'),
                        ]);
                    }
                } catch (\Exception $e) {
                    \Log::error('Error processing recovery code', [
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                    throw ValidationException::withMessages([
                        'recovery_code' => __('auth.2fa_invalid'),
                    ]);
                }
            }
            // Otherwise check the primary 2FA method
            else if ($this->has('code')) {
                if ($user->two_factor_method === 'authenticator') {
                    try {
                        \Log::info('Attempting to verify authenticator code', [
                            'code_length' => strlen($this->code),
                            'has_secret' => !is_null($user->two_factor_secret),
                            'method' => $user->two_factor_method,
                            'code' => $this->code
                        ]);

                        // Decrypt the secret
                        $secret = decrypt($user->two_factor_secret);
                        
                        \Log::info('Decrypted secret details', [
                            'secret_length' => strlen($secret),
                            'secret_preview' => substr($secret, 0, 4) . '...'
                        ]);

                        $google2fa = app('pragmarx.google2fa');
                        
                        // Ensure the code is properly formatted
                        $code = trim($this->code);
                        
                        // Set a larger window for verification
                        $google2fa->setWindow(4);
                        
                        // Try verification with the larger window
                        $isValid = $google2fa->verifyKey($secret, $code);
                        
                        \Log::info('Authenticator verification result', [
                            'is_valid' => $isValid,
                            'window' => $google2fa->getWindow(),
                            'timestamp' => $google2fa->getTimestamp(),
                            'secret_length' => strlen($secret),
                            'code_length' => strlen($code)
                        ]);

                        // If not valid, try one more time with an even larger window
                        if (!$isValid) {
                            \Log::info('Attempting verification with larger window');
                            $google2fa->setWindow(8);
                            $isValid = $google2fa->verifyKey($secret, $code);
                            
                            \Log::info('Second verification attempt result', [
                                'is_valid' => $isValid,
                                'window' => $google2fa->getWindow(),
                                'timestamp' => $google2fa->getTimestamp()
                            ]);
                        }
                    } catch (\Exception $e) {
                        \Log::error('Error verifying authenticator code', [
                            'error' => $e->getMessage(),
                            'trace' => $e->getTraceAsString()
                        ]);
                        $isValid = false;
                    }
                } else if ($user->two_factor_method === 'email') {
                    $storedCode = session()->get('two_factor_code');
                    $expiresAt = session()->get('two_factor_code_expires_at');
                    
                    \Log::info('Verifying email code', [
                        'stored_code' => $storedCode,
                        'provided_code' => $this->code,
                        'expires_at' => $expiresAt,
                        'is_expired' => $expiresAt ? now()->isAfter($expiresAt) : true,
                        'current_time' => now()->toDateTimeString(),
                        'session_id' => session()->getId(),
                        'has_stored_code' => !is_null($storedCode),
                        'has_expires_at' => !is_null($expiresAt),
                        'code_match' => $storedCode === $this->code,
                        'code_length_match' => strlen($storedCode ?? '') === strlen($this->code ?? ''),
                        'stored_code_length' => strlen($storedCode ?? ''),
                        'provided_code_length' => strlen($this->code ?? '')
                    ]);
                    
                    // Ensure both codes are strings and trimmed
                    $storedCode = trim((string)$storedCode);
                    $providedCode = trim((string)$this->code);
                    
                    $isValid = !empty($storedCode) && 
                              !empty($providedCode) &&
                              $storedCode === $providedCode && 
                              $expiresAt && 
                              !now()->isAfter($expiresAt);

                    \Log::info('Email verification result:', [
                        'is_valid' => $isValid,
                        'stored_code' => $storedCode,
                        'provided_code' => $providedCode,
                        'codes_match' => $storedCode === $providedCode,
                        'is_expired' => $expiresAt ? now()->isAfter($expiresAt) : true
                    ]);
                }
            }

            if (!$isValid) {
                \Log::warning('Invalid 2FA code provided', [
                    'method' => $user->two_factor_method,
                    'code_length' => $this->has('code') ? strlen($this->code) : null,
                    'recovery_code_length' => $this->has('recovery_code') ? strlen($this->recovery_code) : null
                ]);
                
                Auth::logout();
                throw ValidationException::withMessages([
                    'code' => __('auth.2fa_invalid'),
                ]);
            }

            // Clear the stored code from the session
            session()->forget(['two_factor_code', 'two_factor_code_expires_at']);

            RateLimiter::clear($this->throttleKey());
            return;
        }

        // Regular login attempt
        if (!Auth::attempt($this->only('email', 'password'), $this->boolean('remember'))) {
            RateLimiter::hit($this->throttleKey());
            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        $user = Auth::user();

        // Check if 2FA is required
        if ($user->two_factor_secret) {
            // If email method is selected, send the code
            if ($user->two_factor_method === 'email') {
                $result = $this->generateAndSendTwoFactorCode($user);
                if (!$result['success']) {
                    \Log::error('Failed to send 2FA code during login', [
                        'error' => $result['error']
                    ]);
                }
            }
            
            Auth::logout();
            throw ValidationException::withMessages([
                'code' => __('auth.2fa_required'),
                'method' => $user->two_factor_method,
            ]);
        }

        RateLimiter::clear($this->throttleKey());
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (!RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'email' => __('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->string('email')).'|'.$this->ip());
    }
}
