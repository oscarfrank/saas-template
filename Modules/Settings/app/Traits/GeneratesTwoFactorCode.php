<?php

namespace Modules\Settings\Traits;

use Illuminate\Support\Facades\Event;
use Modules\User\Events\TwoFactorAuthenticationCodeSent;

trait GeneratesTwoFactorCode
{
    /**
     * Generate and send a 2FA code.
     *
     * @param \Modules\User\Models\User $user
     * @return array{success: bool, code: string|null, error: string|null}
     */
    protected function generateAndSendTwoFactorCode($user): array
    {
        try {
            $code = $this->generateTwoFactorCode();
            $expiryTime = now()->addMinutes(5)->toDateTimeString();
            
            // Store the code in the session
            session(['two_factor_code' => $code]);
            session(['two_factor_code_expires_at' => now()->addMinutes(5)]);
            
            // Dispatch the event
            Event::dispatch(new TwoFactorAuthenticationCodeSent($user, $code, $expiryTime));
            
            return [
                'success' => true,
                'code' => $code,
                'error' => null
            ];
        } catch (\Exception $e) {
            \Log::error('Failed to generate and send 2FA code', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return [
                'success' => false,
                'code' => null,
                'error' => 'Failed to send verification code. Please try again.'
            ];
        }
    }

    /**
     * Generate a random 6-digit code.
     *
     * @return string
     */
    protected function generateTwoFactorCode(): string
    {
        return str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    }
} 