<?php

declare(strict_types=1);

namespace Modules\Cortex\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Cortex\Models\MirageSetting;
use Modules\Cortex\Support\MirageImageProvider;
use Modules\Cortex\Support\MirageOpenAiImageModel;

final class MirageSettingsController extends Controller
{
    public function index(): Response
    {
        $tenantId = tenant('id');
        if (! is_string($tenantId) || $tenantId === '') {
            abort(404);
        }

        $setting = MirageSetting::getOrCreateForTenant($tenantId);

        return Inertia::render('cortex/agents/mirage-settings', [
            'imageProvider' => $setting->image_provider->value,
            'openAiImageModel' => $setting->openai_image_model->value,
            'providers' => MirageImageProvider::optionsForInertia(),
            'openAiModels' => MirageOpenAiImageModel::optionsForInertia(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $tenantId = tenant('id');
        if (! is_string($tenantId) || $tenantId === '') {
            abort(404);
        }

        $validated = $request->validate([
            'image_provider' => ['required', Rule::enum(MirageImageProvider::class)],
            'openai_image_model' => ['required_if:image_provider,openai', Rule::enum(MirageOpenAiImageModel::class)],
        ]);

        $setting = MirageSetting::getOrCreateForTenant($tenantId);
        $setting->image_provider = $validated['image_provider'];
        if (($validated['image_provider'] ?? null) === MirageImageProvider::OpenAi->value) {
            $setting->openai_image_model = $validated['openai_image_model'] ?? MirageOpenAiImageModel::DallE3->value;
        }
        $setting->save();

        return redirect()->back()->with('success', 'Mirage image settings saved.');
    }
}
