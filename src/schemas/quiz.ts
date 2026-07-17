import { z } from 'zod';

const cleanText = z.string().trim().min(1).max(1_000);

export const quizQuestionSchema = z.object({
  id: z.string().trim().min(1).max(80),
  question: cleanText,
  options: z.array(z.string().trim().min(1).max(300)).min(2).max(6),
  correctIndex: z.number().int().nonnegative(),
  explanation: cleanText,
}).strict().superRefine((question, context) => {
  const normalized = question.options.map((option) => option.toLocaleLowerCase());
  if (new Set(normalized).size !== normalized.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['options'], message: 'Options must be unique' });
  }
  if (question.correctIndex >= question.options.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['correctIndex'], message: 'Correct answer is outside the options' });
  }
});

export const flashcardSchema = z.object({
  id: z.string().trim().min(1).max(80),
  front: z.string().trim().min(1).max(500),
  back: z.string().trim().min(1).max(1_000),
}).strict();

export const quizSchema = z.object({
  title: z.string().trim().min(1).max(150),
  summary: z.string().trim().max(500).optional(),
  // Empty is accepted only for saved quizzes created before flashcards existed.
  // New Gemini responses require this field through the provider JSON schema.
  flashcards: z.array(flashcardSchema).max(15).default([]),
  questions: z.array(quizQuestionSchema).min(1).max(15),
}).strict().superRefine((quiz, context) => {
  const ids = quiz.questions.map(({ id }) => id);
  if (new Set(ids).size !== ids.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['questions'], message: 'Question IDs must be unique' });
  }
});

export const generationRequestSchema = z.object({
  notes: z.string().trim().min(20, 'Please provide at least 20 characters of study material.').max(12_000),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  questionCount: z.union([z.literal(5), z.literal(10), z.literal(15)]),
  debugFailure: z.enum(['malformed', 'empty', 'timeout', 'server']).optional(),
});

export type Quiz = z.infer<typeof quizSchema>;
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;
export type Flashcard = z.infer<typeof flashcardSchema>;
export type GenerationRequest = z.infer<typeof generationRequestSchema>;
