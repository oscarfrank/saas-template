<?php

namespace Database\Seeders;

use App\Models\EmailTemplate;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class LoanEmailTemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $templates = [
            [
                'name' => 'Loan Application Received',
                'shortcode' => 'loan_application_received',
                'content' => "Dear {{user_name}},\n\nWe have received your loan application (Reference: {{loan_reference}}).\n\nLoan Details:\nAmount: {{loan_amount}}\nTerm: {{loan_term}}\nPurpose: {{loan_purpose}}\n\nWe will review your application and get back to you within {{processing_time}}.\n\nBest regards,\n{{company_name}} Team",
                'placeholders' => ['user_name', 'loan_reference', 'loan_amount', 'loan_term', 'loan_purpose', 'processing_time', 'company_name'],
                'is_active' => true,
            ],
            [
                'name' => 'Loan Status Update',
                'shortcode' => 'loan_status_update',
                'content' => "Dear {{user_name}},\n\nThis email is to inform you about the status update of your loan application (Reference: {{loan_reference}}).\n\nCurrent Status: {{loan_status}}\nLoan Amount: {{loan_amount}}\n\nIf you have any questions, please don't hesitate to contact our support team at {{support_email}}.\n\nBest regards,\n{{company_name}} Team",
                'placeholders' => ['user_name', 'loan_reference', 'loan_status', 'loan_amount', 'support_email', 'company_name'],
                'is_active' => true,
            ],
            [
                'name' => 'Loan Approval',
                'shortcode' => 'loan_approval',
                'content' => "Dear {{user_name}},\n\nCongratulations! Your loan application (Reference: {{loan_reference}}) has been approved.\n\nLoan Details:\nAmount: {{loan_amount}}\nTerm: {{loan_term}}\nInterest Rate: {{interest_rate}}\nMonthly Payment: {{monthly_payment}}\n\nPlease review and accept the loan terms by clicking the link below:\n{{loan_acceptance_link}}\n\nBest regards,\n{{company_name}} Team",
                'placeholders' => ['user_name', 'loan_reference', 'loan_amount', 'loan_term', 'interest_rate', 'monthly_payment', 'loan_acceptance_link', 'company_name'],
                'is_active' => true,
            ],
            [
                'name' => 'Loan Rejection',
                'shortcode' => 'loan_rejection',
                'content' => "Dear {{user_name}},\n\nWe regret to inform you that your loan application (Reference: {{loan_reference}}) has not been approved at this time.\n\nReason: {{rejection_reason}}\n\nYou may be eligible to reapply after {{reapply_after}}.\n\nIf you have any questions, please contact our support team at {{support_email}}.\n\nBest regards,\n{{company_name}} Team",
                'placeholders' => ['user_name', 'loan_reference', 'rejection_reason', 'reapply_after', 'support_email', 'company_name'],
                'is_active' => true,
            ],
            [
                'name' => 'Loan Disbursement',
                'shortcode' => 'loan_disbursement',
                'content' => "Dear {{user_name}},\n\nYour approved loan (Reference: {{loan_reference}}) has been disbursed to your account.\n\nDisbursement Details:\nAmount: {{disbursement_amount}}\nDate: {{disbursement_date}}\nAccount: {{account_number}}\n\nYour first payment of {{first_payment_amount}} is due on {{first_payment_date}}.\n\nBest regards,\n{{company_name}} Team",
                'placeholders' => ['user_name', 'loan_reference', 'disbursement_amount', 'disbursement_date', 'account_number', 'first_payment_amount', 'first_payment_date', 'company_name'],
                'is_active' => true,
            ],
            [
                'name' => 'Payment Reminder',
                'shortcode' => 'payment_reminder',
                'content' => "Dear {{user_name}},\n\nThis is a reminder that your loan payment of {{payment_amount}} for loan {{loan_reference}} is due on {{due_date}}.\n\nCurrent Balance: {{current_balance}}\nDue Date: {{due_date}}\n\nPlease ensure sufficient funds are available in your account.\n\nBest regards,\n{{company_name}} Team",
                'placeholders' => ['user_name', 'payment_amount', 'loan_reference', 'due_date', 'current_balance', 'company_name'],
                'is_active' => true,
            ],
            [
                'name' => 'Payment Confirmation',
                'shortcode' => 'payment_confirmation',
                'content' => "Dear {{user_name}},\n\nWe have received your payment for loan {{loan_reference}}.\n\nPayment Details:\nAmount: {{payment_amount}}\nDate: {{payment_date}}\nTransaction ID: {{transaction_id}}\n\nRemaining Balance: {{remaining_balance}}\nNext Payment Due: {{next_payment_date}}\n\nBest regards,\n{{company_name}} Team",
                'placeholders' => ['user_name', 'loan_reference', 'payment_amount', 'payment_date', 'transaction_id', 'remaining_balance', 'next_payment_date', 'company_name'],
                'is_active' => true,
            ],
            [
                'name' => 'Loan Completion',
                'shortcode' => 'loan_completion',
                'content' => "Dear {{user_name}},\n\nCongratulations! You have successfully completed your loan (Reference: {{loan_reference}}).\n\nAll payments have been received and your loan is now closed.\n\nThank you for choosing {{company_name}} for your financial needs.\n\nBest regards,\n{{company_name}} Team",
                'placeholders' => ['user_name', 'loan_reference', 'company_name'],
                'is_active' => true,
            ],
        ];

        foreach ($templates as $template) {
            EmailTemplate::create($template);
        }
    }
}
