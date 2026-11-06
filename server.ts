import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Enable large file uploads (50MB) for educational PDF textbooks, slides & high-res radiography scans
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure public/uploads directory exists and is statically served
const uploadsDir = path.resolve('public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Configure Cloudinary if credentials are provided in environment
if (process.env.CLOUDINARY_URL) {
  cloudinary.config();
} else if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

// Dedicated Upload endpoint for Cloudinary & educational assets
app.post('/api/upload', async (req, res) => {
  try {
    const { fileData, fileName, folder = 'studirad' } = req.body;
    if (!fileData) {
      return res.status(400).json({ error: 'fileData (base64 data URL) is required' });
    }

    const hasCloudinary = Boolean(
      process.env.CLOUDINARY_URL || 
      (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY)
    );

    // Try Cloudinary first if configured
    if (hasCloudinary) {
      try {
        const cleanPublicId = fileName
          ? `${Date.now()}_${fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_')}`
          : undefined;

        const uploadRes = await cloudinary.uploader.upload(fileData, {
          folder,
          resource_type: 'auto',
          public_id: cleanPublicId,
        });

        return res.json({
          url: uploadRes.secure_url,
          publicId: uploadRes.public_id,
          provider: 'cloudinary',
        });
      } catch (cloudErr) {
        console.warn('Cloudinary upload warning, saving to local public server store:', cloudErr);
      }
    }

    // Direct local public server storage: completely bypasses CORS, zero third-party preflight blocks
    const matches = fileData.match(/^data:([A-Za-z-+/0-9]+);base64,(.+)$/);
    let buffer: Buffer;
    let ext = 'bin';

    if (matches && matches.length === 3) {
      const mime = matches[1];
      buffer = Buffer.from(matches[2], 'base64');
      if (fileName && fileName.includes('.')) {
        ext = fileName.split('.').pop() || 'bin';
      } else {
        ext = mime.split('/')[1] || 'bin';
      }
    } else {
      buffer = Buffer.from(fileData, 'base64');
      if (fileName && fileName.includes('.')) {
        ext = fileName.split('.').pop() || 'bin';
      }
    }

    const cleanBaseName = fileName ? fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_') : 'file';
    const uniqueFileName = `${Date.now()}_${cleanBaseName}.${ext}`;
    const filePath = path.join(uploadsDir, uniqueFileName);
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${uniqueFileName}`;
    return res.json({
      url: publicUrl,
      provider: 'local_server',
    });
  } catch (err: any) {
    console.error('Upload processing error:', err);
    return res.status(500).json({ error: err?.message || 'Failed to process file upload' });
  }
});

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

  app.listen(port, '0.0.0.0', () => {
    console.log(`StudiRad server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
});
