<?php

namespace Modules\Settings\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Modules\Settings\Models\OrganizationInvite;

class OrganizationInvite extends Mailable
{
    use Queueable, SerializesModels;

    public $invite;

    public function __construct(OrganizationInvite $invite)
    {
        $this->invite = $invite;
    }

    public function build()
    {
        return $this->markdown('settings::emails.organization-invite')
            ->subject('You\'ve been invited to join ' . $this->invite->tenant->name);
    }
} 