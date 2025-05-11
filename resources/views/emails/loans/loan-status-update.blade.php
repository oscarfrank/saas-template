<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $subject ?? 'Notification' }}</title>
    <style>
        /* Reset styles */
        body, html {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #2d3748;
            background-color: #f7fafc;
        }

        /* Container */
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
        }

        /* Header */
        .header {
            text-align: center;
            padding: 40px 20px;
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            border-radius: 8px 8px 0 0;
        }

        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }

        /* Content */
        .content {
            padding: 40px 20px;
            background-color: #ffffff;
        }

        .greeting {
            font-size: 18px;
            font-weight: 500;
            margin-bottom: 24px;
            color: #1a202c;
        }

        .message {
            margin-bottom: 32px;
            color: #4a5568;
        }

        /* Status Badge */
        .status-badge {
            display: inline-block;
            padding: 8px 16px;
            background-color: #ebf8ff;
            color: #2b6cb0;
            border-radius: 6px;
            font-weight: 500;
            margin: 16px 0;
        }

        /* Details Card */
        .details-card {
            background-color: #f8fafc;
            border-radius: 8px;
            padding: 24px;
            margin: 24px 0;
            border: 1px solid #e2e8f0;
        }

        .details-card h3 {
            color: #2d3748;
            margin: 0 0 16px 0;
            font-size: 16px;
            font-weight: 600;
        }

        .details-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .details-list li {
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
        }

        .details-list li:last-child {
            border-bottom: none;
        }

        .details-list .label {
            color: #718096;
            font-weight: 500;
        }

        .details-list .value {
            color: #2d3748;
            font-weight: 600;
        }

        /* Action Button */
        .action-button {
            display: inline-block;
            padding: 12px 24px;
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 24px 0;
        }

        /* Footer */
        .footer {
            text-align: center;
            padding: 24px 20px;
            background-color: #f8fafc;
            border-radius: 0 0 8px 8px;
            border-top: 1px solid #e2e8f0;
        }

        .footer p {
            color: #718096;
            font-size: 14px;
            margin: 8px 0;
        }

        .social-links {
            margin: 16px 0;
        }

        .social-links a {
            display: inline-block;
            margin: 0 8px;
            color: #4a5568;
            text-decoration: none;
        }

        /* Responsive Design */
        @media only screen and (max-width: 600px) {
            .container {
                padding: 10px;
            }
            .header {
                padding: 30px 15px;
            }
            .content {
                padding: 30px 15px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{ $subject ?? 'Loan Status Update' }}</h1>
        </div>
        
        <div class="content">
            <div class="greeting">Dear {{ $loan->user->name ?? 'Valued Customer' }},</div>
            
            <div class="message">
                <p>We're writing to inform you about an important update regarding your loan.</p>
                
                <div class="status-badge">
                    Status: {{ strtoupper($status) }}
                </div>
            </div>

            <div class="details-card">
                <h3>Loan Details</h3>
                <ul class="details-list">
                    <li>
                        <span class="label">Reference Number</span>
                        <span class="value">{{ $loan->reference_number ?? 'N/A' }}</span>
                    </li>
                    <li>
                        <span class="label">Amount</span>
                        <span class="value">{{ $loan->currency->symbol ?? '$' }}{{ number_format($loan->amount ?? 0, 2) }}</span>
                    </li>
                    <li>
                        <span class="label">Interest Rate</span>
                        <span class="value">{{ $loan->interest_rate ?? 0 }}%</span>
                    </li>
                    <li>
                        <span class="label">Duration</span>
                        <span class="value">{{ $loan->duration_days ?? 0 }} days</span>
                    </li>
                </ul>
            </div>

            @if(isset($action_url))
            <div style="text-align: center;">
                <a href="{{ $action_url }}" class="action-button">
                    {{ $action_text ?? 'View Details' }}
                </a>
            </div>
            @endif

            <p style="color: #4a5568;">If you have any questions or need assistance, our support team is here to help.</p>
        </div>

        <div class="footer">
            <p>This is an automated message, please do not reply directly to this email.</p>
            <div class="social-links">
                <a href="#">Twitter</a>
                <a href="#">Facebook</a>
                <a href="#">LinkedIn</a>
            </div>
            <p>&copy; {{ date('Y') }} Your Company Name. All rights reserved.</p>
        </div>
    </div>
</body>
</html> 