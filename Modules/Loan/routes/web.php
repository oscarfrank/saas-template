<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Stancl\Tenancy\Middleware\InitializeTenancyByPath;
use Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains;

// Local Modular Dependencies
use Modules\Loan\Http\Controllers\LoanController;
use Modules\Loan\Http\Controllers\LoanSettingsController;
use Modules\Loan\Http\Controllers\LoanPackageController;
use Modules\Loan\Http\Controllers\LoanDashboardController;
use Modules\Loan\Http\Controllers\LoanPaymentController;

use App\Traits\LevelBasedAuthorization;
use App\Helpers\AccessLevel;

// Central Routes (Admin) - These should NOT be tenant-aware
Route::middleware([
    'auth',
    'verified',
    'track.last.visited',
    InitializeTenancyByPath::class,
    // PreventAccessFromCentralDomains::class,
])->prefix('{tenant}')->group(function () {


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
        Route::get('/loans/{loan}/payments', [LoanPaymentController::class, 'redirectToLoan'])->name('loans.payments.redirect');
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

        

    // Admin routes group
    Route::prefix('admin')->middleware(['except.user'])->group(function () {
        // Loan Packages routes
        Route::resource('loan-packages', LoanPackageController::class)->names('admin.loan-packages');
        Route::put('loan-packages/{loanPackage}/status', [LoanPackageController::class, 'updateStatus'])->name('loan-packages.update-status');
        Route::get('loan-packages.all', [LoanPackageController::class, 'getAllLoans'])->name('loan-packages.all');
        Route::post('loan-packages.export', [LoanPackageController::class, 'export'])->name('loan-packages.export');
        Route::post('loan-packages.bulk-delete', [LoanPackageController::class, 'bulkDelete'])->name('loan-packages.bulk-delete');
        Route::post('loan-packages.bulk-archive', [LoanPackageController::class, 'bulkArchive'])->name('loan-packages.bulk-archive');

        // Loan routes
        Route::resource('loans', LoanController::class);
        Route::put('loans/{loan}/status', [LoanController::class, 'updateStatus'])->name('loans.update-status');
        Route::get('loans.all', [LoanController::class, 'getAllLoans'])->name('loans.all');
        Route::post('loans.export', [LoanController::class, 'export'])->name('loans.export');
        Route::post('loans.bulk-delete', [LoanController::class, 'bulkDelete'])->name('loans.bulk-delete');
        Route::post('loans.bulk-archive', [LoanController::class, 'bulkArchive'])->name('loans.bulk-archive');

        // Loan Settings routes
        Route::get('/settings/loan', [LoanSettingsController::class, 'index'])->name('admin.settings.loan');
        Route::post('/settings/loan', [LoanSettingsController::class, 'update'])->name('admin.settings.loan.update');
    });
});