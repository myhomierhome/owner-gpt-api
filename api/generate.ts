// Vercel Serverless Function (Node 18+)
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // --- Simple auth so only your GPT can call this endpoint ---
    const auth = req.headers.authorization || '';
    const token = auth.replace('Bearer ', '');
    if (token !== process.env.PRIVATE_ACTION_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { prompt, system, temperature = 0.7, max_tokens = 800 } = req.body || {};
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

    // --- Call OpenAI with YOUR API key ---
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // or your preferred model
        messages: [
          ...(system ? [{ role: 'system', content: system }] : []),
          { role: 'user', content: prompt }
        ],
        temperature,
        max_tokens
      })
    });

    if (!r.ok) {
      const t = await r.text();
      return res.status(500).json({ error: 'OpenAI error', details: t });
    }

    const data = await r.json();
    const text = data.choices?.[0]?.message?.content ?? '';

    res.status(200).json({ output: text });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Server error' });
  }
}
