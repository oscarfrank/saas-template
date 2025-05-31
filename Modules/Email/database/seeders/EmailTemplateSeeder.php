<?php

namespace Modules\Email\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Modules\Email\Models\EmailTemplate;

class EmailTemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $templates = [
            [
                'name' => 'Welcome Email',
                'shortcode' => 'welcome_email',
                'content' => "Dear {{user_name}},\n\nWelcome to {{company_name}}! We're excited to have you on board.\n\nYour account has been successfully created. To get started, please verify your email address by clicking the link below:\n\n{{activation_link}}\n\nIf you have any questions, feel free to contact our support team at {{support_email}}.\n\nBest regards,\n{{company_name}} Team",
                'placeholders' => ['user_name', 'company_name', 'activation_link', 'support_email'],
                'is_active' => true,
            ],
            [
                'name' => 'Password Reset',
                'shortcode' => 'password_reset',
                'content' => "Dear {{user_name}},\n\nYou are receiving this email because we received a password reset request for your account.\n\nClick the link below to reset your password:\n\n{{reset_link}}\n\nThis password reset link will expire in {{expiry_time}}.\n\nIf you did not request a password reset, no further action is required.\n\nBest regards,\n{{company_name}} Team",
                'placeholders' => ['user_name', 'reset_link', 'expiry_time', 'company_name'],
                'is_active' => true,
            ],
            [
                'name' => 'Email Verification',
                'shortcode' => 'email_verification',
                'content' => "Dear {{user_name}},\n\nPlease verify your email address by clicking the link below:\n\n{{verification_link}}\n\nThis verification link will expire in {{expiry_time}}.\n\nIf you did not create an account, no further action is required.\n\nBest regards,\n{{company_name}} Team",
                'placeholders' => ['user_name', 'verification_link', 'expiry_time', 'company_name'],
                'is_active' => true,
            ],
            [
                'name' => 'Two-Factor Authentication',
                'shortcode' => '2fa_code',
                'content' => "Dear {{user_name}},\n\nYour two-factor authentication code is: {{2fa_code}}\n\nThis code will expire in {{expiry_time}}.\n\nIf you didn't request this code, please secure your account immediately.\n\nBest regards,\n{{company_name}} Team",
                'placeholders' => ['user_name', '2fa_code', 'expiry_time', 'company_name'],
                'is_active' => true,
            ],
            [
                'name' => 'Two-Factor Authentication Disable Code',
                'shortcode' => '2fa_disable_code',
                'content' => "Dear {{user_name}},\n\nYour two-factor authentication disable code is: {{2fa_disable_code}}\n\nThis code will expire in {{expiry_time}}.\n\nIf you didn't request to disable 2FA, please secure your account immediately.\n\nBest regards,\n{{company_name}} Team",
                'placeholders' => ['user_name', '2fa_disable_code', 'expiry_time', 'company_name'],
                'is_active' => true,
            ],
            [
                'name' => 'Login Notification',
                'shortcode' => 'login_notification',
                'content' => "Dear {{user_name}},\n\nA new login was detected on your account.\n\nLogin Details:\n- Time: {{login_time}}\n- Location: {{login_location}}\n- IP Address: {{ip_address}}\n- Device: {{device_info}}\n\nIf this wasn't you, please secure your account immediately by changing your password and enabling two-factor authentication.\n\nBest regards,\n{{company_name}} Team",
                'placeholders' => ['user_name', 'login_time', 'login_location', 'ip_address', 'device_info', 'company_name'],
                'is_active' => true,
            ],
            [
                'name' => 'Two-Factor Authentication Enabled',
                'shortcode' => '2fa_enabled',
                'content' => "Dear {{user_name}},\n\nTwo-factor authentication has been successfully enabled on your account.\n\nYour account is now more secure. You'll need to enter a verification code each time you log in.\n\nIf you didn't enable 2FA, please contact our support team immediately at {{support_email}}.\n\nBest regards,\n{{company_name}} Team",
                'placeholders' => ['user_name', 'support_email', 'company_name'],
                'is_active' => true,
            ],
            [
                'name' => 'Two-Factor Authentication Disabled',
                'shortcode' => '2fa_disabled',
                'content' => "Dear {{user_name}},\n\nTwo-factor authentication has been successfully disabled on your account.\n\nPlease note that your account security has been reduced. We recommend keeping 2FA enabled for better security.\n\nIf you didn't disable 2FA, please contact our support team immediately at {{support_email}}.\n\nBest regards,\n{{company_name}} Team",
                'placeholders' => ['user_name', 'support_email', 'company_name'],
                'is_active' => true,
            ],
            [
                'name' => 'KYC Verification Request',
                'shortcode' => 'kyc_verification_request',
                'content' => "Dear {{user_name}},\n\nTo complete your account setup, please verify your identity by submitting the following documents:\n\n1. Government-issued ID\n2. Proof of address\n3. Selfie with ID\n\nYou can submit these documents by clicking the link below:\n\n{{kyc_submission_link}}\n\nBest regards,\n{{company_name}} Team",
                'placeholders' => ['user_name', 'kyc_submission_link', 'company_name'],
                'is_active' => true,
            ],
            [
                'name' => 'KYC Verification Approved',
                'shortcode' => 'kyc_approved',
                'content' => "Dear {{user_name}},\n\nYour identity verification has been approved. Your account is now fully activated.\n\nYou can now access all features of your account.\n\nBest regards,\n{{company_name}} Team",
                'placeholders' => ['user_name', 'company_name'],
                'is_active' => true,
            ],
            [
                'name' => 'KYC Verification Rejected',
                'shortcode' => 'kyc_rejected',
                'content' => "Dear {{user_name}},\n\nYour identity verification has been rejected for the following reason:\n\n{{rejection_reason}}\n\nPlease submit new documents by clicking the link below:\n\n{{kyc_submission_link}}\n\nBest regards,\n{{company_name}} Team",
                'placeholders' => ['user_name', 'rejection_reason', 'kyc_submission_link', 'company_name'],
                'is_active' => true,
            ],
            [
                'name' => 'Account Locked',
                'shortcode' => 'account_locked',
                'content' => "Dear {{user_name}},\n\nYour account has been locked due to multiple failed login attempts.\n\nTo unlock your account, please click the link below:\n\n{{unlock_link}}\n\nIf you didn't attempt to log in, please contact our support team immediately at {{support_email}}.\n\nBest regards,\n{{company_name}} Team",
                'placeholders' => ['user_name', 'unlock_link', 'support_email', 'company_name'],
                'is_active' => true,
            ],
            [
                'name' => 'Password Changed',
                'shortcode' => 'password_changed',
                'content' => "Dear {{user_name}},\n\nYour password has been successfully changed.\n\nIf you didn't make this change, please contact our support team immediately at {{support_email}}.\n\nBest regards,\n{{company_name}} Team",
                'placeholders' => ['user_name', 'support_email', 'company_name'],
                'is_active' => true,
            ],
            [
                'name' => 'Email Changed',
                'shortcode' => 'email_changed',
                'content' => "Dear {{user_name}},\n\nYour email address has been changed to {{new_email}}.\n\nIf you didn't make this change, please contact our support team immediately at {{support_email}}.\n\nBest regards,\n{{company_name}} Team",
                'placeholders' => ['user_name', 'new_email', 'support_email', 'company_name'],
                'is_active' => true,
            ],
        ];

        foreach ($templates as $template) {
            EmailTemplate::updateOrCreate(
                ['shortcode' => $template['shortcode']],
                $template
            );
        }
    }
} 