// api/ai-support.js — set GROQ_API_KEY or GEMINI_API_KEY in Vercel, then redeploy
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    res.status(200).json({
      ok: true,
      hasGroq: Boolean(process.env.GROQ_API_KEY),
      hasGemini: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY),
      message: 'POST { "message": "hello" } to chat'
    });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const message = (body.message || '').toString().slice(0, 2000);
    const context = (body.context || '').toString().slice(0, 3000);
    if (!message.trim()) {
      res.status(400).json({ error: 'Empty message', fallback: true });
      return;
    }

    const system = `You are Zortius Support on zortius.com — a UK-first hardware brand (workstations, displays, peripherals). Be concise and accurate. Pre-order/waitlist may be active if orders are not open. Never invent order IDs or fake policies. If the user needs a human, tell them to open a support ticket in the chat. Site context:\n${context || 'Pre-order interest; careers; newsletter.'}`;

    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (groqKey) {
      const models = ['llama-3.3-70b-versatile', 'llama-3.1-70b-versatile', 'llama-3.1-8b-instant', 'gemma2-9b-it'];
      let lastErr = '';
      for (const model of models) {
        try {
          const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${groqKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model,
              temperature: 0.4,
              max_tokens: 600,
              messages: [
                { role: 'system', content: system },
                { role: 'user', content: message }
              ]
            })
          });
          const data = await r.json();
          if (r.ok) {
            const text = data.choices?.[0]?.message?.content || '';
            if (text) {
              res.status(200).json({ text, provider: 'groq', model });
              return;
            }
          }
          lastErr = data.error?.message || data.message || `HTTP ${r.status}`;
        } catch (e) {
          lastErr = e.message || 'fetch failed';
        }
      }
      res.status(200).json({ text: '', fallback: true, error: lastErr || 'Groq failed' });
      return;
    }

    if (geminiKey) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(geminiKey)}`;
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `${system}\n\nUser: ${message}` }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 600 }
        })
      });
      const data = await r.json();
      if (!r.ok) {
        res.status(200).json({
          text: '',
          fallback: true,
          error: data.error?.message || `Gemini HTTP ${r.status}`
        });
        return;
      }
      const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
      res.status(200).json({ text, provider: 'gemini' });
      return;
    }

    res.status(200).json({
      text: '',
      fallback: true,
      error: 'No AI key on server. Set GROQ_API_KEY in Vercel and Redeploy.'
    });
  } catch (err) {
    console.error(err);
    res.status(200).json({ text: '', fallback: true, error: err.message || 'Server error' });
  }
}