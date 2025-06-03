@component('mail::message')
# You've been invited to join {{ $invite->tenant->name }}

{{ $invite->invitedBy->first_name }} has invited you to join their organization as a {{ $invite->role }}.

@component('mail::button', ['url' => $invite->getInviteUrl()])
Accept Invitation
@endcomponent

This invitation will expire in 7 days.

Thanks,<br>
{{ config('app.name') }}
@endcomponent 