<?php

namespace Modules\Loan\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Stancl\Tenancy\Database\Concerns\BelongsToPrimaryModel;

class LoanNote extends Model
{
    use BelongsToPrimaryModel;

    protected $fillable = [
        'loan_id',
        'content',
        'created_by',
        'updated_by',
    ];

    public function getRelationshipToPrimaryModel(): string
    {
        return 'loan';
    }

    /**
     * Get the loan that owns the note.
     */
    public function loan(): BelongsTo
    {
        return $this->belongsTo(Loan::class);
    }

    /**
     * Get the user that created the note.
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user that last updated the note.
     */
    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
} 