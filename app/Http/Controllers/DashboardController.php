<?php

namespace App\Http\Controllers;

// use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class DashboardController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        return Inertia::render('dashboard/dashboard');
    }

    public function adminDashboard(Request $request)
    {
        return Inertia::render('dashboard/admin-dashboard');
    }

    public function lenderDashboard(Request $request)
    {
        return Inertia::render('dashboard/lender-dashboard');
    }

    public function borrowerDashboard(Request $request)
    {
        return Inertia::render('dashboard/borrower-dashboard');
    }

    public function youtuberDashboard(Request $request)
    {
        return Inertia::render('dashboard/youtuber-dashboard');
    }
    
    




}
