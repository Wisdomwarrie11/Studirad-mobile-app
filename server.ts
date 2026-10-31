import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// API route for AI Tutor providing real radiography answers via Gemini
app.post('/api/ai-tutor', async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY environment variable is not set.');
      return res.status(500).json({ 
        error: 'AI service configuration error: GEMINI_API_KEY is not configured on the server.' 
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Build chat history contents
    const contents: any[] = [];
    if (Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory.slice(-8)) {
        if (msg.sender === 'user') {
          contents.push({ role: 'user', parts: [{ text: msg.text }] });
        } else if (msg.sender === 'ai' && msg.id !== 'msg_welcome') {
          contents.push({ role: 'model', parts: [{ text: msg.text }] });
        }
      }
    }
    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: `You are StudiRad AI, a premier clinical radiography and diagnostic imaging tutor for radiography students, clinical interns, radiographers, and sonographers.

Provide clear, structured, and clinically accurate answers covering:
- Radiographic physics & imaging technology (X-ray tubes, kVp/mAs exposure, digital detectors, grids, filtration, CT pitch & reconstruction, MRI pulse sequences & relaxation times).
- Anatomical positioning protocols, projection criteria, immobilized trauma series, and patient safety.
- Radiation protection principles (ALARA, inverse square law, collimation, shielding, IR(ME)R, Diagnostic Reference Levels).
- Sectional anatomy (cross-sectional CT/MRI, axial/coronal/sagittal planes) and pathology recognition.
- Clinical image critiquing, common diagnostic pitfalls, and artifact recognition.

Formatting rules:
- Use clean Markdown with bold headings, concise bullet points, and numbered steps.
- Highlight practical clinical tips with 💡 and safety/emergency warnings with ⚠️ where appropriate.
- Keep explanations clear and formatted for mobile reading.
- At the very end of your response, provide 2 short, relevant follow-up questions in this exact tag format:
[FOLLOW_UPS]
First follow-up question?
Second follow-up question?
[/FOLLOW_UPS]`,
      },
    });

    const fullText = response.text || '';
    
    // Parse out follow ups if present
    let text = fullText;
    const followUps: string[] = [];
    const followUpMatch = fullText.match(/\[FOLLOW_UPS\]([\s\S]*?)\[\/FOLLOW_UPS\]/);
    if (followUpMatch) {
      text = fullText.replace(/\[FOLLOW_UPS\][\s\S]*?\[\/FOLLOW_UPS\]/, '').trim();
      const rawLines = followUpMatch[1]
        .split('\n')
        .map((l) => l.replace(/^[-*•\d.]+\s*/, '').trim())
        .filter(Boolean);
      followUps.push(...rawLines.slice(0, 3));
    }

    return res.json({
      text,
      followUps: followUps.length > 0 ? followUps : [
        'Can you explain this in simpler terms?',
        'Give me a practice viva question on this topic',
      ],
    });
  } catch (error: any) {
    console.error('AI Tutor API error:', error);
    return res.status(500).json({ 
      error: error?.message || 'Failed to generate answer from StudiRad AI' 
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, () => {
    console.log(`StudiRad server running on http://0.0.0.0:${port}`);
  });
}

startServer();
