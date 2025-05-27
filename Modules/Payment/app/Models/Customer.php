<?php

namespace Modules\Payment\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Cashier\Billable;
use Modules\User\Models\User;

class Customer extends Model
{
    use Billable;
    
    protected $fillable = ['user_id', 'stripe_id', 'pm_type', 'pm_last_four'];
    
    protected $dates = ['trial_ends_at'];
    
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function stripeEmail()
    {
        return $this->user->email;
    }

    public function stripeName()
    {
        return $this->user->first_name . ' ' . $this->user->last_name;
    }
}