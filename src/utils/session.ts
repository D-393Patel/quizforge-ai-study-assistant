import { quizSchema, type Quiz } from '../schemas/quiz';
import type { AnswerMap, ChallengeMap } from './quiz';

export type SavedSession = {
  name: 'quiz' | 'results';
  quiz: Quiz;
  difficulty: string;
  attempt: number;
  answers: AnswerMap;
  challenges: ChallengeMap;
};

export const SESSION_KEY = 'quizforge-session-v1';

export function loadSession(): SavedSession | null {
  try {
    const value = JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null') as Partial<SavedSession> | null;
    if (!value || (value.name !== 'quiz' && value.name !== 'results')) return null;
    const quiz = quizSchema.safeParse(value.quiz);
    if (!quiz.success) return null;
    return { name: value.name, quiz: quiz.data, difficulty: String(value.difficulty ?? 'medium'), attempt: Number(value.attempt) || 1, answers: value.answers ?? {}, challenges: value.challenges ?? {} };
  } catch { localStorage.removeItem(SESSION_KEY); return null; }
}
