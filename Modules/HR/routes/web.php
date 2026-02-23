<?php

use Illuminate\Support\Facades\Route;
use Stancl\Tenancy\Middleware\InitializeTenancyByPath;
use Modules\HR\Http\Controllers\StaffController;
use Modules\HR\Http\Controllers\ProjectController;
use Modules\HR\Http\Controllers\TaskController;
use Modules\HR\Http\Controllers\PaymentRunController;
use Modules\HR\Http\Controllers\PayslipController;
use Modules\HR\Http\Controllers\EvaluationController;

Route::middleware([
    'auth',
    'verified',
    InitializeTenancyByPath::class,
    'ensure.tenant.access',
])->prefix('{tenant}')->group(function () {
    // Staff
    Route::get('hr', [StaffController::class, 'index'])->name('hr.staff.index');
    Route::get('hr/staff', [StaffController::class, 'index'])->name('hr.staff.index.alt');
    Route::get('hr/staff/create', [StaffController::class, 'create'])->name('hr.staff.create');
    Route::post('hr/staff', [StaffController::class, 'store'])->name('hr.staff.store');
    Route::get('hr/staff/{staff}', [StaffController::class, 'show'])->name('hr.staff.show');
    Route::get('hr/staff/{staff}/payslips', [StaffController::class, 'payslipsIndex'])->name('hr.staff.payslips.index');
    Route::get('hr/staff/{staff}/events', [StaffController::class, 'eventsIndex'])->name('hr.staff.events.index');
    Route::get('hr/staff/{staff}/documents', [StaffController::class, 'documentsIndex'])->name('hr.staff.documents.index');
    Route::get('hr/staff/{staff}/tasks', [StaffController::class, 'assignedTasksIndex'])->name('hr.staff.tasks.index');
    Route::get('hr/staff/{staff}/passport', [StaffController::class, 'passportPhoto'])->name('hr.staff.passport');
    Route::post('hr/staff/{staff}/passport', [StaffController::class, 'updatePassportPhoto'])->name('hr.staff.passport.upload');
    Route::get('hr/staff/{staff}/edit', [StaffController::class, 'edit'])->name('hr.staff.edit');
    Route::put('hr/staff/{staff}', [StaffController::class, 'update'])->name('hr.staff.update');
    Route::delete('hr/staff/{staff}', [StaffController::class, 'destroy'])->name('hr.staff.destroy');
    Route::post('hr/staff/{staff}/documents', [StaffController::class, 'uploadDocument'])->name('hr.staff.documents.upload');
    Route::delete('hr/staff/{staff}/documents/{document}', [StaffController::class, 'deleteDocument'])->name('hr.staff.documents.destroy');
    Route::get('hr/staff/{staff}/documents/{document}/download', [StaffController::class, 'downloadDocument'])->name('hr.staff.documents.download');
    Route::post('hr/staff/{staff}/events', [StaffController::class, 'storeEvent'])->name('hr.staff.events.store');
    Route::delete('hr/staff/{staff}/events/{event}', [StaffController::class, 'destroyEvent'])->name('hr.staff.events.destroy');

    // Projects
    Route::get('hr/projects', [ProjectController::class, 'index'])->name('hr.projects.index');
    Route::get('hr/projects/create', [ProjectController::class, 'create'])->name('hr.projects.create');
    Route::post('hr/projects', [ProjectController::class, 'store'])->name('hr.projects.store');
    Route::get('hr/projects/{project}', [ProjectController::class, 'show'])->name('hr.projects.show');
    Route::get('hr/projects/{project}/edit', [ProjectController::class, 'edit'])->name('hr.projects.edit');
    Route::put('hr/projects/{project}', [ProjectController::class, 'update'])->name('hr.projects.update');
    Route::delete('hr/projects/{project}', [ProjectController::class, 'destroy'])->name('hr.projects.destroy');

    // Tasks
    Route::get('hr/tasks', [TaskController::class, 'index'])->name('hr.tasks.index');
    Route::get('hr/tasks/create', [TaskController::class, 'create'])->name('hr.tasks.create');
    Route::post('hr/tasks', [TaskController::class, 'store'])->name('hr.tasks.store');
    Route::get('hr/tasks/{task}', [TaskController::class, 'show'])->name('hr.tasks.show');
    Route::get('hr/tasks/{task}/edit', [TaskController::class, 'edit'])->name('hr.tasks.edit');
    Route::put('hr/tasks/{task}', [TaskController::class, 'update'])->name('hr.tasks.update');
    Route::patch('hr/tasks/{task}/status', [TaskController::class, 'updateStatus'])->name('hr.tasks.update-status');
    Route::patch('hr/tasks/{task}/due', [TaskController::class, 'updateDue'])->name('hr.tasks.update-due');
    Route::delete('hr/tasks/{task}', [TaskController::class, 'destroy'])->name('hr.tasks.destroy');
    Route::post('hr/tasks/{task}/complete', [TaskController::class, 'complete'])->name('hr.tasks.complete');

    // Payment runs
    Route::get('hr/payments', [PaymentRunController::class, 'index'])->name('hr.payments.index');
    Route::get('hr/payments/create', [PaymentRunController::class, 'create'])->name('hr.payments.create');
    Route::post('hr/payments', [PaymentRunController::class, 'store'])->name('hr.payments.store');
    Route::get('hr/payments/{paymentRun}/slip/{item}', [PaymentRunController::class, 'slip'])->name('hr.payments.slip');
    Route::get('hr/payments/{paymentRun}', [PaymentRunController::class, 'show'])->name('hr.payments.show');
    Route::delete('hr/payments/{paymentRun}', [PaymentRunController::class, 'destroy'])->name('hr.payments.destroy');
    Route::post('hr/payments/{paymentRun}/process', [PaymentRunController::class, 'process'])->name('hr.payments.process');
    Route::post('hr/payments/{paymentRun}/items/{item}/pay', [PaymentRunController::class, 'processItem'])->name('hr.payments.items.pay');

    // Standalone payslips (attached to staff profile; generate, view, edit, delete)
    Route::post('hr/staff/{staff}/payslips', [PayslipController::class, 'store'])->name('hr.staff.payslips.store');
    Route::get('hr/payslips/{payslip}', [PayslipController::class, 'show'])->name('hr.payslips.show');
    Route::get('hr/payslips/{payslip}/edit', [PayslipController::class, 'edit'])->name('hr.payslips.edit');
    Route::put('hr/payslips/{payslip}', [PayslipController::class, 'update'])->name('hr.payslips.update');
    Route::delete('hr/payslips/{payslip}', [PayslipController::class, 'destroy'])->name('hr.payslips.destroy');

    // Evaluations
    Route::get('hr/evaluations', [EvaluationController::class, 'index'])->name('hr.evaluations.index');
    Route::get('hr/evaluations/create', [EvaluationController::class, 'create'])->name('hr.evaluations.create');
    Route::post('hr/evaluations', [EvaluationController::class, 'store'])->name('hr.evaluations.store');
    Route::get('hr/evaluations/{evaluation}', [EvaluationController::class, 'show'])->name('hr.evaluations.show');
    Route::get('hr/evaluations/{evaluation}/edit', [EvaluationController::class, 'edit'])->name('hr.evaluations.edit');
    Route::put('hr/evaluations/{evaluation}', [EvaluationController::class, 'update'])->name('hr.evaluations.update');
    Route::post('hr/evaluations/{evaluation}/submit', [EvaluationController::class, 'submit'])->name('hr.evaluations.submit');
});
