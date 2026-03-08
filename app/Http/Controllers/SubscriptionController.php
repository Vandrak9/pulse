<?php

namespace App\Http\Controllers;

use App\Models\Coach;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Stripe\StripeClient;
use Stripe\Exception\ApiErrorException;

class SubscriptionController extends Controller
{
    private function stripe(): StripeClient
    {
        return new StripeClient(config('cashier.secret'));
    }

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

        // Already subscribed (check DB directly — avoids Cashier cache issues)
        $alreadySubscribed = DB::table('subscriptions')
            ->where('user_id', $user->id)
            ->where('coach_id', $coach->id)
            ->whereIn('stripe_status', ['active', 'trialing'])
            ->exists();

        if ($alreadySubscribed) {
            return redirect()->route('coaches.show', $coach)
                ->with('info', 'Už si predplatiteľ tohto kouča.');
        }

        // No Stripe keys configured
        if (empty(config('cashier.secret'))) {
            return redirect()->route('coaches.show', $coach)
                ->with('error', 'Platby nie sú nakonfigurované. Nastav STRIPE_SECRET v .env');
        }

        // Guard: coach must have a non-zero price
        if (empty($coach->monthly_price) || $coach->monthly_price <= 0) {
            return redirect()->route('coaches.show', $coach)
                ->with('error', 'Kouč nemá nastavenú cenu predplatného.');
        }

        try {
            $stripe  = $this->stripe();
            $priceId = $this->ensureStripePriceExists($stripe, $coach);

            // Ensure fan has a Stripe customer ID
            if (empty($user->stripe_id)) {
                $customer = $stripe->customers->create([
                    'email'    => $user->email,
                    'name'     => $user->name,
                    'metadata' => ['user_id' => $user->id],
                ]);
                $user->forceFill(['stripe_id' => $customer->id])->save();
            }

            $session = $stripe->checkout->sessions->create([
                'payment_method_types' => ['card'],
                'mode'                 => 'subscription',
                'customer'             => $user->stripe_id,
                'line_items'           => [
                    ['price' => $priceId, 'quantity' => 1],
                ],
                'success_url'          => url('/subscription/success') . '?session_id={CHECKOUT_SESSION_ID}&coach_id=' . $coach->id,
                'cancel_url'           => route('coaches.show', $coach),
                'metadata'             => [
                    'user_id'  => $user->id,
                    'coach_id' => $coach->id,
                ],
                'subscription_data'    => [
                    'metadata' => [
                        'user_id'  => $user->id,
                        'coach_id' => $coach->id,
                    ],
                ],
            ]);

            return Inertia::location($session->url);
        } catch (ApiErrorException $e) {
            Log::error('Stripe checkout error', ['message' => $e->getMessage(), 'coach_id' => $coachId]);
            return redirect()->route('coaches.show', $coach)
                ->with('error', 'Chyba Stripe: ' . $e->getMessage());
        } catch (\Exception $e) {
            Log::error('Subscription checkout error', ['message' => $e->getMessage()]);
            return redirect()->route('coaches.show', $coach)
                ->with('error', 'Neočakávaná chyba pri spracovaní platby.');
        }
    }

    /**
     * Handle successful Stripe Checkout return.
     */
    public function success(Request $request)
    {
        $sessionId = $request->input('session_id');
        $coachId   = $request->integer('coach_id');
        $coach     = $coachId ? Coach::with('user')->find($coachId) : null;
        $user      = auth()->user();

        if ($sessionId && $coach && $user && !empty(config('cashier.secret'))) {
            try {
                $stripe          = $this->stripe();
                $checkoutSession = $stripe->checkout->sessions->retrieve($sessionId);

                if ($checkoutSession->payment_status === 'paid' && $checkoutSession->subscription) {
                    $stripeSubscriptionId = $checkoutSession->subscription;
                    $stripeSub            = $stripe->subscriptions->retrieve($stripeSubscriptionId);

                    // Upsert subscription row
                    DB::table('subscriptions')->updateOrInsert(
                        [
                            'user_id'  => $user->id,
                            'coach_id' => $coach->id,
                        ],
                        [
                            'type'         => 'coach_' . $coach->id,
                            'stripe_id'    => $stripeSubscriptionId,
                            'stripe_status' => $stripeSub->status,
                            'stripe_price' => $stripeSub->items->data[0]->price->id ?? null,
                            'quantity'     => 1,
                            'created_at'   => now(),
                            'updated_at'   => now(),
                        ]
                    );

                    // Increment subscriber_count once per subscription
                    $alreadyCounted = DB::table('subscriptions')
                        ->where('user_id', $user->id)
                        ->where('coach_id', $coach->id)
                        ->whereIn('stripe_status', ['active', 'trialing'])
                        ->exists();

                    if ($alreadyCounted) {
                        // Only increment if this is a fresh subscription
                        $rowAge = DB::table('subscriptions')
                            ->where('user_id', $user->id)
                            ->where('coach_id', $coach->id)
                            ->value('created_at');

                        if ($rowAge && now()->diffInMinutes($rowAge) < 5) {
                            $coach->increment('subscriber_count');
                        }
                    }

                    // Notify the coach (DB notification)
                    DB::table('notifications')->insert([
                        'id'              => \Illuminate\Support\Str::uuid(),
                        'type'            => 'App\\Notifications\\NewSubscriber',
                        'notifiable_type' => 'App\\Models\\User',
                        'notifiable_id'   => $coach->user_id,
                        'data'            => json_encode([
                            'fan_name'    => $user->name,
                            'coach_name'  => $coach->user->name,
                            'amount'      => $coach->monthly_price,
                        ]),
                        'created_at'      => now(),
                        'updated_at'      => now(),
                    ]);
                }
            } catch (\Exception $e) {
                Log::error('Subscription success handler error', ['message' => $e->getMessage()]);
                // Don't block the success page — Stripe webhook will handle it as fallback
            }
        }

        return Inertia::render('Subscription/Success', [
            'coach' => $coach ? [
                'id'             => $coach->id,
                'name'           => $coach->user->name,
                'specialization' => $coach->specialization,
                'monthly_price'  => $coach->monthly_price,
                'avatar_url'     => $coach->avatar_path
                    ? Storage::url($coach->avatar_path)
                    : null,
            ] : null,
        ]);
    }

    /**
     * Cancel a coach subscription (POST).
     */
    public function cancel(Request $request, int $coachId)
    {
        $user  = auth()->user();
        $coach = Coach::find($coachId);

        try {
            $sub = DB::table('subscriptions')
                ->where('user_id', $user->id)
                ->where('coach_id', $coachId)
                ->whereIn('stripe_status', ['active', 'trialing'])
                ->first();

            if ($sub && !empty(config('cashier.secret'))) {
                $stripe = $this->stripe();
                $stripe->subscriptions->cancel($sub->stripe_id);

                DB::table('subscriptions')
                    ->where('id', $sub->id)
                    ->update(['stripe_status' => 'canceled', 'updated_at' => now()]);

                if ($coach && $coach->subscriber_count > 0) {
                    $coach->decrement('subscriber_count');
                }
            }
        } catch (ApiErrorException $e) {
            Log::error('Stripe cancel error', ['message' => $e->getMessage()]);
            return back()->with('error', 'Zrušenie predplatného zlyhalo: ' . $e->getMessage());
        } catch (\Exception $e) {
            return back()->with('error', 'Zrušenie predplatného zlyhalo.');
        }

        return back()->with('success', 'Predplatné bolo zrušené. Prístup ostáva do konca plateného obdobia.');
    }

    /**
     * Ensure the coach has a Stripe Product + Price and return the price ID.
     */
    private function ensureStripePriceExists(StripeClient $stripe, Coach $coach): string
    {
        if ($coach->stripe_price_id) {
            return $coach->stripe_price_id;
        }

        $product = $stripe->products->create([
            'name'        => 'Predplatné — ' . $coach->user->name,
            'description' => $coach->specialization ?? 'Fitness kouč',
            'metadata'    => ['coach_id' => $coach->id],
        ]);

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
