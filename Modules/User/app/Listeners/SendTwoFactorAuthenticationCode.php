<?php

namespace Modules\User\Listeners;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Mail;
use App\Mail\MailSend;
use Modules\User\Events\TwoFactorAuthenticationCodeSent;

class SendTwoFactorAuthenticationCode implements ShouldQueue
{
    public function __construct()
    {
        //
    }

    public function handle(TwoFactorAuthenticationCodeSent $event): void
    {
        $emailData = [
            'user_name' => $event->user->name,
            '2fa_code' => $event->code,
            'expiry_time' => $event->expiryTime,
            'company_name' => config('app.name'),
        ];

        Mail::to($event->user->email)
            ->send(new MailSend('2fa_code', $emailData, 'Two-Factor Authentication Code'));
    }
} 