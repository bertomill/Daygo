import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string

        console.log('checkout.session.completed:', { userId, customerId, subscriptionId })

        if (userId && subscriptionId) {
          // Calculate period end date (1 month from now)
          const oneMonthFromNow = new Date()
          oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1)
          const periodEnd = oneMonthFromNow.toISOString()

          // Update profile with all subscription info
          const { data, error } = await supabaseAdmin
            .from('profiles')
            .update({
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              subscription_tier: 'pro',
              subscription_status: 'active',
              subscription_current_period_end: periodEnd,
            })
            .eq('id', userId)
            .select()

          console.log('Supabase update result:', { data, error })
        } else {
          console.log('Missing userId or subscriptionId')
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const periodEnd = (subscription as { current_period_end?: number }).current_period_end

        // Find user by customer ID
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profile) {
          const status = subscription.status === 'active' ? 'active' :
            subscription.status === 'past_due' ? 'past_due' :
            subscription.status === 'canceled' ? 'canceled' : 'inactive'

          const tier = status === 'active' ? 'pro' : 'free'

          await supabaseAdmin
            .from('profiles')
            .update({
              subscription_status: status,
              subscription_tier: tier,
              subscription_current_period_end: periodEnd
                ? new Date(periodEnd * 1000).toISOString()
                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            })
            .eq('id', profile.id)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Find user by customer ID
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profile) {
          await supabaseAdmin
            .from('profiles')
            .update({
              subscription_tier: 'free',
              subscription_status: 'canceled',
            })
            .eq('id', profile.id)
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
