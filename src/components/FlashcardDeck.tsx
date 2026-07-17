import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, BrainCircuit, Keyboard, RotateCw, Sparkles } from 'lucide-react';
import type { Quiz } from '../schemas/quiz';

type Props = {
  quiz: Quiz;
  difficulty: string;
  mock?: boolean;
  fallbackUsed?: boolean;
  onStartQuiz: () => void;
  onExit: () => void;
};

export function FlashcardDeck({ quiz, difficulty, mock = false, fallbackUsed = false, onStartQuiz, onExit }: Props) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = quiz.flashcards[index];

  function move(next: number) {
    setIndex(next);
    setFlipped(false);
  }

  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        setFlipped((value) => !value);
      } else if (event.key === 'ArrowLeft' && index > 0) move(index - 1);
      else if (event.key === 'ArrowRight' && index < quiz.flashcards.length - 1) move(index + 1);
    }
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [index, quiz.flashcards.length]);

  return <main className="quiz-shell">
    <button className="back-button" onClick={onExit}><ArrowLeft size={17} /> New topic</button>
    <section className="quiz-card learn-card" aria-labelledby="learn-title">
      <div className="quiz-topline">
        <div><span className="eyebrow">Learn the concepts</span><h1 id="learn-title">{quiz.title}</h1></div>
        <span className="progress-copy">{index + 1} / {quiz.flashcards.length}</span>
      </div>
      <div className="progress-track"><span style={{ width: `${((index + 1) / quiz.flashcards.length) * 100}%` }} /></div>
      <div className="quality-strip"><span><BrainCircuit size={14} /> {quiz.flashcards.length} concept cards</span><span><Sparkles size={14} /> {difficulty} quiz next</span>{mock && <span className="demo-badge">Demo data</span>}{fallbackUsed && <span className="fallback-badge">Backup provider used</span>}</div>

      <button className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)} aria-label={`${flipped ? 'Answer' : 'Question'}: ${flipped ? card.back : card.front}. Click to flip.`}>
        <span className="flashcard-side">{flipped ? 'Explanation' : 'Concept'}</span>
        <strong>{flipped ? card.back : card.front}</strong>
        <span className="flip-hint"><RotateCw size={16} /> {flipped ? 'Show prompt' : 'Reveal explanation'}</span>
      </button>

      <div className="quiz-actions">
        <button className="secondary-button" disabled={index === 0} onClick={() => move(index - 1)}><ArrowLeft size={17} /> Previous</button>
        {index === quiz.flashcards.length - 1
          ? <button className="primary-button" onClick={onStartQuiz}>Start quiz <ArrowRight size={17} /></button>
          : <button className="primary-button" onClick={() => move(index + 1)}>Next card <ArrowRight size={17} /></button>}
      </div>
      <p className="keyboard-hint"><Keyboard size={14} /> Space flips · ← → navigate</p>
    </section>
  </main>;
}
