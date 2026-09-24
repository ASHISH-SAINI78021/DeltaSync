import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Lazily build OpenRouter client via native fetch (no openai SDK issues)
async function callOpenRouter(messages, stream = false) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set in environment');

  const body = {
    model: 'meta-llama/llama-3.1-8b-instruct',
    messages,
    stream,
  };

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'Collaborative Editor',
    },
    body: JSON.stringify(body),
  });

  return response;
}

// Non-streaming AI endpoint
router.post('/ask', requireAuth, async (req, res) => {
  try {
    const { documentText, query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query is required.' });

    const systemPrompt = `You are an AI assistant built into a collaborative document editor.
Answer the user's question concisely based on the document text provided.

DOCUMENT TEXT:
${documentText || '(The document is empty)'}`;

    const response = await callOpenRouter([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: query },
    ], false);

    if (!response.ok) {
      const errText = await response.text();
      console.error('[AI /ask] OpenRouter error:', response.status, errText);
      return res.status(502).json({ error: 'OpenRouter error', details: errText });
    }

    const data = await response.json();
    res.json({ answer: data.choices[0].message.content });
  } catch (error) {
    console.error('[AI /ask] Unexpected error:', error);
    res.status(500).json({ error: 'Failed to generate AI response.', details: error.message });
  }
});

// Streaming AI endpoint
router.post('/stream', requireAuth, async (req, res) => {
  try {
    const { documentText, query } = req.body;
    console.log('[AI /stream] Received query:', query);

    if (!query) return res.status(400).json({ error: 'Query is required.' });

    const systemPrompt = `You are an AI assistant built into a collaborative document editor.
Answer the user's question concisely based on the document text provided.

DOCUMENT TEXT:
${documentText || '(the document is empty)'}`;

    const response = await callOpenRouter([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: query },
    ], true);

    if (!response.ok) {
      const errText = await response.text();
      console.error('[AI /stream] OpenRouter error:', response.status, errText);
      return res.status(502).json({ error: 'OpenRouter error', details: errText });
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const raw = line.slice(5).trim();
        if (raw === '[DONE]') break;
        try {
          const parsed = JSON.parse(raw);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
          }
        } catch (_) {
          // ignore malformed JSON lines
        }
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error('[AI /stream] Unexpected error:', error);
    // If headers not sent yet, return JSON error
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to stream AI response.', details: error.message });
    } else {
      res.end();
    }
  }
});

export default router;
