<?php

namespace Modules\User\Listeners;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Mail\MailSend;
use Modules\User\Events\UserLoggedIn;

class SendLoginNotification implements ShouldQueue
{
    public function __construct()
    {
        //
    }

    public function handle(UserLoggedIn $event): void
    {
        Log::info('Processing login notification', [
            'user_id' => $event->user->id,
            'email' => $event->user->email,
            'login_time' => $event->loginTime,
            'ip_address' => $event->ipAddress
        ]);

        try {
            $emailData = [
                'user_name' => $event->user->name,
                'login_time' => $event->loginTime,
                'login_location' => $event->loginLocation,
                'ip_address' => $event->ipAddress,
                'device_info' => $event->deviceInfo,
                'company_name' => config('app.name'),
            ];

            Mail::to($event->user->email)
                ->send(new MailSend('login_notification', $emailData, 'New Login Detected'));

            Log::info('Login notification email sent successfully', [
                'user_id' => $event->user->id,
                'email' => $event->user->email
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send login notification email', [
                'user_id' => $event->user->id,
                'email' => $event->user->email,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }
} 