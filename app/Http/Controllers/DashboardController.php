<?php

namespace App\Http\Controllers;

// use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use App\Models\User;
use App\Models\Loan;
use App\Models\Ticket;
use App\Models\Currency;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\LoanDashboardController;

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
        
        return Inertia::render('dashboard/dashboard');
    }

    public function lenderDashboard(Request $request)
    {
        return Inertia::render('dashboard/lender-dashboard');
    }

    public function youtuberDashboard(Request $request)
    {
        return Inertia::render('dashboard/youtuber-dashboard');
    }
}
