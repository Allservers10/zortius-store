import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { items, customerEmail, shippingAddress, shipping, successUrl, cancelUrl } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'No items provided' });
  }

  try {
    const line_items = items.map((item) => ({
      price_data: {
        currency: 'gbp',
        product_data: {
          name: item.selectedColor ? `${item.name} (${item.selectedColor})` : item.name,
          images: item.image ? [item.image] : [],
        },
        unit_amount: Math.round(Number(item.price) * 100),
      },
      quantity: item.qty || 1,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: customerEmail,
      line_items,
      success_url: successUrl || 'https://zortius.vercel.app/account/orders?paid=1',
      cancel_url: cancelUrl || 'https://zortius.vercel.app/cart',
      shipping_address_collection: {
        allowed_countries: ['GB', 'US', 'CA', 'AU', 'DE', 'FR', 'IE', 'NL', 'BE'],
      },
      metadata: {
        shippingAddress: shippingAddress || '',
        shippingJson: shipping ? JSON.stringify(shipping) : '',
      },
    });

    return res.status(200).json({ url: session.url, id: session.id });
  } catch (err) {
    console.error('Stripe error:', err);
    return res.status(500).json({ error: err.message || 'Failed to create checkout session' });
  }
}