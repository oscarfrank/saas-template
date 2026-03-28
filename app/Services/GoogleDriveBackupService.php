<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class GoogleDriveBackupService
{
    /**
     * Upload a local file to Google Drive (app-created files scope).
     *
     * @param  string|null  $folderId  Parent folder id, or null for app data folder root
     */
    public function uploadFile(string $localPath, string $driveFileName, ?string $folderId, string $refreshTokenEncrypted): void
    {
        if (! is_readable($localPath)) {
            throw new RuntimeException('Backup file is not readable.');
        }

        $accessToken = $this->refreshAccessToken($refreshTokenEncrypted);
        $contents = file_get_contents($localPath);
        if ($contents === false) {
            throw new RuntimeException('Could not read backup file.');
        }

        $metadata = ['name' => $driveFileName];
        if (is_string($folderId) && $folderId !== '') {
            $metadata['parents'] = [$folderId];
        }

        $boundary = 'b'.Str::random(24);
        $metaJson = json_encode($metadata, JSON_THROW_ON_ERROR);
        $body = "--{$boundary}\r\n";
        $body .= "Content-Type: application/json; charset=UTF-8\r\n\r\n";
        $body .= $metaJson."\r\n";
        $body .= "--{$boundary}\r\n";
        $body .= "Content-Type: application/octet-stream\r\n\r\n";
        $body .= $contents."\r\n";
        $body .= "--{$boundary}--\r\n";

        $response = Http::withToken($accessToken)
            ->withHeaders([
                'Content-Type' => 'multipart/related; boundary='.$boundary,
            ])
            ->withBody($body)
            ->timeout(600)
            ->post('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true');

        if (! $response->successful()) {
            throw new RuntimeException('Google Drive upload failed: '.$response->body());
        }
    }

    public function refreshAccessToken(string $refreshTokenEncrypted): string
    {
        $refreshToken = Crypt::decryptString($refreshTokenEncrypted);

        $clientId = (string) config('services.google.client_id', '');
        $clientSecret = (string) config('services.google.client_secret', '');
        if ($clientId === '' || $clientSecret === '') {
            throw new RuntimeException('Google OAuth client is not configured (services.google).');
        }

        $token = Http::asForm()->timeout(30)->post('https://oauth2.googleapis.com/token', [
            'client_id' => $clientId,
            'client_secret' => $clientSecret,
            'refresh_token' => $refreshToken,
            'grant_type' => 'refresh_token',
        ])->throw()->json();

        $accessToken = (string) ($token['access_token'] ?? '');
        if ($accessToken === '') {
            throw new RuntimeException('Google token refresh did not return an access_token.');
        }

        return $accessToken;
    }
}
