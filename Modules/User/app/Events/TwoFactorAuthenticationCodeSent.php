<?php

namespace Modules\User\Events;

use Illuminate\Queue\SerializesModels;
use Modules\User\Models\User;

class TwoFactorAuthenticationCodeSent
{
    use SerializesModels;

    public $user;
    public $code;
    public $expiryTime;

    public function __construct(User $user, string $code, string $expiryTime)
    {
        $this->user = $user;
        $this->code = $code;
        $this->expiryTime = $expiryTime;
    }
} 