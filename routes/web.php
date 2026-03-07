<?php

use App\Http\Controllers\CoachController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, 'index'])->name('home');

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::get('/coaches', [CoachController::class, 'index'])->name('coaches.index');
Route::get('/coaches/{coach}', [CoachController::class, 'show'])->name('coaches.show');

Route::middleware('auth')->group(function () {
    Route::get('/dashboard/profile', [CoachController::class, 'edit'])->name('dashboard.profile.edit');
    Route::put('/dashboard/profile', [CoachController::class, 'update'])->name('dashboard.profile.update');
});

require __DIR__.'/auth.php';
