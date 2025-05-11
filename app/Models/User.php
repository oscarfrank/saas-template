<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;
use App\Models\KycVerification;
use App\Models\PaymentMethod;
use App\Models\Loan;
use App\Models\Borrow;
use App\Models\Notification;
use App\Models\Transaction;
use App\Models\CustomPackage;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use App\Models\LoanPackage;
use App\Models\BorrowPackage;
use App\Models\LoanPayment;
use App\Models\BorrowPayment;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'password',
        'kyc_verified_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'kyc_verified_at' => 'datetime',
    ];

    /**
     * Get the role that owns the user.
     */
    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function permissions()
    {
        return $this->belongsToMany(Permission::class);
    }

    /**
     * Get the KYC verification for the user.
     */
    public function kycVerification()
    {
        return $this->hasOne(KycVerification::class);
    }

    /**
     * Check if the user's KYC is verified.
     *
     * @return bool
     */
    public function isKycVerified(): bool
    {
        return $this->kyc_verified_at !== null;
    }

    /**
     * Assign a role to the user by name.
     *
     * @param string $roleName The name of the role to assign
     * @return void
     */
    public function assignRoleByName(string $roleName): void
    {
        $this->syncRoles([$roleName]);
    }

    /**
     * Check if the user has a specific role by name.
     *
     * @param string $roleName The name of the role to check
     * @return bool
     */
    public function hasRoleByName(string $roleName): bool
    {
        return $this->hasRole($roleName);
    }

    /**
     * Get the user's primary role name.
     *
     * @return string|null
     */
    public function getRoleName(): ?string
    {
        return $this->roles->first()?->name;
    }

    /**
     * Remove all roles from the user.
     *
     * @return void
     */
    public function removeAllRoles(): void
    {
        $this->syncRoles([]);
    }

    /**
     * Get the user's KYC verifications.
     */
    public function kycVerifications()
    {
        return $this->hasMany(KycVerification::class);
    }

    /**
     * Get the user's payment methods.
     */
    public function paymentMethods()
    {
        return $this->hasMany(PaymentMethod::class);
    }

    /**
     * Get the user's loans.
     */
    public function loans()
    {
        return $this->hasMany(Loan::class);
    }

    /**
     * Get the user's borrows.
     */
    public function borrows()
    {
        return $this->hasMany(Borrow::class);
    }

    /**
     * Get notifications where the user is the creator.
     */
    public function createdNotifications()
    {
        return $this->hasMany(Notification::class, 'created_by');
    }

    /**
     * Get transactions where the user is the sender.
     */
    public function sentTransactions()
    {
        return $this->hasMany(Transaction::class, 'sender_id');
    }

    /**
     * Get transactions where the user is the recipient.
     */
    public function receivedTransactions()
    {
        return $this->hasMany(Transaction::class, 'recipient_id');
    }

    /**
     * Get transactions created by the user.
     */
    public function createdTransactions()
    {
        return $this->hasMany(Transaction::class, 'created_by');
    }

    /**
     * Get transactions processed by the user.
     */
    public function processedTransactions()
    {
        return $this->hasMany(Transaction::class, 'processed_by');
    }

    /**
     * Get transactions adjusted by the user.
     */
    public function adjustedTransactions()
    {
        return $this->hasMany(Transaction::class, 'adjusted_by');
    }

    /**
     * Get transactions reviewed by the user.
     */
    public function reviewedTransactions()
    {
        return $this->hasMany(Transaction::class, 'reviewed_by');
    }

    /**
     * Get custom packages approved by the user.
     */
    public function approvedCustomPackages()
    {
        return $this->hasMany(CustomPackage::class, 'approved_by');
    }

    /**
     * Get custom packages created by the user.
     */
    public function createdCustomPackages()
    {
        return $this->hasMany(CustomPackage::class, 'created_by');
    }

    /**
     * Get loan packages created by the user.
     */
    public function createdLoanPackages()
    {
        return $this->hasMany(LoanPackage::class, 'created_by');
    }

    /**
     * Get borrow packages created by the user.
     */
    public function createdBorrowPackages()
    {
        return $this->hasMany(BorrowPackage::class, 'created_by');
    }

    /**
     * Get loan payments recorded by the user.
     */
    public function recordedLoanPayments()
    {
        return $this->hasMany(LoanPayment::class, 'recorded_by');
    }

    /**
     * Get loan payments adjusted by the user.
     */
    public function adjustedLoanPayments()
    {
        return $this->hasMany(LoanPayment::class, 'adjusted_by');
    }

    /**
     * Get borrow payments processed by the user.
     */
    public function processedBorrowPayments()
    {
        return $this->hasMany(BorrowPayment::class, 'processed_by');
    }

    /**
     * Get borrow payments adjusted by the user.
     */
    public function adjustedBorrowPayments()
    {
        return $this->hasMany(BorrowPayment::class, 'adjusted_by');
    }

    /**
     * Get KYC verifications verified by the user.
     */
    public function verifiedKycVerifications()
    {
        return $this->hasMany(KycVerification::class, 'verified_by');
    }
}
