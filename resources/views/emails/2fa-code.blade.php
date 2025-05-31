<!DOCTYPE html>
<html>
<head>
    <title>Two-Factor Authentication Code</title>
</head>
<body>
    <h1>Your Two-Factor Authentication Code</h1>
    <p>Hello {{ $user->first_name }},</p>
    <p>Your two-factor authentication code is: <strong>{{ $code }}</strong></p>
    <p>This code will expire in 5 minutes.</p>
    <p>If you didn't request this code, please secure your account immediately.</p>
    <p>Best regards,<br>{{ config('app.name') }} Team</p>
</body>
</html> 