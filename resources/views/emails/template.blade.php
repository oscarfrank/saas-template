<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $template->name }}</title>
    <style>
        /* Reset styles */
        body, html {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background-color: #f3f4f6;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }

        /* Container */
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 0;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        /* Header */
        .header {
            text-align: center;
            padding: 40px 20px;
            background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
            border-radius: 12px 12px 0 0;
        }

        .logo {
            max-width: 160px;
            height: auto;
            margin-bottom: 20px;
        }

        /* Content */
        .content {
            padding: 48px 32px;
            background-color: #ffffff;
            color: #1f2937;
            font-size: 16px;
            line-height: 1.8;
        }

        .content p {
            margin-bottom: 24px;
        }

        /* Buttons */
        .button {
            display: inline-block;
            padding: 14px 28px;
            background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
            color: #ffffff;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 24px 0;
            text-align: center;
            transition: all 0.3s ease;
            box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
        }

        .button:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 8px -1px rgba(79, 70, 229, 0.3);
        }

        /* Footer */
        .footer {
            text-align: center;
            padding: 40px 32px;
            background-color: #f9fafb;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            border-radius: 0 0 12px 12px;
        }

        .footer p {
            margin: 8px 0;
        }

        .social-links {
            margin: 24px 0;
        }

        .social-links a {
            display: inline-block;
            margin: 0 12px;
            color: #4f46e5;
            text-decoration: none;
            font-weight: 500;
            transition: color 0.3s ease;
        }

        .social-links a:hover {
            color: #4338ca;
        }

        /* Divider */
        .divider {
            height: 1px;
            background: linear-gradient(to right, transparent, #e5e7eb, transparent);
            margin: 32px 0;
        }

        /* Responsive */
        @media only screen and (max-width: 600px) {
            .container {
                width: 100% !important;
                border-radius: 0;
            }

            .header {
                border-radius: 0;
                padding: 32px 16px;
            }

            .content {
                padding: 32px 20px !important;
            }

            .footer {
                padding: 32px 20px;
                border-radius: 0;
            }

            .button {
                display: block;
                text-align: center;
                margin: 24px auto;
            }
        }

        /* Utility classes */
        .text-center {
            text-align: center;
        }

        .mt-4 {
            margin-top: 2rem;
        }

        .mb-4 {
            margin-bottom: 2rem;
        }

        .text-sm {
            font-size: 0.875rem;
        }

        .text-gray {
            color: #6b7280;
        }

        /* Typography enhancements */
        h1, h2, h3, h4, h5, h6 {
            color: #111827;
            margin-top: 0;
            line-height: 1.3;
        }

        a {
            color: #4f46e5;
            text-decoration: none;
            transition: color 0.3s ease;
        }

        a:hover {
            color: #4338ca;
        }

        /* Support email link */
        .support-email {
            color: #4f46e5;
            text-decoration: none;
            font-weight: 500;
            transition: color 0.3s ease;
        }

        .support-email:hover {
            color: #4338ca;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            @if(Storage::exists('images/original/logo.png'))
                <img src="{{ Storage::url('images/original/logo.png') }}" alt="{{ config('app.name') }}" class="logo">
            @else
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">{{ config('app.name') }}</h1>
            @endif
        </div>
        
        <div class="content">
            {!! $content !!}
        </div>

        <div class="divider"></div>

        <div class="footer">
            <div class="social-links">
                <a href="{{ config('app.social_links.facebook') }}" target="_blank">Facebook</a>
                <a href="{{ config('app.social_links.twitter') }}" target="_blank">Twitter</a>
                <a href="{{ config('app.social_links.linkedin') }}" target="_blank">LinkedIn</a>
            </div>
            
            <p class="text-sm text-gray">
                &copy; {{ date('Y') }} {{ config('app.name') }}. All rights reserved.
            </p>
            
            <p class="text-sm text-gray">
                This is an automated message, please do not reply directly to this email.
            </p>
            
            <p class="text-sm text-gray mt-4">
                If you have any questions, please contact our support team at 
                <a href="mailto:{{ config('mail.support_email') }}" class="support-email">
                    {{ config('mail.support_email') }}
                </a>
            </p>
        </div>
    </div>
</body>
</html> 