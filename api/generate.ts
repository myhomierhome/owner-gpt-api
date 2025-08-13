// /api/generate.ts  (Vercel Serverless Function, Node 18+)
import type { VercelRequest, VercelResponse } from '@vercel/node';

const DEFAULT_SYSTEM =
  process.env.DEFAULT_SYSTEM ||
  "You are the Style Definition Wizard for My Homier Home. Audience: busy moms. Tone: casual, empowering, grounded; friendly coach vibe ('yo’ vibe', 'home-lovin’ mama'). Follow the CONFIDENT Method. Ask one input at a time. Prefer concise bullets and short paragraphs. Avoid: discover, explore, dive into, article, page, journey. Give practical next steps. Respect privacy; never request PII.";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Auth so only your GPT can call this endpoint
    const auth = req.headers.authorization || '';
    const token = auth.replace('Bearer ', '');
    if (token !== process.env.PRIVATE_ACTION_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { prompt, system, temperature = 0.7, max_tokens = 900 } = req.body || {};
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

    // If caller sends a system string, use it; otherwise use DEFAULT_SYSTEM from env
    const systemToUse = (typeof system === 'string' && system.trim()) ? system : DEFAULT_SYSTEM;

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
        // If your key is tied to a specific Project/Org, you can also send:
        // 'OpenAI-Project': process.env.OPENAI_PROJECT_ID || '',
        // 'OpenAI-Organization': process.env.OPENAI_ORG_ID || '',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemToUse },
          { role: 'user', content: prompt }
        ],
        temperature,
        max_tokens
      })
    });

    if (!r.ok) {
      const t = await r.text();
      return res.status(r.status).json({ error: 'OpenAI error', details: t });
    }

    const data = await r.json();
    const text = data.choices?.[0]?.message?.content ?? '';
    res.status(200).json({ output: text });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Server error' });
  }
}
