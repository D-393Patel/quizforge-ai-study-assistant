import { describe, expect, it } from 'vitest';
import { getIncorrectQuestions, makeRetryQuiz, scoreQuiz } from './quiz';

const questions = [
  { id: 'a', question: 'First?', options: ['A', 'B'], correctIndex: 0, explanation: 'A' },
  { id: 'b', question: 'Second?', options: ['A', 'B'], correctIndex: 1, explanation: 'B' },
];
describe('quiz helpers', () => {
  it('scores answers', () => expect(scoreQuiz(questions, { a: 0, b: 0 })).toBe(1));
  it('excludes challenged questions from scoring and retries', () => {
    const challenges = { b: 'Ambiguous wording' } as const;
    expect(scoreQuiz(questions, { a: 0, b: 0 }, challenges)).toBe(1);
    expect(getIncorrectQuestions(questions, { a: 0, b: 0 }, challenges)).toHaveLength(0);
  });
  it('selects only incorrect answers', () => expect(getIncorrectQuestions(questions, { a: 0, b: 0 }).map((q) => q.id)).toEqual(['b']));
  it('creates a retry without mutating the quiz', () => { const quiz = { title: 'Quiz', questions }; const retry = makeRetryQuiz(quiz, { a: 0, b: 0 }); expect(retry.questions).toHaveLength(1); expect(quiz.questions).toHaveLength(2); });
});
