import { describe, expect, it } from 'vitest';
import { quizSchema } from './quiz';

const valid = { title: 'Test', questions: [{ id: 'q1', question: 'A valid question?', options: ['One', 'Two'], correctIndex: 1, explanation: 'Because two.' }] };
describe('quizSchema', () => {
  it('accepts a valid quiz', () => expect(quizSchema.safeParse(valid).success).toBe(true));
  it('rejects an out-of-range answer', () => expect(quizSchema.safeParse({ ...valid, questions: [{ ...valid.questions[0], correctIndex: 2 }] }).success).toBe(false));
  it('rejects duplicate options', () => expect(quizSchema.safeParse({ ...valid, questions: [{ ...valid.questions[0], options: ['Same', 'same'] }] }).success).toBe(false));
  it('rejects duplicate question IDs', () => expect(quizSchema.safeParse({ ...valid, questions: [valid.questions[0], valid.questions[0]] }).success).toBe(false));
});
