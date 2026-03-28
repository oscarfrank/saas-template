<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BackupSettings extends Model
{
    protected $fillable = [
        'google_drive_refresh_token_encrypted',
        'google_drive_folder_id',
        'schedule_enabled',
        'schedule_frequency',
        'schedule_time',
        'schedule_weekday',
        'schedule_include_storage',
        'last_scheduled_run_at',
        'last_scheduled_error',
    ];

    protected function casts(): array
    {
        return [
            'schedule_enabled' => 'boolean',
            'schedule_include_storage' => 'boolean',
            'schedule_weekday' => 'integer',
            'last_scheduled_run_at' => 'datetime',
        ];
    }

    public static function instance(): self
    {
        $row = static::query()->first();
        if ($row !== null) {
            return $row;
        }

        return static::query()->create([
            'schedule_frequency' => 'daily',
            'schedule_time' => '02:00',
        ]);
    }

    public function isGoogleDriveConnected(): bool
    {
        return is_string($this->google_drive_refresh_token_encrypted)
            && $this->google_drive_refresh_token_encrypted !== '';
    }
}
