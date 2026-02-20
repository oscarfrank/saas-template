<?php

namespace Modules\Loan\Http\Controllers;
use App\Http\Controllers\Controller;

use Modules\Loan\Models\Loan;
use Modules\User\Models\User;
use Modules\Ticket\Models\Ticket;
use Modules\Payment\Models\Currency;
use Modules\Settings\Models\SiteSettings;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class LoanDashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        
        // Get current active loan
        $currentLoan = Loan::where('user_id', $user->id)
            ->where('status', 'active')
            ->with(['currency', 'package'])
            ->latest()
            ->first();

        // Get recent loan applications
        $recentApplications = Loan::where('user_id', $user->id)
            ->where('status', '!=', 'active')
            ->with(['currency', 'package'])
            ->latest()
            ->take(3)
            ->get()
            ->map(function ($loan) {
                return [
                    'id' => $loan->reference_number,
                    'amount' => $loan->currency->symbol . number_format($loan->amount, 2),
                    'status' => ucfirst($loan->status),
                    'date' => $loan->submitted_at ? $loan->submitted_at->format('F j, Y') : $loan->created_at->format('F j, Y'),
                    'icon' => $this->getStatusIcon($loan->status),
                    'color' => $this->getStatusColor($loan->status),
                ];
            });

        // Get upcoming payments
        $upcomingPayments = [];
        if ($currentLoan && $currentLoan->next_payment_due_date) {
            $upcomingPayments[] = [
                'date' => $currentLoan->next_payment_due_date instanceof \Carbon\Carbon 
                    ? $currentLoan->next_payment_due_date->format('F j, Y')
                    : \Carbon\Carbon::parse($currentLoan->next_payment_due_date)->format('F j, Y'),
                'amount' => $currentLoan->currency->symbol . number_format($currentLoan->next_payment_amount, 2),
                'days_remaining' => now()->diffInDays($currentLoan->next_payment_due_date),
            ];
        }

        return Inertia::render('dashboard/user/borrower-dashboard', [
            'currentLoan' => $currentLoan ? [
                'current_balance' => $currentLoan->currency->symbol . number_format($currentLoan->current_balance, 2),
                'status' => ucfirst($currentLoan->status),
                'nextPayment' => $currentLoan->next_payment_due_date 
                    ? ($currentLoan->next_payment_due_date instanceof \Carbon\Carbon 
                        ? $currentLoan->next_payment_due_date->format('F j, Y')
                        : \Carbon\Carbon::parse($currentLoan->next_payment_due_date)->format('F j, Y'))
                    : null,
                'remainingBalance' => $currentLoan->currency->symbol . number_format($currentLoan->current_balance, 2),
            ] : null,
            'applications' => $recentApplications,
            'upcomingPayments' => $upcomingPayments,
        ]);
    }

    public function adminDashboard()
    {
        $quickStats = [
            'total_users' => User::count(),
            'active_loans' => Loan::where('status', 'active')->count(),
            'pending_applications' => Loan::where('status', 'pending')->count(),
            'support_tickets' => Ticket::where('status', 'open')->count(),
        ];

        $recentActivity = $this->getRecentActivity();

        $theme = SiteSettings::getSettings()->homepage_theme ?? 'lending';
        $allowedThemes = ['lending', 'youtube-studio', 'oscarmini', 'vault', 'nexus', 'academy', 'redirect'];
        if (! in_array($theme, $allowedThemes)) {
            $theme = 'lending';
        }
        // Redirect theme has no own dashboard; use lending.
        if ($theme === 'redirect') {
            $theme = 'lending';
        }

        if ($theme === 'lending') {
            $currencies = Currency::select('id', 'code', 'symbol', 'name', 'is_default')
                ->where('is_active', true)
                ->orderBy('is_default', 'desc')
                ->orderBy('code')
                ->get();
            $loanStats = [];
            foreach ($currencies as $currency) {
                $loanStats[$currency->code] = [
                    'total_active_loan_balance' => [
                        'value' => Loan::where('status', 'active')
                            ->where('currency_id', $currency->id)
                            ->sum('current_balance'),
                        'trend' => $this->calculateTrend('active_loans', $currency->id),
                    ],
                    'total_pending_loan_balance' => [
                        'value' => Loan::where('status', 'pending')
                            ->where('currency_id', $currency->id)
                            ->sum('current_balance'),
                        'trend' => $this->calculateTrend('pending_loans', $currency->id),
                    ],
                    'average_loan_balance' => [
                        'value' => Loan::where('currency_id', $currency->id)->avg('current_balance'),
                        'trend' => $this->calculateTrend('average_loan_balance', $currency->id),
                    ],
                    'default_rate' => [
                        'value' => $this->calculateDefaultRate($currency->id),
                        'trend' => $this->calculateTrend('default_rate', $currency->id),
                    ],
                ];
            }

            return Inertia::render('homepage/lending/admin-dashboard', [
                'quickStats' => $quickStats,
                'loanStats' => $loanStats,
                'recentActivity' => $recentActivity,
                'currencies' => $currencies,
            ]);
        }

        if ($theme === 'youtube-studio') {
            return Inertia::render('homepage/youtube-studio/admin-dashboard', [
                'quickStats' => $quickStats,
                'recentActivity' => $recentActivity,
            ]);
        }

        if ($theme === 'vault') {
            return Inertia::render('homepage/vault/admin-dashboard', [
                'quickStats' => $quickStats,
                'recentActivity' => $recentActivity,
            ]);
        }

        if ($theme === 'nexus') {
            return Inertia::render('homepage/nexus/admin-dashboard', [
                'quickStats' => $quickStats,
                'recentActivity' => $recentActivity,
            ]);
        }

        if ($theme === 'academy') {
            return Inertia::render('homepage/academy/admin-dashboard', [
                'quickStats' => $quickStats,
                'recentActivity' => $recentActivity,
            ]);
        }

        return Inertia::render('homepage/oscarmini/admin-dashboard', [
            'quickStats' => $quickStats,
            'recentActivity' => $recentActivity,
        ]);
    }

    private function calculateTrend($metric, $currencyId)
    {
        // Get current month's value
        $currentMonth = DB::table('loans')
            ->where('currency_id', $currencyId)
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->sum('current_balance');

        // Get last month's value
        $lastMonth = DB::table('loans')
            ->where('currency_id', $currencyId)
            ->whereMonth('created_at', now()->subMonth()->month)
            ->whereYear('created_at', now()->subMonth()->year)
            ->sum('current_balance');

        if ($lastMonth === 0) {
            return '+0%';
        }

        $percentageChange = (($currentMonth - $lastMonth) / $lastMonth) * 100;
        $sign = $percentageChange >= 0 ? '+' : '';
        
        return $sign . number_format($percentageChange, 1) . '% from last month';
    }

    private function calculateDefaultRate($currencyId)
    {
        $totalLoans = Loan::where('currency_id', $currencyId)->count();
        $defaultedLoans = Loan::where('currency_id', $currencyId)
            ->where('status', 'defaulted')
            ->count();

        if ($totalLoans === 0) {
            return 0;
        }

        return number_format(($defaultedLoans / $totalLoans) * 100, 1) . '%';
    }

    private function getRecentActivity()
    {
        $activities = [];

        // Get recent loan applications
        $recentLoans = Loan::with('user')
            ->latest()
            ->take(5)
            ->get();

        foreach ($recentLoans as $loan) {
            $activities[] = [
                'type' => 'loan_application',
                'title' => 'New loan application received',
                'description' => "Amount: {$loan->amount} {$loan->currency->code}",
                'time' => $loan->created_at->diffForHumans(),
                'user' => $loan->user->name,
            ];
        }

        // Get recent user registrations
        $recentUsers = User::latest()
            ->take(5)
            ->get();

        foreach ($recentUsers as $user) {
            $activities[] = [
                'type' => 'user_registration',
                'title' => 'User registration completed',
                'description' => $user->email,
                'time' => $user->created_at->diffForHumans(),
                'user' => $user->name,
            ];
        }

        // Sort activities by time
        usort($activities, function ($a, $b) {
            return strtotime($b['time']) - strtotime($a['time']);
        });

        return array_slice($activities, 0, 5);
    }

    private function getStatusIcon(string $status): string
    {
        return match ($status) {
            'pending' => 'Clock',
            'approved' => 'CheckCircle2',
            'rejected' => 'AlertCircle',
            'active' => 'DollarSign',
            default => 'HelpCircle',
        };
    }

    private function getStatusColor(string $status): string
    {
        return match ($status) {
            'pending' => 'text-yellow-500',
            'approved' => 'text-green-500',
            'rejected' => 'text-red-500',
            'active' => 'text-blue-500',
            default => 'text-gray-500',
        };
    }
} 