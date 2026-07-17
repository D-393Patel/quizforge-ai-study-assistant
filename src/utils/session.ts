import { quizSchema, type Quiz } from '../schemas/quiz';
import type { AnswerMap, ChallengeMap } from './quiz';

export type SavedSession = {
  name: 'learn' | 'quiz' | 'results';
  quiz: Quiz;
  difficulty: string;
  mock: boolean;
  attempt: number;
  answers: AnswerMap;
  challenges: ChallengeMap;
};

export const SESSION_KEY = 'quizforge-session-v1';

export function loadSession(): SavedSession | null {
  try {
    const value = JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null') as Partial<SavedSession> | null;
    if (!value || !['learn', 'quiz', 'results'].includes(value.name ?? '')) return null;
    const quiz = quizSchema.safeParse(value.quiz);
    if (!quiz.success) return null;
    return { name: value.name as SavedSession['name'], quiz: quiz.data, difficulty: String(value.difficulty ?? 'medium'), mock: Boolean(value.mock), attempt: Number(value.attempt) || 1, answers: value.answers ?? {}, challenges: value.challenges ?? {} };
  } catch { localStorage.removeItem(SESSION_KEY); return null; }
}
