<?php

namespace Modules\Payment\Http\Controllers\Flutterwave;

use Modules\Payment\Services\Flutterwave\TransferService;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
class TransferController extends Controller
{
    protected $transferService;

    public function __construct(TransferService $transferService)
    {
        $this->transferService = $transferService;
    }

    public function initiateTransfer(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:100',
            'account_number' => 'required|string|size:10',
            'bank_code' => 'required|string',
            'narration' => 'nullable|string|max:255'
        ]);

        $result = $this->transferService->transferToBank(
            $request->amount,
            $request->account_number,
            $request->bank_code,
            $request->narration
        );

        if ($result['success']) {
            return redirect()->back()->with('success', 'Transfer initiated successfully');
        }

        return redirect()->back()->with('error', $result['message']);
    }
}