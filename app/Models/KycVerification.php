<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KycVerification extends Model
{
    protected $fillable = [
        'user_id',
        'full_name',
        'date_of_birth',
        'phone_number',
        'email',
        'address_line_1',
        'address_line_2',
        'city',
        'state_province',
        'postal_code',
        'country',
        'id_type',
        'id_number',
        'id_document_front',
        'id_document_back',
        'status',
        'verified_by',
        'rejection_reason',
        'submitted_at',
        'verified_at'
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'submitted_at' => 'datetime',
        'verified_at' => 'datetime'
    ];
}
