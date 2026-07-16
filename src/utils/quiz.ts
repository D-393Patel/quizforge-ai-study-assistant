import type { Quiz, QuizQuestion } from '../schemas/quiz';

export type AnswerMap = Record<string, number>;
export const challengeReasons = ['Incorrect answer', 'Ambiguous wording', 'Not covered by my notes', 'Duplicate question'] as const;
export type ChallengeReason = typeof challengeReasons[number];
export type ChallengeMap = Record<string, ChallengeReason>;

export function scoreQuiz(questions: QuizQuestion[], answers: AnswerMap, challenges: ChallengeMap = {}) {
  return questions.reduce((score, question) => score + (!challenges[question.id] && answers[question.id] === question.correctIndex ? 1 : 0), 0);
}

export function getIncorrectQuestions(questions: QuizQuestion[], answers: AnswerMap, challenges: ChallengeMap = {}) {
  return questions.filter((question) => !challenges[question.id] && answers[question.id] !== question.correctIndex);
}

export function makeRetryQuiz(quiz: Quiz, answers: AnswerMap, challenges: ChallengeMap = {}): Quiz {
  return { ...quiz, title: `${quiz.title} · Retry`, questions: getIncorrectQuestions(quiz.questions, answers, challenges) };
}
