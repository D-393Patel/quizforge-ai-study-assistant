import { describe, expect, it } from 'vitest';
import { enforceRequestedCounts, ModelResponseError, parseModelResponse } from './quiz';

const raw = JSON.stringify({ title: 'Test', questions: [{ question: 'Valid question?', options: ['Yes', 'No'], correctIndex: 0, explanation: 'Yes.' }] });
describe('parseModelResponse', () => {
  it('removes code fences and supplies IDs', () => expect(parseModelResponse('```json\n' + raw + '\n```').questions[0].id).toBe('q-1'));
  it('rejects empty output', () => expect(() => parseModelResponse(' ')).toThrow(ModelResponseError));
  it('rejects malformed JSON', () => expect(() => parseModelResponse('{ nope')).toThrow('malformed JSON'));
  it('repairs safe ID, index, and duplicate-option defects', () => {
    const repaired = parseModelResponse(JSON.stringify({
      title: 'Test',
      flashcards: [{ id: 'same', front: 'A', back: 'B' }, { id: 'same', front: 'C', back: 'D' }],
      questions: [{ id: 'duplicate', question: 'Valid question?', options: ['Yes', ' yes ', 'No'], correctIndex: '1', explanation: 'Yes.' }],
    }));
    expect(repaired.flashcards.map(({ id }) => id)).toEqual(['card-1', 'card-2']);
    expect(repaired.questions[0]).toMatchObject({ id: 'q-1', options: ['Yes', 'No'], correctIndex: 0 });
  });
  it('does not guess an invalid correct answer', () => expect(() => parseModelResponse(raw.replace('"correctIndex":0', '"correctIndex":4'))).toThrow('invalid structure'));
  it('rejects a valid response that ignores requested counts', () => {
    const parsed = parseModelResponse(raw);
    expect(() => enforceRequestedCounts(parsed, {
      notes: 'Sufficiently detailed notes for a count validation test.',
      difficulty: 'medium',
      flashcardCount: 5,
      questionCount: 5,
    })).toThrow('0 of 5 requested flashcards');
  });
});
