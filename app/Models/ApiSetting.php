<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ApiSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'api_key',
        'api_secret',
        'webhook_url',
        'is_active',
        'additional_data',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'additional_data' => 'array',
    ];
}
