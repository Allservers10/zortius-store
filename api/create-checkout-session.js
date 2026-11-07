import Stripe from 'stripe';

/**
 * Vercel serverless: POST /api/create-checkout-session
 * Env: STRIPE_SECRET_KEY (sk_test_... or sk_live_...)
 * Never expose the secret key to the browser.
 */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.CHECKOUT_ORIGIN || 'https://zortius.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe is not configured on the server' });
  }

  const {
    items,
    customerEmail,
    shippingAddress,
    shipping,
    successUrl,
    cancelUrl,
    userId,
  } = req.body || {};

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'No items provided' });
  }

  // Basic validation — amounts in major units (pounds)
  for (const item of items) {
    const price = Number(item.price);
    const qty = Number(item.qty) || 1;
    if (!item.name || !Number.isFinite(price) || price <= 0 || qty < 1 || qty > 99) {
      return res.status(400).json({ error: 'Invalid item in cart' });
    }
  }

  try {
    const line_items = items.map((item) => {
      const nameParts = [item.name];
      if (item.selectedColor) nameParts.push(String(item.selectedColor));
      if (item.selectedType?.label) nameParts.push(String(item.selectedType.label));
      if (item.typeKey) nameParts.push(String(item.typeKey));

      return {
        price_data: {
          currency: 'gbp',
          product_data: {
            name: nameParts.filter(Boolean).join(' · ').slice(0, 120),
            images:
              item.image && String(item.image).startsWith('https://')
                ? [String(item.image).slice(0, 500)]
                : [],
          },
          unit_amount: Math.round(Number(item.price) * 100),
        },
        quantity: Math.min(99, Math.max(1, Number(item.qty) || 1)),
      };
    });

    const origin = process.env.CHECKOUT_ORIGIN || 'https://zortius.com';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: customerEmail || undefined,
      line_items,
      success_url:
        successUrl ||
        `${origin}/account/orders?paid=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${origin}/cart`,
      shipping_address_collection: {
        // UK-only for now (matches your policy)
        allowed_countries: ['GB'],
      },
      phone_number_collection: { enabled: true },
      metadata: {
        userId: userId || '',
        shippingAddress: (shippingAddress || '').slice(0, 500),
        shippingJson: shipping ? JSON.stringify(shipping).slice(0, 500) : '',
      },
      locale: 'en-GB',
    });

    return res.status(200).json({ url: session.url, id: session.id });
  } catch (err) {
    console.error('Stripe checkout error:', err?.message || err);
    return res.status(500).json({
      error: err?.message || 'Failed to create checkout session',
    });
  }
}