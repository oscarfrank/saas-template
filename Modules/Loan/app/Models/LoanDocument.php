<?php

namespace Modules\Loan\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Stancl\Tenancy\Database\Concerns\BelongsToPrimaryModel;

class LoanDocument extends Model
{
    use BelongsToPrimaryModel;

    protected $fillable = [
        'loan_id',
        'name',
        'type',
        'file_path',
        'file_size',
        'mime_type',
        'description',
        'uploaded_by',
    ];

    public function getRelationshipToPrimaryModel(): string
    {
        return 'loan';
    }

    /**
     * Get the loan that owns the document.
     */
    public function loan(): BelongsTo
    {
        return $this->belongsTo(Loan::class);
    }

    /**
     * Get the user that uploaded the document.
     */
    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
} 