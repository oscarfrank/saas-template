<?php

declare(strict_types=1);

namespace Modules\OrgMcp\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Modules\OrgMcp\Services\OrgMcpAuthService;
use Modules\OrgMcp\Services\OrgMcpPolicyService;

class OrgMcpSessionController extends Controller
{
    public function __construct(
        private readonly OrgMcpAuthService $authService,
        private readonly OrgMcpPolicyService $policyService,
    ) {}

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tenant_id' => ['required', 'string', 'max:64'],
            'client_key' => ['required', 'string', 'max:100'],
            'client_secret' => ['required', 'string', 'max:255'],
            'profile_user_id' => ['nullable', 'integer'],
        ]);

        try {
            $profileUserId = isset($validated['profile_user_id']) ? (int) $validated['profile_user_id'] : null;
            $this->policyService->assertProfileInTenant((string) $validated['tenant_id'], $profileUserId);

            $session = $this->authService->issueSession(
                (string) $validated['tenant_id'],
                (string) $validated['client_key'],
                (string) $validated['client_secret'],
                $profileUserId
            );
        } catch (\RuntimeException $e) {
            throw ValidationException::withMessages([
                'credentials' => [$e->getMessage()],
            ]);
        }

        return response()->json([
            'access_token' => $session['token'],
            'token_type' => 'Bearer',
            'expires_in' => $session['expires_in'],
            'session_id' => $session['session_id'],
        ]);
    }
}
