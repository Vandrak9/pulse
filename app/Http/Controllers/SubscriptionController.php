<?php

namespace App\Http\Controllers;

use App\Models\Coach;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SubscriptionController extends Controller
{
    /**
     * Redirect fan to Stripe Checkout for a coach subscription.
     */
    public function checkout(int $coachId)
    {
        $user  = auth()->user();
        $coach = Coach::with('user')->findOrFail($coachId);

        // Coach cannot subscribe to themselves
        if ($user->id === $coach->user_id) {
            return redirect()->route('coaches.show', $coach)
                ->with('error', 'Nemôžeš sa predplatiť sám sebe.');
        }

        // Already subscribed
        if ($user->subscribed('coach_' . $coachId)) {
            return redirect()->route('coaches.show', $coach)
                ->with('info', 'Už si predplatiteľ tohto kouča.');
        }

        // No Stripe keys configured — dev mode fallback
        if (empty(config('cashier.secret'))) {
            return redirect()->route('coaches.show', $coach)
                ->with('error', 'Platby nie sú nakonfigurované. Nastav STRIPE_SECRET v .env');
        }

        try {
            $priceId = $this->ensureStripePriceExists($coach);

            $session = $user->newSubscription('coach_' . $coachId, $priceId)
                ->checkout([
                    'success_url' => route('subscription.success') . '?session_id={CHECKOUT_SESSION_ID}&coach_id=' . $coachId,
                    'cancel_url'  => route('coaches.show', $coach),
                    'metadata'    => [
                        'coach_id' => $coachId,
                        'fan_id'   => $user->id,
                    ],
                ]);

            return redirect($session->url);
        } catch (\Exception $e) {
            return redirect()->route('coaches.show', $coach)
                ->with('error', 'Chyba pri spracovaní platby: ' . $e->getMessage());
        }
    }

    /**
     * Handle successful Stripe Checkout return.
     */
    public function success(Request $request)
    {
        $coachId = $request->integer('coach_id');
        $coach   = $coachId ? Coach::with('user')->find($coachId) : null;

        // Try to stamp coach_id onto the subscription row
        if ($coach && auth()->check()) {
            $user = auth()->user();
            DB::table('subscriptions')
                ->where('user_id', $user->id)
                ->where('type', 'coach_' . $coachId)
                ->whereNull('coach_id')
                ->update(['coach_id' => $coach->id]);

            // Increment subscriber_count
            $user->subscribed('coach_' . $coachId) &&
                $coach->increment('subscriber_count');
        }

        return Inertia::render('Subscription/Success', [
            'coach' => $coach ? [
                'id'             => $coach->id,
                'name'           => $coach->user->name,
                'specialization' => $coach->specialization,
                'monthly_price'  => $coach->monthly_price,
                'avatar_url'     => $coach->avatar_path
                    ? \Illuminate\Support\Facades\Storage::url($coach->avatar_path)
                    : null,
            ] : null,
        ]);
    }

    /**
     * Cancel a coach subscription (POST).
     */
    public function cancel(Request $request, int $coachId)
    {
        $user = auth()->user();

        try {
            $subscription = $user->subscription('coach_' . $coachId);
            if ($subscription) {
                $subscription->cancel();
                $coach = Coach::find($coachId);
                if ($coach && $coach->subscriber_count > 0) {
                    $coach->decrement('subscriber_count');
                }
            }
        } catch (\Exception $e) {
            return back()->with('error', 'Zrušenie predplatného zlyhalo.');
        }

        return back()->with('success', 'Predplatné bolo zrušené.');
    }

    /**
     * Ensure the coach has a Stripe Product + Price and return the price ID.
     */
    private function ensureStripePriceExists(Coach $coach): string
    {
        // Return cached price ID
        if ($coach->stripe_price_id) {
            return $coach->stripe_price_id;
        }

        $stripe = new \Stripe\StripeClient(config('cashier.secret'));

        // Create product
        $product = $stripe->products->create([
            'name'        => 'Predplatné — ' . $coach->user->name,
            'description' => $coach->specialization ?? 'Fitness kouč',
            'metadata'    => ['coach_id' => $coach->id],
        ]);

        // Price in EUR cents (monthly recurring)
        $price = $stripe->prices->create([
            'product'     => $product->id,
            'unit_amount' => (int) round($coach->monthly_price * 100),
            'currency'    => 'eur',
            'recurring'   => ['interval' => 'month'],
        ]);

        $coach->update([
            'stripe_product_id' => $product->id,
            'stripe_price_id'   => $price->id,
        ]);

        return $price->id;
    }
}
