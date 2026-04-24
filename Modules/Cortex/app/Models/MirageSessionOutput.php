<?php

declare(strict_types=1);

namespace Modules\Cortex\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property int $mirage_session_turn_id
 * @property string $idea_id
 * @property string $title
 * @property string|null $thumb_text
 * @property string|null $rationale
 * @property string $image_prompt
 * @property string $disk
 * @property string|null $path
 * @property string|null $mime
 * @property string|null $revised_prompt
 * @property string|null $error_message
 */
final class MirageSessionOutput extends Model
{
    use SoftDeletes;

    protected $table = 'mirage_session_outputs';

    protected $fillable = [
        'mirage_session_turn_id',
        'idea_id',
        'title',
        'thumb_text',
        'rationale',
        'image_prompt',
        'disk',
        'path',
        'mime',
        'revised_prompt',
        'error_message',
    ];

    /**
     * @return BelongsTo<MirageSessionTurn, $this>
     */
    public function turn(): BelongsTo
    {
        return $this->belongsTo(MirageSessionTurn::class, 'mirage_session_turn_id');
    }
}
