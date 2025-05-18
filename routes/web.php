<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

use App\Http\Controllers\ProductController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\KycVerificationController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\OuterPagesController;
use App\Http\Controllers\Admin\SiteSettingsController;
use App\Http\Controllers\Admin\ApiSettingsController;
use App\Http\Controllers\Admin\LoanSettingsController;
use App\Http\Controllers\LoanController;
// use Modules\Loan\Http\Controllers\LoanController;
use App\Http\Controllers\LoanPackageController;
use App\Http\Controllers\EmailTemplateController;
use App\Http\Controllers\CurrencyController;
use App\Http\Controllers\LoanDashboardController;
use App\Http\Controllers\ActivityController;
use App\Http\Controllers\LoanPaymentController;


use App\Traits\LevelBasedAuthorization;
use App\Helpers\AccessLevel;

// Homepage
Route::get('/', [OuterPagesController::class, 'index'])->name('home');
Route::get('/faq', [OuterPagesController::class, 'faq'])->name('faq');
Route::get('/contact', [OuterPagesController::class, 'contact'])->name('contact');
Route::get('/calculator', [OuterPagesController::class, 'calculator'])->name('calculator');
Route::get('/privacy', [OuterPagesController::class, 'privacy'])->name('privacy');
Route::get('/about', [OuterPagesController::class, 'about'])->name('about');

// Cron job route for checking completed loans
Route::get('/cron/check-completed-loans', [App\Http\Controllers\CronController::class, 'checkCompletedLoans'])
    ->name('cron.check-completed-loans');

Route::middleware(['auth', 'verified'])->group(function () {

    // Dashboard routes
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('dashboard/lender', [DashboardController::class, 'lenderDashboard'])->name('lender-dashboard');
    Route::get('dashboard/borrower', [LoanDashboardController::class, 'index'])->name('borrower-dashboard');
    Route::get('dashboard/youtuber', [DashboardController::class, 'youtuberDashboard'])->name('youtuber-dashboard');

    // Route::get('/dashboard/admin', [DashboardController::class, 'adminDashboard'])->name('dashboard.admin');

    // KYC routes
    Route::get('kyc', [KycVerificationController::class, 'show'])->name('kyc.show');
    Route::get('kyc/submit', [KycVerificationController::class, 'create'])->name('kyc.create');
    Route::post('kyc', [KycVerificationController::class, 'store'])->name('kyc.store');

    // Products routes
    Route::resource('products', ProductController::class);
    Route::post('/products/all', [ProductController::class, 'getAllProducts'])->name('products.all');
    Route::post('/products/export', [ProductController::class, 'export'])->name('products.export');

    // Transaction routes
    Route::get('/transactions', [TransactionController::class, 'index'])->name('transactions.index');
    Route::get('/transactions/create', [TransactionController::class, 'create'])->name('transactions.create');
    Route::post('/transactions', [TransactionController::class, 'store'])->name('transactions.store');
    Route::get('/transactions/{transaction}', [TransactionController::class, 'show'])->name('transactions.show');
    Route::get('/transactions/{transaction}/edit', [TransactionController::class, 'edit'])->name('transactions.edit');
    Route::put('/transactions/{transaction}', [TransactionController::class, 'update'])->name('transactions.update');
    Route::delete('/transactions/{transaction}', [TransactionController::class, 'destroy'])->name('transactions.destroy');
    Route::post('/transactions/bulk-delete', [TransactionController::class, 'bulkDelete'])->name('transactions.bulk-delete');
    Route::post('/transactions/bulk-archive', [TransactionController::class, 'bulkArchive'])->name('transactions.bulk-archive');
    Route::get('/transactions/export', [TransactionController::class, 'export'])->name('transactions.export');
    Route::get('/transactions/all', [TransactionController::class, 'getAllTransactions'])->name('transactions.all');

    // Ticket routes
    Route::get('/tickets', [TicketController::class, 'userTickets'])->name('tickets.user');
    Route::get('/tickets/create', [TicketController::class, 'create'])->name('tickets.create');
    Route::post('/tickets', [TicketController::class, 'store'])->name('tickets.store');
    Route::get('/tickets/{ticket}', [TicketController::class, 'userShow'])->name('tickets.user.show');
    Route::get('/tickets/{ticket}/edit', [TicketController::class, 'edit'])->name('tickets.edit');
    Route::put('/tickets/{ticket}', [TicketController::class, 'update'])->name('tickets.update');
    Route::delete('/tickets/{ticket}', [TicketController::class, 'destroy'])->name('tickets.destroy');
    Route::post('/tickets/{ticket}/reply', [TicketController::class, 'reply'])->name('tickets.reply');
    Route::post('/tickets/bulk-delete', [TicketController::class, 'bulkDelete'])->name('tickets.bulk-delete');
    Route::get('/tickets/export', [TicketController::class, 'export'])->name('tickets.export');

    // Loan routes
    Route::put('/loans/{loan}/status', [LoanController::class, 'updateStatus'])->name('loans.update-status');
    
    Route::get('loans.all', [LoanController::class, 'getAllLoans'])->name('loans.all');
    Route::post('loans.export', [LoanController::class, 'export'])->name('loans.export');
    Route::post('loans.bulk-delete', [LoanController::class, 'bulkDelete'])->name('loans.bulk-delete');
    Route::post('loans.bulk-archive', [LoanController::class, 'bulkArchive'])->name('loans.bulk-archive');

    // User Loans route
    Route::get('/loans', [LoanController::class, 'userIndex'])->name('user-loans');
    Route::post('/loans', [LoanController::class, 'store'])->name('user-loans.store');
    Route::get('/loans/{loan}', [LoanController::class, 'userShow'])->name('user-loans.show');
    Route::get('/loans/{loan}/documents', [LoanController::class, 'userDocuments'])->name('user-loans.documents');
    Route::get('/loans/{loan}/notes', [LoanController::class, 'userNotes'])->name('user-loans.notes');
    Route::post('/loans/{loan}/documents', [LoanController::class, 'userUploadDocument'])->name('user-loans.documents.upload');
    Route::get('/loans/{loan}/documents/{document}', [LoanController::class, 'userDownloadDocument'])->name('user-loans.documents.download');
    Route::post('/loans/{loan}/payments', [LoanController::class, 'userSubmitPayment'])->name('user-loans.payments.submit');
    Route::get('/loans/{loan}/payments/{payment}/proof', [LoanController::class, 'userDownloadPaymentProof'])->name('user-loans.payments.download-proof');
    Route::delete('/loans/{loan}', [LoanController::class, 'userCancel'])->name('user-loans.cancel');

    // Loan Documents
    Route::get('loans/{loan}/documents', [LoanController::class, 'documents'])->name('loans.documents');
    Route::post('loans/{loan}/documents', [LoanController::class, 'uploadDocument'])->name('loans.documents.upload');
    Route::delete('loans/{loan}/documents/{document}', [LoanController::class, 'deleteDocument'])->name('loans.documents.delete');

    // Loan Payments
    Route::post('/loans/{loan}/payments', [LoanPaymentController::class, 'store'])->name('loans.payments.store');
    Route::post('/loans/payments/{payment}/approve', [LoanPaymentController::class, 'approve'])->name('loans.payments.approve');
    Route::post('/loans/payments/{payment}/reject', [LoanPaymentController::class, 'reject'])->name('loans.payments.reject');
    Route::post('/loans/payments/{payment}/callback', [LoanPaymentController::class, 'handleCallback'])->name('loans.payments.callback');
    Route::get('loans/{loan}/payments/{payment}/proof', [LoanController::class, 'downloadPaymentProof'])->name('loans.payments.proof');

    // Loan Notes
    Route::get('loans/{loan}/notes', [LoanController::class, 'notes'])->name('loans.notes');
    Route::post('loans/{loan}/notes', [LoanController::class, 'addNote'])->name('loans.notes.add');
    Route::put('loans/{loan}/notes/{note}', [LoanController::class, 'updateNote'])->name('loans.notes.update');
    Route::delete('loans/{loan}/notes/{note}', [LoanController::class, 'deleteNote'])->name('loans.notes.delete');

    // Loan Package routes
    Route::get('loan-packages', [LoanPackageController::class, 'browse'])->name('loan-packages.browse');
    Route::put('loan-packages/{loanPackage}/status', [LoanPackageController::class, 'updateStatus'])->name('loan-packages.update-status');
    Route::get('loan-packages.all', [LoanPackageController::class, 'getAllLoans'])->name('loan-packages.all');
    Route::post('loan-packages.export', [LoanPackageController::class, 'export'])->name('loan-packages.export');
    Route::post('loan-packages.bulk-delete', [LoanPackageController::class, 'bulkDelete'])->name('loan-packages.bulk-delete');
    Route::post('loan-packages.bulk-archive', [LoanPackageController::class, 'bulkArchive'])->name('loan-packages.bulk-archive');

    // Activity routes
    Route::get('/activity', [ActivityController::class, 'user'])->name('activity.user');
    Route::get('/activity/load-more', [ActivityController::class, 'getUserLoadMore'])->name('activity.user.get-load-more');
    Route::post('/activity/load-more', [ActivityController::class, 'userLoadMore'])->name('activity.user.load-more');

    // ======================================================================
    // ========================== ADMIN ROUTES ==============================
    // ======================================================================
    // This section contains all routes related to administrative functions
    // including user management, role permissions, and system configuration.
    // These routes are protected by authentication and admin middleware.
    // ======================================================================

    // Admin routes group
    Route::prefix('admin')->middleware(['except.user'])->group(function () {

        Route::get('dashboard', [LoanDashboardController::class, 'adminDashboard'])->name('admin.dashboard');

        // Site Settings routes
        Route::get('settings', [SiteSettingsController::class, 'index'])->name('admin.settings.system');
        Route::put('settings', [SiteSettingsController::class, 'update'])->name('admin.settings.update');

        // KYC routes
        Route::get('kyc', [KycVerificationController::class, 'index'])->name('kyc.index');
        Route::get('kyc/{kycVerification}/edit', [KycVerificationController::class, 'edit'])->name('kyc.edit');
        Route::put('kyc/{kycVerification}', [KycVerificationController::class, 'update'])->name('kyc.update');
        Route::get('kyc/{kycVerification}', [KycVerificationController::class, 'show'])->name('admin.kyc.show');

        // Role and Permission Management
        Route::get('roles', [RoleController::class, 'index'])->middleware(['role:super-admin'])->name('roles.index');
        Route::post('roles', [RoleController::class, 'store'])->middleware(['role:super-admin'])->name('roles.store');
        Route::put('roles/{role}', [RoleController::class, 'update'])->middleware(['role:super-admin'])->name('roles.update');
        Route::delete('roles/{role}', [RoleController::class, 'destroy'])->middleware(['role:super-admin'])->name('roles.destroy');

        // User Management
        Route::get('users', [UserController::class, 'index'])->name('admin.users.index');
        Route::get('users/create', [UserController::class, 'create'])->name('admin.users.create');
        Route::post('users', [UserController::class, 'store'])->name('admin.users.store');
        Route::get('users/{user}', [UserController::class, 'show'])->name('admin.users.show');
        Route::get('users/{user}/edit', [UserController::class, 'edit'])->name('admin.users.edit');
        Route::put('users/{user}', [UserController::class, 'update'])->name('admin.users.update');
        Route::delete('users/{user}', [UserController::class, 'destroy'])->name('admin.users.destroy');
        Route::post('users/export', [UserController::class, 'export'])->name('admin.users.export');

        // Loan Packages routes
        Route::resource('loan-packages', LoanPackageController::class)->names('admin.loan-packages');

        // Loan routes
        Route::resource('loans', LoanController::class);
        Route::put('loans/{loan}/status', [LoanController::class, 'updateStatus'])->name('loans.update-status');

        // Ticket routes;
        Route::get('tickets', [TicketController::class, 'index'])->name('admin.tickets.index');
        Route::get('tickets/{ticket}', [TicketController::class, 'show'])->name('admin.tickets.show');

        // API Settings routes
        Route::get('/settings/api', [ApiSettingsController::class, 'index'])->name('admin.settings.api');
        Route::post('/settings/api', [ApiSettingsController::class, 'update'])->name('admin.settings.api.update');

        // Loan Settings routes
        Route::get('/settings/loan', [LoanSettingsController::class, 'index'])->name('admin.settings.loan');
        Route::post('/settings/loan', [LoanSettingsController::class, 'update'])->name('admin.settings.loan.update');

        // Email Templates routes
        Route::resource('email-templates', EmailTemplateController::class);
        Route::put('email-templates/{emailTemplate}/toggle-status', [EmailTemplateController::class, 'toggleStatus'])->name('email-templates.toggle-status');

        // Currency Management
        Route::resource('currencies', CurrencyController::class);
        Route::post('/currencies/{currency}/set-default', [CurrencyController::class, 'setDefault'])->name('currencies.set-default');
        Route::post('/currencies/{currency}/toggle-active', [CurrencyController::class, 'toggleActive'])->name('currencies.toggle-active');

        // Activity routes
        Route::get('/activity', [ActivityController::class, 'index'])->name('admin.activities');
        Route::get('/activity/load-more', [ActivityController::class, 'getLoadMore'])->name('admin.activities.get-load-more');
        Route::post('/activity/load-more', [ActivityController::class, 'loadMore'])
            ->middleware(['web'])
            ->name('admin.activities.load-more');

    });



});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
