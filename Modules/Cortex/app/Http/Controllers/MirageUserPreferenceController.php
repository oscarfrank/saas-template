<?php

declare(strict_types=1);

namespace Modules\Cortex\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Cortex\Models\MirageUserPreference;

final class MirageUserPreferenceController extends Controller
{
    public function update(Request $request): JsonResponse
    {
        $tenantId = tenant('id');
        if (! is_string($tenantId) || $tenantId === '') {
            return response()->json(['message' => 'Tenant context missing.'], 503);
        }

        $user = $request->user();
        if ($user === null) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $validated = $request->validate([
            'use_default_face_reference' => ['required', 'boolean'],
            'use_default_style_references' => ['required', 'boolean'],
        ]);

        $pref = MirageUserPreference::getOrCreateForTenantUser($tenantId, (int) $user->id);
        $pref->update([
            'use_default_face_reference' => $validated['use_default_face_reference'],
            'use_default_style_references' => $validated['use_default_style_references'],
        ]);

        return response()->json([
            'preferences' => [
                'use_default_face_reference' => $pref->use_default_face_reference,
                'use_default_style_references' => $pref->use_default_style_references,
            ],
        ]);
    }
}
