<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;


use OpenAI\Laravel\Facades\OpenAI;
use OpenAI\Responses\Completions\CreateResponse;

use App\Traits\LevelBasedAuthorization;
use App\Helpers\AccessLevel;

// Cron job route for checking completed loans
Route::get('/cron/check-completed-loans', [App\Http\Controllers\CronController::class, 'checkCompletedLoans'])
    ->name('cron.check-completed-loans');

Route::get('ai', function() {


    $response = OpenAI::chat()->create([
        'model' => 'gpt-4o',
        'messages' => [
            [
                'role' => 'user',
                'content' => 'Who is Oscarmini ',
            ],
        ],
    ]);


    return $response->choices[0]->message->content;


    
})->name('ai');

Route::middleware(['auth', 'verified'])->group(function () {

    // ======================================================================
    // ========================== ADMIN ROUTES ==============================
    // ======================================================================
    // This section contains all routes related to administrative functions
    // including user management, role permissions, and system configuration.
    // These routes are protected by authentication and admin middleware.
    // ======================================================================

    // Admin routes group
    Route::prefix('admin')->middleware(['except.user'])->group(function () {


    });

});
