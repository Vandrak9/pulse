<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Stripe\StripeClient;

class StripeConnectController extends Controller
{
    private function stripe(): StripeClient
    {
        return new StripeClient(config('cashier.secret'));
    }

    /**
     * Redirect coach to Stripe Connect OAuth onboarding.
     */
    public function onboard(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'coach') {
            abort(403);
        }

        $clientId = config('services.stripe.connect_client_id');

        if (empty($clientId)) {
            return redirect()->route('dashboard.profile.edit')
                ->with('error', 'Stripe Connect nie je nakonfigurovaný. Nastav STRIPE_CONNECT_CLIENT_ID v .env');
        }

        // CSRF-like state token stored in session
        $state = Str::random(40);
        session(['stripe_connect_state' => $state]);

        $params = http_build_query([
            'response_type' => 'code',
            'client_id'     => $clientId,
            'scope'         => 'read_write',
            'state'         => $state,
            'redirect_uri'  => route('stripe.connect.callback'),
        ]);

        return redirect('https://connect.stripe.com/oauth/authorize?' . $params);
    }

    /**
     * Handle OAuth callback from Stripe Connect.
     * Exchanges the temporary code for a permanent stripe_account_id.
     */
    public function callback(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'coach') {
            abort(403);
        }

        // Validate state to prevent CSRF
        if ($request->input('state') !== session('stripe_connect_state')) {
            return redirect()->route('dashboard.profile.edit')
                ->with('error', 'Neplatný stav požiadavky. Skús to znova.');
        }

        session()->forget('stripe_connect_state');

        if ($request->has('error')) {
            return redirect()->route('dashboard.profile.edit')
                ->with('error', 'Stripe Connect bol zrušený: ' . $request->input('error_description', 'Neznáma chyba.'));
        }

        $code = $request->input('code');

        if (empty($code)) {
            return redirect()->route('dashboard.profile.edit')
                ->with('error', 'Chýba autorizačný kód od Stripe.');
        }

        try {
            $response = $this->stripe()->oauth->token([
                'grant_type' => 'authorization_code',
                'code'       => $code,
            ]);

            $stripeAccountId = $response->stripe_user_id;

            $coach = $user->coach;

            if (!$coach) {
                return redirect()->route('dashboard.profile.edit')
                    ->with('error', 'Profil kouča neexistuje. Najprv si vytvor profil.');
            }

            $coach->update(['stripe_account_id' => $stripeAccountId]);

            Log::info('Stripe Connect: coach linked account.', [
                'coach_id'         => $coach->id,
                'stripe_account_id' => $stripeAccountId,
            ]);

            return redirect()->route('dashboard.profile.edit')
                ->with('success', 'Stripe účet bol úspešne prepojený. Teraz môžeš prijímať platby.');

        } catch (\Exception $e) {
            Log::error('Stripe Connect callback error.', ['error' => $e->getMessage()]);
            return redirect()->route('dashboard.profile.edit')
                ->with('error', 'Prepojenie so Stripe zlyhalo: ' . $e->getMessage());
        }
    }

    /**
     * Redirect coach to their Stripe Express dashboard.
     */
    public function expressDashboard(Request $request)
    {
        $user  = $request->user();
        $coach = $user->coach;

        if (!$coach || empty($coach->stripe_account_id)) {
            return redirect()->route('dashboard.profile.edit')
                ->with('error', 'Stripe účet nie je prepojený.');
        }

        try {
            $loginLink = $this->stripe()->accounts->createLoginLink(
                $coach->stripe_account_id
            );

            return redirect($loginLink->url);
        } catch (\Exception $e) {
            Log::error('Stripe Express dashboard error.', ['error' => $e->getMessage()]);
            return redirect()->route('dashboard.profile.edit')
                ->with('error', 'Nepodarilo sa otvoriť Stripe dashboard: ' . $e->getMessage());
        }
    }
}
