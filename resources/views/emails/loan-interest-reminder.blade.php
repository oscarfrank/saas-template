<!DOCTYPE html>
<html>
<head>
    <title>Monthly Interest Payment Reminder</title>
</head>
<body>
    <h2>Monthly Interest Payment Reminder</h2>
    
    <p>Dear {{ $user->name }},</p>

    <p>This is a reminder that the monthly interest payment is due for the following loan:</p>

    <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
        <p><strong>Loan ID:</strong> {{ $loan->id }}</p>
        <p><strong>Principal Amount:</strong> {{ $loan->amount }}</p>
        <p><strong>Monthly Interest Due:</strong> {{ number_format($interest_amount, 2) }}</p>
        <p><strong>Payment Number:</strong> {{ $payment_number }}</p>
        <p><strong>Due Date:</strong> {{ now()->format('Y-m-d') }}</p>
    </div>

    <p>Please ensure that the interest payment is made on time to maintain the active status of your loan.</p>

    <p>If you have already made this payment, please disregard this reminder.</p>

    <p>If you have any questions or concerns, please don't hesitate to contact our support team.</p>

    <p>Best regards,<br>
    Your Loan Platform Team</p>
</body>
</html> 