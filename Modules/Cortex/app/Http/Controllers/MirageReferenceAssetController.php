<?php

declare(strict_types=1);

namespace Modules\Cortex\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Modules\Cortex\Models\MirageReferenceAsset;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MirageReferenceAssetController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()?->id;
        if ($userId === null) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $tenantId = tenant('id');
        if (! is_string($tenantId) || $tenantId === '') {
            return response()->json(['message' => 'Tenant context missing.'], 503);
        }

        $validated = $request->validate([
            'kind' => ['required', 'string', 'in:face,style'],
        ]);

        $kind = (string) $validated['kind'];

        $assets = MirageReferenceAsset::query()
            ->where('tenant_id', $tenantId)
            ->forUser($userId)
            ->kind($kind)
            ->orderByDesc('is_default')
            ->orderBy('id')
            ->get(['id', 'kind', 'label', 'is_default', 'created_at']);

        return response()->json([
            'assets' => $assets->map(fn (MirageReferenceAsset $a) => [
                'id' => $a->id,
                'kind' => $a->kind,
                'label' => $a->label,
                'is_default' => $a->is_default,
                'created_at' => $a->created_at?->toIso8601String(),
            ])->values()->all(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $userId = $request->user()?->id;
        if ($userId === null) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $tenantId = tenant('id');
        if (! is_string($tenantId) || $tenantId === '') {
            return response()->json(['message' => 'Tenant context missing.'], 503);
        }

        $validated = $request->validate([
            'kind' => ['required', 'string', 'in:face,style'],
            'label' => ['nullable', 'string', 'max:120'],
            'file' => ['required', 'file', 'max:5120', 'mimes:jpeg,jpg,png,webp,gif'],
        ]);

        $kind = (string) $validated['kind'];

        $count = MirageReferenceAsset::query()
            ->where('tenant_id', $tenantId)
            ->forUser($userId)
            ->kind($kind)
            ->count();

        if ($count >= MirageReferenceAsset::MAX_PER_KIND) {
            return response()->json([
                'message' => 'Library limit reached ('.MirageReferenceAsset::MAX_PER_KIND.' per person). Delete an item to add more.',
            ], 422);
        }

        $file = $request->file('file');
        if ($file === null) {
            return response()->json(['message' => 'No file uploaded.'], 422);
        }

        $extension = strtolower($file->getClientOriginalExtension() ?: 'png');
        if ($extension === 'jpeg') {
            $extension = 'jpg';
        }

        $directory = 'mirage_reference_assets/'.$tenantId.'/'.$userId.'/'.$kind;
        $filename = Str::uuid()->toString().'.'.$extension;
        $path = $file->storeAs($directory, $filename, 'local');

        if ($path === false) {
            return response()->json(['message' => 'Could not store the file.'], 500);
        }

        $mime = $file->getMimeType() ?? 'application/octet-stream';
        $label = isset($validated['label']) ? trim((string) $validated['label']) : '';
        if ($label === '') {
            $label = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME) ?: 'Reference';
        }

        /** @var MirageReferenceAsset $asset */
        $asset = DB::transaction(function () use ($tenantId, $userId, $kind, $label, $path, $mime, $count) {
            $isDefault = $count === 0;

            if ($isDefault) {
                MirageReferenceAsset::query()
                    ->where('tenant_id', $tenantId)
                    ->where('user_id', $userId)
                    ->where('kind', $kind)
                    ->update(['is_default' => false]);
            }

            return MirageReferenceAsset::query()->create([
                'tenant_id' => $tenantId,
                'user_id' => $userId,
                'kind' => $kind,
                'label' => Str::limit($label, 120, ''),
                'disk' => 'local',
                'path' => $path,
                'mime' => $mime,
                'is_default' => $isDefault,
            ]);
        });

        return response()->json([
            'asset' => [
                'id' => $asset->id,
                'kind' => $asset->kind,
                'label' => $asset->label,
                'is_default' => $asset->is_default,
                'created_at' => $asset->created_at?->toIso8601String(),
            ],
        ], 201);
    }

    public function file(MirageReferenceAsset $mirageReferenceAsset): StreamedResponse|\Illuminate\Http\Response
    {
        $userId = request()->user()?->id;
        if ($userId === null) {
            abort(404);
        }

        $tenantId = tenant('id');
        if (! is_string($tenantId) || $tenantId === '' || $mirageReferenceAsset->tenant_id !== $tenantId) {
            abort(404);
        }

        if ((int) $mirageReferenceAsset->user_id !== (int) $userId) {
            abort(404);
        }

        if (! Storage::disk($mirageReferenceAsset->disk)->exists($mirageReferenceAsset->path)) {
            abort(404);
        }

        return Storage::disk($mirageReferenceAsset->disk)->response(
            $mirageReferenceAsset->path,
            null,
            ['Content-Type' => $mirageReferenceAsset->mime ?: 'image/png'],
        );
    }

    public function setDefault(MirageReferenceAsset $mirageReferenceAsset): JsonResponse
    {
        $userId = request()->user()?->id;
        if ($userId === null) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $tenantId = tenant('id');
        if (! is_string($tenantId) || $tenantId === '' || $mirageReferenceAsset->tenant_id !== $tenantId) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        if ((int) $mirageReferenceAsset->user_id !== (int) $userId) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        DB::transaction(function () use ($mirageReferenceAsset, $tenantId, $userId) {
            MirageReferenceAsset::query()
                ->where('tenant_id', $tenantId)
                ->where('user_id', $userId)
                ->where('kind', $mirageReferenceAsset->kind)
                ->update(['is_default' => false]);

            $mirageReferenceAsset->update(['is_default' => true]);
        });

        return response()->json(['ok' => true]);
    }

    public function destroy(MirageReferenceAsset $mirageReferenceAsset): JsonResponse
    {
        $userId = request()->user()?->id;
        if ($userId === null) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $tenantId = tenant('id');
        if (! is_string($tenantId) || $tenantId === '' || $mirageReferenceAsset->tenant_id !== $tenantId) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        if ((int) $mirageReferenceAsset->user_id !== (int) $userId) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $kind = $mirageReferenceAsset->kind;
        $wasDefault = $mirageReferenceAsset->is_default;

        if (Storage::disk($mirageReferenceAsset->disk)->exists($mirageReferenceAsset->path)) {
            Storage::disk($mirageReferenceAsset->disk)->delete($mirageReferenceAsset->path);
        }

        $mirageReferenceAsset->delete();

        if ($wasDefault) {
            $next = MirageReferenceAsset::query()
                ->where('tenant_id', $tenantId)
                ->forUser($userId)
                ->kind($kind)
                ->orderBy('id')
                ->first();

            if ($next !== null) {
                $next->update(['is_default' => true]);
            }
        }

        return response()->json(['ok' => true]);
    }
}
