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

class DashboardController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
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
