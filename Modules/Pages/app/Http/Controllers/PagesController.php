<?php

namespace Modules\Pages\Http\Controllers;

use App\Http\Controllers\Controller;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class PagesController extends Controller
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
        return Inertia::render('dashboard/admin/admin-dashboard');
    }

    public function lenderDashboard(Request $request)
    {
        return Inertia::render('dashboard/user/lender-dashboard');
    }

    public function borrowerDashboard(Request $request)
    {
        return Inertia::render('dashboard/user/borrower-dashboard');
    }

    public function youtuberDashboard(Request $request)
    {
        return Inertia::render('dashboard/user/youtuber-dashboard');
    }
    
    




}
