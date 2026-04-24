<?php

declare(strict_types=1);

namespace Modules\Cortex\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $mirage_session_id
 * @property int $position
 * @property string $input_mode
 * @property string $focus
 * @property int $idea_count
 * @property string|null $input_text
 * @property string|null $youtube_url
 * @property array<string, mixed>|null $source_json
 * @property list<array<string, mixed>> $ideas_json
 */
final class MirageSessionTurn extends Model
{
    protected $table = 'mirage_session_turns';

    protected $fillable = [
        'mirage_session_id',
        'position',
        'input_mode',
        'focus',
        'idea_count',
        'input_text',
        'youtube_url',
        'source_json',
        'ideas_json',
    ];

    protected function casts(): array
    {
        return [
            'source_json' => 'array',
            'ideas_json' => 'array',
        ];
    }

    /**
     * @return BelongsTo<MirageSession, $this>
     */
    public function session(): BelongsTo
    {
        return $this->belongsTo(MirageSession::class, 'mirage_session_id', 'id');
    }

    /**
     * @return HasMany<MirageSessionOutput, $this>
     */
    public function outputs(): HasMany
    {
        return $this->hasMany(MirageSessionOutput::class, 'mirage_session_turn_id');
    }
}
