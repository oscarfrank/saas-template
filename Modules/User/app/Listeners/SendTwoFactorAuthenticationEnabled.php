<?php

namespace Modules\User\Listeners;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Mail;
use App\Mail\MailSend;
use Modules\User\Events\TwoFactorAuthenticationEnabled;

class SendTwoFactorAuthenticationEnabled implements ShouldQueue
{
    public function __construct()
    {
        //
    }

    public function handle(TwoFactorAuthenticationEnabled $event): void
    {
        $emailData = [
            'user_name' => $event->user->name,
            'support_email' => config('mail.support_email'),
            'company_name' => config('app.name'),
        ];

        Mail::to($event->user->email)
            ->send(new MailSend('2fa_enabled', $emailData, 'Two-Factor Authentication Enabled'));
    }
} 