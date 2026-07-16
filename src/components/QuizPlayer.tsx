import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Flag, Keyboard } from 'lucide-react';
import type { Quiz } from '../schemas/quiz';
import { challengeReasons, type AnswerMap, type ChallengeMap, type ChallengeReason } from '../utils/quiz';

type Props = { quiz: Quiz; difficulty: string; attempt?: number; initialAnswers?: AnswerMap; initialChallenges?: ChallengeMap; onProgress: (answers: AnswerMap, challenges: ChallengeMap) => void; onSubmit: (answers: AnswerMap, challenges: ChallengeMap) => void; onExit: () => void };

export function QuizPlayer({ quiz, difficulty, attempt = 1, initialAnswers = {}, initialChallenges = {}, onProgress, onSubmit, onExit }: Props) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>(initialAnswers);
  const [challenges, setChallenges] = useState<ChallengeMap>(initialChallenges);
  const question = quiz.questions[index];
  const answered = Object.keys(answers).length;
  const isLast = index === quiz.questions.length - 1;
  useEffect(() => { document.querySelector<HTMLElement>('.question-title')?.focus(); }, [index]);
  useEffect(() => { onProgress(answers, challenges); }, [answers, challenges, onProgress]);
  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      if (event.target instanceof HTMLSelectElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLInputElement) return;
      const number = Number(event.key);
      if (number >= 1 && number <= question.options.length) { setAnswers((current) => ({ ...current, [question.id]: number - 1 })); return; }
      if (event.key === 'ArrowLeft' && index > 0) setIndex((current) => current - 1);
      if (event.key === 'ArrowRight' && index < quiz.questions.length - 1) setIndex((current) => current + 1);
    }
    window.addEventListener('keydown', keydown); return () => window.removeEventListener('keydown', keydown);
  }, [index, question, quiz.questions.length]);

  function challenge(reason: string) {
    setChallenges((current) => reason ? { ...current, [question.id]: reason as ChallengeReason } : Object.fromEntries(Object.entries(current).filter(([id]) => id !== question.id)));
  }

  return <main className="quiz-shell">
    <button className="back-button" onClick={onExit}><ArrowLeft size={17} /> New quiz</button>
    <section className="quiz-card" aria-labelledby="quiz-title">
      <div className="quiz-topline"><div><span className="eyebrow">{attempt > 1 ? `Retry ${attempt - 1}` : 'Quiz in progress'}</span><h1 id="quiz-title">{quiz.title}</h1></div><span className="progress-copy">{index + 1} / {quiz.questions.length}</span></div>
      <div className="progress-track" aria-label={`${answered} of ${quiz.questions.length} answered`}><span style={{ width: `${(answered / quiz.questions.length) * 100}%` }} /></div>
      <div className="quality-strip"><span><Check size={14} /> {quiz.questions.length} questions</span><span><Check size={14} /> Response validated</span><span><Check size={14} /> {difficulty} difficulty</span></div>
      <fieldset className="question-fieldset">
        <legend className="question-title" tabIndex={-1}>{question.question}</legend>
        <div className="option-list">{question.options.map((option, optionIndex) => {
          const selected = answers[question.id] === optionIndex;
          return <label className={`answer-option ${selected ? 'selected' : ''}`} key={option}>
            <input type="radio" name={question.id} checked={selected} onChange={() => setAnswers({ ...answers, [question.id]: optionIndex })} />
            <span className="option-letter">{String.fromCharCode(65 + optionIndex)}</span><span>{option}</span>{selected && <Check className="option-check" size={18} aria-hidden />}
          </label>;
        })}</div>
        <div className="challenge-row"><label><Flag size={15} /> Challenge this question
          <select aria-label="Challenge this question" value={challenges[question.id] ?? ''} onChange={(event) => challenge(event.target.value)}><option value="">No issue</option>{challengeReasons.map((reason) => <option key={reason}>{reason}</option>)}</select>
        </label>{challenges[question.id] && <span>Excluded from your score</span>}</div>
      </fieldset>
      <div className="quiz-actions">
        <button className="secondary-button" disabled={index === 0} onClick={() => setIndex(index - 1)}><ArrowLeft size={17} /> Previous</button>
        {isLast ? <button className="primary-button" disabled={answered !== quiz.questions.length} onClick={() => onSubmit(answers, challenges)}>Finish quiz <Check size={17} /></button> : <button className="primary-button" onClick={() => setIndex(index + 1)}>Next <ArrowRight size={17} /></button>}
      </div>
      {isLast && answered !== quiz.questions.length && <p className="answer-hint" role="status">Answer all {quiz.questions.length} questions to finish. You have {quiz.questions.length - answered} left.</p>}
      <p className="keyboard-hint"><Keyboard size={14} /> Keys 1–{Math.min(4, question.options.length)} select · ← → navigate</p>
    </section>
  </main>;
}
