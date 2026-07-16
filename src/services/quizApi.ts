import { quizSchema, type GenerationRequest, type Quiz } from '../schemas/quiz';

export class ApiError extends Error {
  constructor(message: string, public status?: number) { super(message); }
}

export async function generateQuiz(input: GenerationRequest, signal: AbortSignal): Promise<{ quiz: Quiz; mock: boolean }> {
  let response: Response;
  try {
    response = await fetch('/api/generate-quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError('We could not reach the server. Check your connection and try again.');
  }

  const body = await response.json().catch(() => null) as { quiz?: unknown; error?: string; mock?: boolean } | null;
  if (!response.ok) throw new ApiError(body?.error ?? 'Quiz generation failed. Please try again.', response.status);
  const parsed = quizSchema.safeParse(body?.quiz);
  if (!parsed.success) throw new ApiError('The server returned an invalid quiz. Please generate it again.');
  return { quiz: parsed.data, mock: Boolean(body?.mock) };
}
