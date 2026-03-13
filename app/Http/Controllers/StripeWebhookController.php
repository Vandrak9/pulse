<?php

namespace App\Http\Controllers;

use App\Models\Coach;
use App\Services\EmailNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Webhook;

class StripeWebhookController extends Controller
{
    /**
     * Handle incoming Stripe webhook events.
     *
     * Stripe calls this endpoint directly — no user session, no CSRF token.
     * We verify the signature using STRIPE_WEBHOOK_SECRET to ensure the
     * request genuinely comes from Stripe.
     */
    public function handle(Request $request)
    {
        $secret = config('cashier.webhook.secret');

        if (empty($secret)) {
            Log::error('Stripe webhook: STRIPE_WEBHOOK_SECRET not configured.');
            return response()->json(['error' => 'Webhook secret not configured.'], 500);
        }

        // Verify Stripe signature
        try {
            $event = Webhook::constructEvent(
                $request->getContent(),
                $request->header('Stripe-Signature'),
                $secret
            );
        } catch (SignatureVerificationException $e) {
            Log::warning('Stripe webhook: invalid signature.', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Invalid signature.'], 400);
        } catch (\Exception $e) {
            Log::error('Stripe webhook: failed to parse event.', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Bad request.'], 400);
        }

        // Dispatch to the correct handler
        match ($event->type) {
            'checkout.session.completed'       => $this->handleCheckoutCompleted($event->data->object),
            'customer.subscription.updated'    => $this->handleSubscriptionUpdated($event->data->object),
            'customer.subscription.deleted'    => $this->handleSubscriptionDeleted($event->data->object),
            'invoice.payment_failed'           => $this->handlePaymentFailed($event->data->object),
            default                            => null, // ignore other events
        };

        return response()->json(['status' => 'ok']);
    }

    /**
     * checkout.session.completed
     *
     * Fires when a Stripe Checkout session is paid. This is the reliable
     * alternative to the success redirect — it runs even if the user closes
     * the browser tab before being redirected.
     */
    private function handleCheckoutCompleted(object $session): void
    {
        if (($session->mode ?? '') !== 'subscription') {
            return;
        }

        if (($session->payment_status ?? '') !== 'paid') {
            return;
        }

        $userId   = $session->metadata->user_id ?? null;
        $coachId  = $session->metadata->coach_id ?? null;
        $stripeSub = $session->subscription ?? null;

        if (!$userId || !$coachId || !$stripeSub) {
            Log::warning('Stripe webhook: checkout.session.completed missing metadata.', [
                'session_id' => $session->id,
            ]);
            return;
        }

        $coach = Coach::with('user')->find($coachId);
        $user  = \App\Models\User::find($userId);

        if (!$coach || !$user) {
            Log::warning('Stripe webhook: coach or user not found.', [
                'coach_id' => $coachId,
                'user_id'  => $userId,
            ]);
            return;
        }

        // Check if this subscription row already exists (success handler ran first)
        $exists = DB::table('subscriptions')
            ->where('user_id', $userId)
            ->where('coach_id', $coachId)
            ->where('stripe_id', $stripeSub)
            ->exists();

        if ($exists) {
            // Already activated by the redirect success handler — nothing to do
            return;
        }

        // Upsert subscription row
        $wasNew = !DB::table('subscriptions')
            ->where('user_id', $userId)
            ->where('coach_id', $coachId)
            ->whereIn('stripe_status', ['active', 'trialing'])
            ->exists();

        DB::table('subscriptions')->updateOrInsert(
            ['user_id' => $userId, 'coach_id' => $coachId],
            [
                'type'          => 'coach_' . $coachId,
                'stripe_id'     => $stripeSub,
                'stripe_status' => 'active',
                'stripe_price'  => $session->metadata->price_id ?? null,
                'quantity'      => 1,
                'created_at'    => now(),
                'updated_at'    => now(),
            ]
        );

        if ($wasNew) {
            $coach->increment('subscriber_count');
        }

        // Notify coach via email + DB notification
        try {
            app(EmailNotificationService::class)->send(
                $coach->user,
                'new_subscriber',
                ['name' => $user->name]
            );
        } catch (\Exception $e) {
            Log::warning('Stripe webhook: email notification failed.', ['error' => $e->getMessage()]);
        }

        DB::table('notifications')->insert([
            'id'              => \Illuminate\Support\Str::uuid(),
            'type'            => 'App\\Notifications\\NewSubscriber',
            'notifiable_type' => 'App\\Models\\User',
            'notifiable_id'   => $coach->user_id,
            'data'            => json_encode([
                'fan_name'   => $user->name,
                'coach_name' => $coach->user->name,
                'amount'     => $coach->monthly_price,
            ]),
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);

        Log::info('Stripe webhook: subscription activated via checkout.session.completed.', [
            'user_id'  => $userId,
            'coach_id' => $coachId,
        ]);
    }

    /**
     * customer.subscription.updated
     *
     * Fires when subscription status changes (e.g. past_due, active, trialing).
     * Keeps our DB in sync with Stripe's source of truth.
     */
    private function handleSubscriptionUpdated(object $subscription): void
    {
        $updated = DB::table('subscriptions')
            ->where('stripe_id', $subscription->id)
            ->update([
                'stripe_status' => $subscription->status,
                'updated_at'    => now(),
            ]);

        if (!$updated) {
            Log::warning('Stripe webhook: subscription.updated — no matching row.', [
                'stripe_id' => $subscription->id,
            ]);
        }
    }

    /**
     * customer.subscription.deleted
     *
     * Fires when a subscription is fully canceled/expired in Stripe.
     * Revokes access and decrements subscriber count.
     */
    private function handleSubscriptionDeleted(object $subscription): void
    {
        $row = DB::table('subscriptions')
            ->where('stripe_id', $subscription->id)
            ->first();

        if (!$row) {
            Log::warning('Stripe webhook: subscription.deleted — no matching row.', [
                'stripe_id' => $subscription->id,
            ]);
            return;
        }

        DB::table('subscriptions')
            ->where('stripe_id', $subscription->id)
            ->update(['stripe_status' => 'canceled', 'updated_at' => now()]);

        $coach = Coach::find($row->coach_id);
        if ($coach && $coach->subscriber_count > 0) {
            $coach->decrement('subscriber_count');
        }

        Log::info('Stripe webhook: subscription canceled.', [
            'stripe_id' => $subscription->id,
            'coach_id'  => $row->coach_id,
            'user_id'   => $row->user_id,
        ]);
    }

    /**
     * invoice.payment_failed
     *
     * Fires when a recurring invoice payment fails (e.g. expired card).
     * Stripe retries automatically — we log it and can notify the user.
     */
    private function handlePaymentFailed(object $invoice): void
    {
        $stripeSubId = $invoice->subscription ?? null;

        if (!$stripeSubId) {
            return;
        }

        $row = DB::table('subscriptions')
            ->where('stripe_id', $stripeSubId)
            ->first();

        if (!$row) {
            return;
        }

        // Sync status (Stripe sets it to past_due on failed payment)
        DB::table('subscriptions')
            ->where('stripe_id', $stripeSubId)
            ->update(['stripe_status' => 'past_due', 'updated_at' => now()]);

        Log::warning('Stripe webhook: invoice.payment_failed.', [
            'stripe_subscription_id' => $stripeSubId,
            'user_id'                => $row->user_id,
            'coach_id'               => $row->coach_id,
        ]);
    }
}
