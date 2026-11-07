import Stripe from 'stripe';

/**
 * Vercel: POST /api/stripe-webhook
 * Env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
 * Stripe Dashboard â†’ Webhooks â†’ endpoint URL + checkout.session.completed
 *
 * Important: disable body parsing for raw signature verification in vercel.json
 * or use Stripe's recommended pattern for your runtime.
 */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return res.status(500).send('Webhook secret not configured');
  }

  let event;
  try {
    const buf = await buffer(req);
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    // TODO: write paid order to Firestore with Admin SDK, or call your backend
    // session.id, session.customer_email, session.amount_total, session.metadata
    console.log('Paid session', session.id, session.customer_email, session.amount_total);
  }

  res.status(200).json({ received: true });
}