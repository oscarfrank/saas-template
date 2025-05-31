<?php

namespace Modules\User\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

use Laravel\Cashier\Billable;
use Laravel\Fortify\TwoFactorAuthenticatable;

use Modules\KYC\Models\KycVerification;
use Modules\Payment\Models\PaymentMethod;

use Modules\Transaction\Models\Transaction;

use Modules\Loan\Models\CustomPackage;
use Modules\Loan\Models\LoanPackage;
use Modules\Loan\Models\BorrowPackage;
use Modules\Loan\Models\LoanPayment;
use Modules\Loan\Models\BorrowPayment;
use Modules\Loan\Models\Loan;
use Modules\Loan\Models\Borrow;
use Modules\Payment\Models\Customer;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasRoles, Billable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'email_verified_at',
        'password',
        'kyc_verified_at',
        'google_id',
        'facebook_id',
        'github_id',
        'azure_id',
        'oauth_tokens',
        'oauth_provider',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'two_factor_confirmed_at',
        'two_factor_method',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
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
        'oauth_tokens' => 'array',
        'two_factor_confirmed_at' => 'datetime',
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

    public function customer()
    {
        return $this->hasOne(Customer::class);
    }

    // Proxy method to check subscription
    public function subscribed($name = 'default', $price = null)
    {
        if (!$this->customer) {
            return false;
        }
        
        return $this->customer->subscribed($name, $price);
    }

    // Proxy method to get subscription
    public function subscription($name = 'default')
    {
        if (!$this->customer) {
            return null;
        }
        
        return $this->customer->subscription($name);
    }

    public function createSubscription(Request $request)
    {
        $user = auth()->user();
        
        // Make sure the user has a customer record
        if (!$user->customer) {
            $customer = new Customer();
            $customer->user_id = $user->id;
            $customer->save();
            $user->refresh();
        }
        
        // Create the subscription on the customer
        $subscription = $user->customer->newSubscription('default', $request->plan)
            ->create($request->payment_method);
            
        return redirect()->route('dashboard')
            ->with('success', 'Your subscription was created successfully!');
    }

    /**
     * Get the OAuth tokens for a specific provider.
     *
     * @param string $provider
     * @return array|null
     */
    public function getOAuthTokens(string $provider): ?array
    {
        return $this->oauth_tokens[$provider] ?? null;
    }

    /**
     * Set the OAuth tokens for a specific provider.
     *
     * @param string $provider
     * @param array $tokens
     * @return void
     */
    public function setOAuthTokens(string $provider, array $tokens): void
    {
        $currentTokens = $this->oauth_tokens ?? [];
        $currentTokens[$provider] = $tokens;
        $this->oauth_tokens = $currentTokens;
        $this->save();
    }

    /**
     * Check if the user has a specific OAuth provider connected.
     *
     * @param string $provider
     * @return bool
     */
    public function hasOAuthProvider(string $provider): bool
    {
        return !empty($this->getOAuthTokens($provider));
    }

    /**
     * Get the user's OAuth provider ID.
     *
     * @param string $provider
     * @return string|null
     */
    public function getOAuthId(string $provider): ?string
    {
        return $this->{"{$provider}_id"};
    }

    /**
     * Set the user's OAuth provider ID.
     *
     * @param string $provider
     * @param string $id
     * @return void
     */
    public function setOAuthId(string $provider, string $id): void
    {
        $this->{"{$provider}_id"} = $id;
        $this->save();
    }

    /**
     * Check if the user's OAuth token is expired.
     *
     * @param string $provider
     * @return bool
     */
    public function isOAuthTokenExpired(string $provider): bool
    {
        $tokens = $this->getOAuthTokens($provider);
        if (!$tokens || !isset($tokens['expires_at'])) {
            return true;
        }

        return now()->isAfter($tokens['expires_at']);
    }

    /**
     * Get the user's primary OAuth provider.
     *
     * @return string|null
     */
    public function getPrimaryOAuthProvider(): ?string
    {
        return $this->oauth_provider;
    }

    /**
     * Set the user's primary OAuth provider.
     *
     * @param string $provider
     * @return void
     */
    public function setPrimaryOAuthProvider(string $provider): void
    {
        $this->oauth_provider = $provider;
        $this->save();
    }
}
