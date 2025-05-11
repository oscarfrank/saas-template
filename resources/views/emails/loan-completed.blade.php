<!DOCTYPE html>
<html>
<head>
    <title>Loan Payment Period Completed</title>
</head>
<body>
    <h2>Loan Payment Period Completed</h2>
    
    <p>Dear {{ $user->name }},</p>

    <p>This email is to inform you that the following loan has reached its payment period end date:</p>

    <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
        <p><strong>Loan ID:</strong> {{ $loan->id }}</p>
        <p><strong>Amount:</strong> {{ $loan->amount }}</p>
        <p><strong>End Date:</strong> {{ $loan->end_date->format('Y-m-d') }}</p>
    </div>

    <p>The loan status has been updated to "completed" in our system.</p>

    <p>If you have any questions or concerns, please don't hesitate to contact our support team.</p>

    <p>Best regards,<br>
    Your Loan Platform Team</p>
</body>
</html> 