<?php

namespace App\Http\Controllers;

// use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class OuterPagesController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        return Inertia::render('homepage/welcome');
    }

    public function faq(Request $request)
    {
        return Inertia::render('homepage/faq');
    }

    public function contact(Request $request)
    {
        return Inertia::render('homepage/contact');
    }

    public function calculator(Request $request)
    {
        return Inertia::render('homepage/calculator');
    }

    public function privacy(Request $request)
    {
        return Inertia::render('homepage/privacy');
    }

    public function about(Request $request)
    {
        return Inertia::render('homepage/about');
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
