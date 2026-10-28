// api/ai-support.js — free-tier LLM support (set GROQ_API_KEY or GEMINI_API_KEY in Vercel)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const message = (body.message || '').toString().slice(0, 2000);
    const context = (body.context || '').toString().slice(0, 3000);
    if (!message.trim()) {
      res.status(400).json({ error: 'Empty message' });
      return;
    }

    const system = `You are Zortius Support, a helpful assistant for Zortius (zortius.com), a UK-first hardware company selling workstations, displays, and peripherals. Be concise, accurate, and professional. If orders are not open, say pre-order / waitlist is available. Never invent order IDs, prices that are not in context, or policy guarantees. If you need a human, say the user can open a support ticket in the chat. Context about the site:\n${context || 'Pre-order interest mode; careers applications; newsletter; email support.'}`;

    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (groqKey) {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          temperature: 0.4,
          max_tokens: 500,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: message }
          ]
        })
      });
      const data = await r.json();
      if (!r.ok) {
        res.status(502).json({ error: data.error?.message || 'Groq error', fallback: true });
        return;
      }
      const text = data.choices?.[0]?.message?.content || '';
      res.status(200).json({ text, provider: 'groq' });
      return;
    }

    if (geminiKey) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `${system}\n\nUser: ${message}` }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 500 }
        })
      });
      const data = await r.json();
      if (!r.ok) {
        res.status(502).json({ error: data.error?.message || 'Gemini error', fallback: true });
        return;
      }
      const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
      res.status(200).json({ text, provider: 'gemini' });
      return;
    }

    res.status(200).json({
      text: '',
      fallback: true,
      error: 'No AI key configured. Set GROQ_API_KEY or GEMINI_API_KEY in Vercel.'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error', fallback: true });
  }
}