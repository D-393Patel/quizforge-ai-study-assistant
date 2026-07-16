import { ArrowRight, Check, Flag, RotateCcw, X } from 'lucide-react';
import type { Quiz } from '../schemas/quiz';
import { getIncorrectQuestions, scoreQuiz, type AnswerMap, type ChallengeMap } from '../utils/quiz';

type Props = { quiz: Quiz; answers: AnswerMap; challenges: ChallengeMap; onRetry: () => void; onNew: () => void };

export function QuizResults({ quiz, answers, challenges, onRetry, onNew }: Props) {
  const score = scoreQuiz(quiz.questions, answers, challenges);
  const incorrect = getIncorrectQuestions(quiz.questions, answers, challenges);
  const challengedCount = Object.keys(challenges).length;
  const scoredCount = quiz.questions.length - challengedCount;
  const percentage = scoredCount ? Math.round((score / scoredCount) * 100) : 0;
  const message = percentage === 100 ? 'A perfect run.' : percentage >= 70 ? 'Strong work—one more pass will lock it in.' : 'Good start. Review the explanations and try again.';
  return <main className="results-shell">
    <section className="score-card">
      <span className="eyebrow">Quiz complete</span>
      <div className="score-row"><div><h1>{message}</h1><p>You answered {score} of {scoredCount} scored questions correctly.{challengedCount ? ` ${challengedCount} challenged.` : ''}</p></div><div className="score-ring" aria-label={`Score ${percentage} percent`}><strong>{percentage}%</strong><span>score</span></div></div>
      <div className="results-actions">{incorrect.length > 0 && <button className="primary-button" onClick={onRetry}><RotateCcw size={17} /> Retry {incorrect.length} missed</button>}<button className="secondary-button" onClick={onNew}>Create new quiz <ArrowRight size={17} /></button></div>
    </section>
    <section className="review-section" aria-labelledby="review-title"><div className="section-heading"><div><span className="eyebrow">Answer review</span><h2 id="review-title">Learn from every question</h2></div><span>{score} correct · {incorrect.length} missed</span></div>
      <div className="review-list">{quiz.questions.map((question, questionIndex) => {
        const challenged = challenges[question.id]; const correct = answers[question.id] === question.correctIndex;
        return <article className={`review-card ${challenged ? 'challenged' : correct ? 'correct' : 'incorrect'}`} key={question.id}>
          <div className="review-status">{challenged ? <Flag size={17} /> : correct ? <Check size={17} /> : <X size={17} />} {challenged ? `Challenged · ${challenged}` : correct ? 'Correct' : 'Needs review'}</div>
          <h3>{questionIndex + 1}. {question.question}</h3>
          {!correct && <p><span>Your answer</span>{question.options[answers[question.id]] ?? 'Not answered'}</p>}
          <p><span>Correct answer</span>{question.options[question.correctIndex]}</p>
          <div className="explanation"><strong>Why?</strong> {question.explanation}</div>
        </article>;
      })}</div>
    </section>
  </main>;
}
