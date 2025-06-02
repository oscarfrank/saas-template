<?php

namespace Modules\KYC\Http\Controllers;

use Modules\KYC\Models\KycVerification;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

use App\Http\Controllers\Controller;

class KYCController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $kycVerifications = KycVerification::with('user')
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return Inertia::render('kyc/index', [
            'kycVerifications' => $kycVerifications
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $existingKyc = KycVerification::where('user_id', Auth::id())->first();
        
        // Only redirect if the user has an approved KYC
        if ($existingKyc && $existingKyc->status === 'approved') {
            return redirect()->route('kyc.show', ['tenant' => tenant('id')]);
        }

        // For rejected or pending KYC, show the form with existing data
        return Inertia::render('kyc/create', [
            'existingKyc' => $existingKyc ? [
                'full_name' => $existingKyc->full_name,
                'date_of_birth' => $existingKyc->date_of_birth,
                'phone_number' => $existingKyc->phone_number,
                'address_line_1' => $existingKyc->address_line_1,
                'address_line_2' => $existingKyc->address_line_2,
                'city' => $existingKyc->city,
                'state_province' => $existingKyc->state_province,
                'postal_code' => $existingKyc->postal_code,
                'country' => $existingKyc->country,
                'id_type' => $existingKyc->id_type,
                'id_number' => $existingKyc->id_number,
            ] : null
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        \Log::info('KYC Store Request Data:', $request->all());
        
        $request->validate([
            'full_name' => 'required|string|max:255',
            'date_of_birth' => 'required|date',
            'phone_number' => 'required|string|max:20',
            'address_line_1' => 'required|string|max:255',
            'address_line_2' => 'nullable|string|max:255',
            'city' => 'required|string|max:255',
            'state_province' => 'required|string|max:255',
            'postal_code' => 'required|string|max:20',
            'country' => 'required|string|max:255',
            'id_type' => 'required|string|in:passport,national_id,drivers_license',
            'id_number' => 'required|string|max:50',
            'id_document_front' => 'required|file|mimes:jpeg,png,pdf|max:2048',
            'id_document_back' => 'required|file|mimes:jpeg,png,pdf|max:2048',
        ]);

        $frontPath = $request->file('id_document_front')->store('images/kyc/documents', 'public');
        $backPath = $request->file('id_document_back')->store('images/kyc/documents', 'public');

        // Check if user has an existing KYC verification
        $existingKyc = KycVerification::where('user_id', Auth::id())->first();

        if ($existingKyc && $existingKyc->status === 'rejected') {
            // Move old documents to rejected directory
            if ($existingKyc->id_document_front) {
                $oldFrontPath = $existingKyc->id_document_front;
                $newFrontPath = str_replace('documents', 'rejected', $oldFrontPath);
                Storage::disk('public')->move($oldFrontPath, $newFrontPath);
            }
            if ($existingKyc->id_document_back) {
                $oldBackPath = $existingKyc->id_document_back;
                $newBackPath = str_replace('documents', 'rejected', $oldBackPath);
                Storage::disk('public')->move($oldBackPath, $newBackPath);
            }

            // Update existing rejected KYC
            $existingKyc->update([
                'full_name' => $request->full_name,
                'date_of_birth' => $request->date_of_birth,
                'phone_number' => $request->phone_number,
                'email' => $request->email,
                'address_line_1' => $request->address_line_1,
                'address_line_2' => $request->address_line_2,
                'city' => $request->city,
                'state_province' => $request->state_province,
                'postal_code' => $request->postal_code,
                'country' => $request->country,
                'id_type' => $request->id_type,
                'id_number' => $request->id_number,
                'id_document_front' => $frontPath,
                'id_document_back' => $backPath,
                'status' => 'pending',
                'submitted_at' => now(),
                'rejection_reason' => null,
                'verified_by' => null,
                'verified_at' => null,
            ]);

            return redirect()->route('kyc.show', ['tenant' => tenant('id')])->with('success', 'KYC verification resubmitted successfully.');
        }

        // Create new KYC verification
        $kycVerification = KycVerification::create([
            'user_id' => Auth::id(),
            'full_name' => $request->full_name,
            'date_of_birth' => $request->date_of_birth,
            'phone_number' => $request->phone_number,
            'email' => $request->email,
            'address_line_1' => $request->address_line_1,
            'address_line_2' => $request->address_line_2,
            'city' => $request->city,
            'state_province' => $request->state_province,
            'postal_code' => $request->postal_code,
            'country' => $request->country,
            'id_type' => $request->id_type,
            'id_number' => $request->id_number,
            'id_document_front' => $frontPath,
            'id_document_back' => $backPath,
            'status' => 'pending',
            'submitted_at' => now(),
        ]);

        return redirect()->route('kyc.show', ['tenant' => tenant('id')])->with('success', 'KYC verification submitted successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(KycVerification $kycVerification = null)
    {
        // If no KYC ID is provided, show the user's own KYC
        if (!$kycVerification) {
            $kycVerification = KycVerification::where('user_id', Auth::id())->first();

            if (!$kycVerification) {
                return redirect()->route('kyc.create', ['tenant' => tenant('id')]);
            }

            return Inertia::render('kyc/show', [
                'kycVerification' => $kycVerification
            ]);
        }

        // If a KYC ID is provided, show the admin view
        return Inertia::render('kyc/admin/show', [
            'kycVerification' => $kycVerification->load('user')
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(KycVerification $kycVerification)
    {
        return Inertia::render('kyc/edit', [
            'kyc' => $kycVerification->load('user')
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, KycVerification $kycVerification)
    {
        $request->validate([
            'status' => 'required|in:pending,approved,rejected',
            'rejection_reason' => 'required_if:status,rejected|nullable|string|max:255',
        ]);

        $kycVerification->update([
            'status' => $request->status,
            'rejection_reason' => $request->rejection_reason,
            'verified_by' => Auth::id(),
            'verified_at' => now(),
        ]);

        // Update user's kyc_verified_at timestamp
        $user = $kycVerification->user;
        if ($request->status === 'approved') {
            $user->kyc_verified_at = now();
        } else {
            $user->kyc_verified_at = null;
        }
        $user->save();

        return redirect()->route('kyc.index', ['tenant' => tenant('id')])->with('success', 'KYC verification status updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(KycVerification $kycVerification)
    {
        //
    }
}
