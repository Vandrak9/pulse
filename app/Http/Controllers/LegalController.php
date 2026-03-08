<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class LegalController extends Controller
{
    public function privacy(): Response
    {
        return Inertia::render('Legal/Privacy');
    }

    public function terms(): Response
    {
        return Inertia::render('Legal/Terms');
    }

    public function gdpr(): Response
    {
        return Inertia::render('Legal/Gdpr');
    }

    public function cookies(): Response
    {
        return Inertia::render('Legal/Cookies');
    }
}
