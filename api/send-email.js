import { Resend } from 'resend';

/**
 * POST /api/send-email
 * Body JSON: { to, subject, html?, text?, from? }
 *
 * Vercel env:
 *   RESEND_API_KEY=re_...
 *   RESEND_FROM_EMAIL=hello@zortius.com   (or REFUND_FROM_EMAIL)
 */
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', process.env.CHECKOUT_ORIGIN || 'https://zortius.com');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'RESEND_API_KEY not configured' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const to = body.to || body.email;
  const subject = body.subject || 'Message from Zortius';
  const html = body.html || (body.text ? undefined : '<p>Hello from Zortius</p>');
  const text = body.text;
  const fromEmail =
    body.from ||
    process.env.RESEND_FROM_EMAIL ||
    process.env.REFUND_FROM_EMAIL ||
    'hello@zortius.com';
  const from = fromEmail.includes('<') ? fromEmail : `Zortius <${fromEmail}>`;

  if (!to) {
    return res.status(400).json({ error: 'Missing to' });
  }

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      ...(html ? { html } : {}),
      ...(text ? { text } : {}),
    });

    if (error) {
      console.error('Resend error', error);
      return res.status(400).json({ error });
    }

    return res.status(200).json({ ok: true, id: data?.id || null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Send failed' });
  }
}