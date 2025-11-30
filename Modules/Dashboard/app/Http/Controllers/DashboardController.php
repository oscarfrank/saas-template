<?php

namespace Modules\Dashboard\Http\Controllers;

// use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Modules\User\Models\User;
use Modules\Loan\Models\Loan;
use Modules\Ticket\Models\Ticket;
use Modules\Payment\Models\Currency;
use Illuminate\Support\Facades\DB;
use Modules\Loan\Http\Controllers\LoanDashboardController;
use App\Http\Controllers\Controller;
class DashboardController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Check if user has 'user' role or no roles at all
        if ($user->hasRole('user') || $user->roles->isEmpty()) {
            return (new LoanDashboardController)->index($request);
        }
        
        return Inertia::render('dashboard/user/dashboard');
    }

    public function lenderDashboard(Request $request)
    {
        return Inertia::render('dashboard/user/lender-dashboard');
    }

    public function youtuberDashboard(Request $request)
    {
        return Inertia::render('dashboard/user/youtuber-dashboard');
    }
}
