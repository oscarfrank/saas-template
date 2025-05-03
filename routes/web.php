<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

use App\Http\Controllers\ProductController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // Products routes
    Route::resource('products', ProductController::class);
    Route::post('/products/all', [ProductController::class, 'getAllProducts'])->name('products.all');
    Route::post('/products/export', [ProductController::class, 'export'])->name('products.export');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
