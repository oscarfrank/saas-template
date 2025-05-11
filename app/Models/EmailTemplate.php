<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EmailTemplate extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'subject',
        'content',
        'type',
        'placeholders',
        'is_active'
    ];

    protected $casts = [
        'placeholders' => 'array',
        'is_active' => 'boolean'
    ];

    public static function getTypes()
    {
        return [
            'registration' => 'Registration',
            'loan_status' => 'Loan Status',
            'password_reset' => 'Password Reset',
            'loan_approval' => 'Loan Approval',
            'loan_rejection' => 'Loan Rejection',
            'payment_reminder' => 'Payment Reminder',
            'kyc_verification' => 'KYC Verification',
            'account_activation' => 'Account Activation',
        ];
    }

    public static function getDefaultPlaceholders()
    {
        return [
            'user_name' => 'User\'s full name',
            'user_email' => 'User\'s email address',
            'loan_amount' => 'Loan amount',
            'loan_reference' => 'Loan reference number',
            'loan_status' => 'Current loan status',
            'due_date' => 'Payment due date',
            'company_name' => 'Your company name',
            'support_email' => 'Support email address',
            'reset_link' => 'Password reset link',
            'activation_link' => 'Account activation link',
        ];
    }
}
