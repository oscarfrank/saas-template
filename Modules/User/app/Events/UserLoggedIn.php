<?php

namespace Modules\User\Events;

use Illuminate\Queue\SerializesModels;
use Modules\User\Models\User;

class UserLoggedIn
{
    use SerializesModels;

    public $user;
    public $loginTime;
    public $loginLocation;
    public $ipAddress;
    public $deviceInfo;

    public function __construct(
        User $user,
        string $loginTime,
        string $loginLocation,
        string $ipAddress,
        string $deviceInfo
    ) {
        $this->user = $user;
        $this->loginTime = $loginTime;
        $this->loginLocation = $loginLocation;
        $this->ipAddress = $ipAddress;
        $this->deviceInfo = $deviceInfo;
    }
} 