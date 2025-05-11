<?php

namespace Database\Seeders;

use App\Models\EmailTemplate;
use Illuminate\Database\Seeder;

class AccountEmailTemplateSeeder extends Seeder
{
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
                'name' => 'Email Verification',
                'shortcode' => 'email_verification',
                'content' => "Dear {{user_name}},\n\nPlease verify your email address by clicking the link below:\n\n{{verification_link}}\n\nThis link will expire in {{expiry_time}}.\n\nIf you didn't create an account, please ignore this email.\n\nBest regards,\n{{company_name}} Team",
                'placeholders' => ['user_name', 'verification_link', 'expiry_time', 'company_name'],
                'is_active' => true,
            ],
            [
                'name' => 'Password Reset',
                'shortcode' => 'password_reset',
                'content' => "Dear {{user_name}},\n\nWe received a request to reset your password. Click the link below to reset your password:\n\n{{reset_link}}\n\nThis link will expire in {{expiry_time}}.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\n{{company_name}} Team",
                'placeholders' => ['user_name', 'reset_link', 'expiry_time', 'company_name'],
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
            EmailTemplate::create($template);
        }
    }
} 