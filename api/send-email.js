import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, subject, message, name } = req.body;

    if (!to || !subject || !message) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, message' });
    }

    const { data, error } = await resend.emails.send({
      from: 'Zortius <onboarding@resend.dev>',   // Change this later after you verify your domain
      to: [to],
      subject: subject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto;">
          <div style="background: #0f172a; padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #22d3ee; margin: 0; font-size: 22px;">ZORTIUS</h1>
          </div>
          <div style="background: #f8fafc; padding: 28px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="margin-top: 0;">Hi <strong>${name || 'there'}</strong>,</p>
            <div style="background: white; padding: 16px 20px; border-radius: 8px; border: 1px solid #e2e8f0; white-space: pre-wrap; font-size: 14px;">
${message}
            </div>
            <p style="color: #64748b; font-size: 13px; margin-bottom: 0; margin-top: 24px;">
              — The Zortius Team
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, id: data?.id });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}