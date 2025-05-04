<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            // User Association
            $table->foreignId('user_id')->constrained()->onDelete('cascade')->comment('User who receives the notification');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete()->comment('User or admin who triggered the notification');
            
            // Notification Content
            $table->string('title')->comment('Notification title/heading');
            $table->text('message')->comment('Notification message content');
            $table->string('summary')->nullable()->comment('Short summary for push notifications');
            
            // Notification Type and Category
            $table->enum('type', [
                // User Account
                'account_created',
                'account_updated',
                'password_changed',
                'email_changed',
                'phone_changed',
                'kyc_submitted',
                'kyc_approved',
                'kyc_rejected',
                'kyc_additional_info',
                
                // Loan Related
                'loan_applied',
                'loan_approved',
                'loan_rejected',
                'loan_disbursed',
                'loan_payment_due',
                'loan_payment_upcoming',
                'loan_payment_received',
                'loan_payment_late',
                'loan_payment_missed',
                'loan_completed',
                'loan_defaulted',
                
                // Investment Related
                'investment_applied',
                'investment_approved',
                'investment_rejected',
                'investment_funded',
                'investment_interest_paid',
                'investment_principal_returned',
                'investment_upcoming_maturity',
                'investment_matured',
                'investment_completed',
                
                // Transaction Related
                'deposit_initiated',
                'deposit_completed',
                'deposit_failed',
                'withdrawal_initiated',
                'withdrawal_completed',
                'withdrawal_failed',
                'transaction_completed',
                'transaction_failed',
                
                // Security Related
                'login_attempt',
                'login_successful',
                'login_failed',
                'suspicious_activity',
                'device_verification',
                
                // System Related
                'system_maintenance',
                'platform_update',
                'new_feature',
                'terms_updated',
                
                // Other
                'custom_message',
                'other'
            ])->comment('Type of notification');
            
            $table->string('category')->nullable()->comment('Additional categorization');
            
            // Related Entities (polymorphic relationship)
            $table->string('notifiable_type')->nullable()->comment('Type of related entity');
            $table->unsignedBigInteger('notifiable_id')->nullable()->comment('ID of related entity');
            
            // Specific Related Entity IDs (for easier querying)
            $table->foreignId('loan_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('loan_payment_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('borrow_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('borrow_payment_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('transaction_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('kyc_verification_id')->nullable()->constrained()->nullOnDelete();
            
            // Notification Status
            $table->boolean('is_read')->default(false)->comment('Whether notification has been read');
            $table->timestamp('read_at')->nullable()->comment('When notification was read');
            $table->boolean('is_archived')->default(false)->comment('Whether notification is archived');
            $table->timestamp('archived_at')->nullable()->comment('When notification was archived');
            
            // Delivery Details
            $table->enum('delivery_channels', ['in_app', 'email', 'sms', 'push', 'all'])
                ->default('in_app')
                ->comment('Channels through which notification was delivered');
            $table->boolean('email_sent')->default(false);
            $table->boolean('sms_sent')->default(false);
            $table->boolean('push_sent')->default(false);
            $table->timestamp('email_sent_at')->nullable();
            $table->timestamp('sms_sent_at')->nullable();
            $table->timestamp('push_sent_at')->nullable();
            
            // Action Details
            $table->string('action_text')->nullable()->comment('Text for action button/link');
            $table->string('action_url')->nullable()->comment('URL for action button/link');
            $table->string('deep_link')->nullable()->comment('Mobile app deep link');
            
            // Prioritization and Expiry
            $table->enum('priority', ['low', 'normal', 'high', 'urgent'])->default('normal')->comment('Notification priority');
            $table->boolean('is_sticky')->default(false)->comment('Whether notification stays at top');
            $table->boolean('requires_acknowledgment')->default(false)->comment('Whether user must acknowledge');
            $table->timestamp('acknowledged_at')->nullable();
            $table->timestamp('expires_at')->nullable()->comment('When notification expires');
            
            // Visual Customization
            $table->string('icon')->nullable()->comment('Icon for the notification');
            $table->string('color')->nullable()->comment('Color code for the notification');
            $table->string('image_url')->nullable()->comment('URL to image to display');
            
            // Grouping and Batching
            $table->string('group_id')->nullable()->comment('ID for grouping similar notifications');
            $table->integer('group_order')->nullable()->comment('Order within a group');
            $table->boolean('is_grouped')->default(false);
            $table->integer('count')->default(1)->comment('Count for grouped notifications');
            
            // Tracking and Analytics
            $table->boolean('is_clicked')->default(false);
            $table->timestamp('clicked_at')->nullable();
            $table->string('clicked_from')->nullable()->comment('Device/platform notification was clicked from');
            $table->json('interaction_history')->nullable()->comment('History of user interactions');
            
            // System Fields
            $table->boolean('is_system_generated')->default(true)->comment('Whether generated by system or admin');
            $table->json('metadata')->nullable()->comment('Additional notification metadata');
            
            // Standard timestamps
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index('user_id');
            $table->index('type');
            $table->index('is_read');
            $table->index('priority');
            $table->index(['notifiable_type', 'notifiable_id']);
            $table->index('created_at');
            $table->index('expires_at');
            $table->index('group_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
