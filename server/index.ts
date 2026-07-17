import express, { type ErrorRequestHandler } from 'express';
import { createServer as createViteServer } from 'vite';
import { generationRequestSchema } from '../src/schemas/quiz';
import { createQuiz, mockQuiz, ModelResponseError } from './quiz';
import { createQuizWithOpenRouter, OpenRouterError } from './openrouter';

// Node does not load local environment files automatically. Keep secrets on the
// server and allow a normal `npm start` to use the documented `.env` setup.
try { process.loadEnvFile?.(); } catch { /* Environment variables may be supplied by the host instead. */ }

const app = express();
const port = Number(process.env.PORT) || 3000;
app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));

app.get('/api/health', (_request, response) => response.json({ ok: true }));
app.post('/api/generate-quiz', async (request, response) => {
  const parsed = generationRequestSchema.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid request.' });
  if (process.env.NODE_ENV !== 'production' && parsed.data.debugFailure) {
    const failure = parsed.data.debugFailure;
    if (failure === 'timeout') return setTimeout(() => response.status(504).json({ error: 'The AI took too long to respond. Please try again.' }), 1_200);
    if (failure === 'empty') return response.status(502).json({ error: 'The model returned an empty response. Please try again.' });
    if (failure === 'malformed') return response.status(502).json({ error: 'The model returned malformed JSON. Please try again.' });
    return response.status(502).json({ error: 'The AI provider could not generate a quiz. Please try again.' });
  }

  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 60_000);
  try {
    const useMock = process.env.MOCK_AI === 'true';
    if (useMock) return response.json({ quiz: mockQuiz(parsed.data), mock: true, provider: 'mock', fallbackUsed: false });
    try {
      const quiz = await createQuiz(parsed.data, controller.signal);
      return response.json({ quiz, mock: false, provider: 'gemini', fallbackUsed: false });
    } catch (geminiError) {
      const status = typeof geminiError === 'object' && geminiError && 'status' in geminiError ? Number(geminiError.status) : 0;
      const canFallback = process.env.AI_FALLBACK_ENABLED === 'true'
        && Boolean(process.env.OPENROUTER_API_KEY)
        && (geminiError instanceof ModelResponseError || status === 429 || status >= 500);
      if (!canFallback || controller.signal.aborted) throw geminiError;
      const quiz = await createQuizWithOpenRouter(parsed.data, controller.signal);
      return response.json({ quiz, mock: false, provider: 'openrouter', fallbackUsed: true });
    }
  } catch (error) {
    if (timedOut) return response.status(504).json({ error: 'The AI took too long to respond. Please try again.' });
    if (error instanceof ModelResponseError) return response.status(502).json({ error: `${error.message} Please try again.` });
    if (error instanceof OpenRouterError) return response.status(502).json({ error: 'Both AI providers are temporarily unavailable. Your notes are preserved—please retry shortly.' });
    if (error instanceof Error && error.message === 'CONFIGURATION') return response.status(503).json({ error: 'The AI service is not configured. Add GEMINI_API_KEY or enable MOCK_AI.' });
    const status = typeof error === 'object' && error && 'status' in error ? Number(error.status) : 500;
    if (status === 429) return response.status(429).json({ error: 'The AI provider is busy. Wait a moment and retry.' });
    if (status === 503) return response.status(503).json({ error: 'Gemini is experiencing high demand right now. Wait a moment and retry—your notes are preserved.' });
    return response.status(502).json({ error: 'The AI provider could not generate a quiz. Please try again.' });
  } finally { clearTimeout(timeout); }
});

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if ('type' in error && error.type === 'entity.too.large') response.status(413).json({ error: 'The submitted notes are too large.' });
  else response.status(400).json({ error: 'The request could not be processed.' });
};
app.use(errorHandler);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('dist'));
  app.get('/{*splat}', (_request, response) => response.sendFile('index.html', { root: 'dist' }));
} else {
  const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
}

app.listen(port, () => console.log(`QuizForge is running at http://localhost:${port}`));
