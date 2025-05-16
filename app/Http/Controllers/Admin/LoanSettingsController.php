<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LoanSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LoanSettingsController extends Controller
{
    public function index()
    {
        $settings = LoanSetting::all()->groupBy('group');
        
        return Inertia::render('admin/settings/loan-settings', [
            'settings' => $settings,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|string',
            'settings.*.value' => 'required',
            'settings.*.type' => 'required|string',
        ]);

        foreach ($validated['settings'] as $setting) {
            $loanSetting = LoanSetting::where('key', $setting['key'])->first();
            
            if ($loanSetting) {
                // Handle boolean values specifically
                if ($loanSetting->type === 'boolean') {
                    $value = filter_var($setting['value'], FILTER_VALIDATE_BOOLEAN) ? 'true' : 'false';
                } else {
                    $value = $setting['value'];
                }
                
                $loanSetting->value = $value;
                $loanSetting->save();
            }
        }

        return redirect()->back()->with('success', 'Loan settings updated successfully');
    }
} 