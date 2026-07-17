import { useCallback, useEffect, useRef, useState } from 'react';
import { BrainCircuit, History, ShieldCheck, TimerReset, TriangleAlert, X } from 'lucide-react';
import { QuizForm } from './components/QuizForm';
import { QuizPlayer } from './components/QuizPlayer';
import { QuizResults } from './components/QuizResults';
import { useQuizGeneration } from './hooks/useQuizGeneration';
import type { GenerationRequest, Quiz } from './schemas/quiz';
import { makeRetryQuiz, type AnswerMap, type ChallengeMap } from './utils/quiz';
import { loadSession, SESSION_KEY } from './utils/session';
import './styles.css';

type QuizScreen = { name: 'quiz'; quiz: Quiz; difficulty: string; mock: boolean; attempt: number; answers: AnswerMap; challenges: ChallengeMap };
type ResultsScreen = { name: 'results'; quiz: Quiz; difficulty: string; mock: boolean; answers: AnswerMap; challenges: ChallengeMap; attempt: number };
type Screen = { name: 'home' } | QuizScreen | ResultsScreen;

export default function App() {
  const { state, generate, cancel, reset } = useQuizGeneration();
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const [savedSession, setSavedSession] = useState<QuizScreen | ResultsScreen | null>(() => loadSession() as QuizScreen | ResultsScreen | null);
  const lastRequest = useRef<GenerationRequest | null>(null);

  async function requestQuiz(request: GenerationRequest) { lastRequest.current = request; setScreen({ name: 'home' }); await generate(request); }
  useEffect(() => {
    if (state.status === 'success') setScreen({ name: 'quiz', quiz: state.quiz, difficulty: lastRequest.current?.difficulty ?? 'medium', mock: state.mock, attempt: 1, answers: {}, challenges: {} });
  }, [state]);
  useEffect(() => {
    if (screen.name !== 'home') { localStorage.setItem(SESSION_KEY, JSON.stringify(screen)); setSavedSession(screen); }
  }, [screen]);

  const saveProgress = useCallback((answers: AnswerMap, challenges: ChallengeMap) => {
    setScreen((current) => current.name === 'quiz' ? { ...current, answers, challenges } : current);
  }, []);

  function newQuiz() { reset(); lastRequest.current = null; localStorage.removeItem(SESSION_KEY); setSavedSession(null); setScreen({ name: 'home' }); }
  if (screen.name === 'quiz') return <QuizPlayer quiz={screen.quiz} difficulty={screen.difficulty} mock={screen.mock} attempt={screen.attempt} initialAnswers={screen.answers} initialChallenges={screen.challenges} onProgress={saveProgress} onExit={newQuiz} onSubmit={(answers, challenges) => setScreen({ name: 'results', quiz: screen.quiz, difficulty: screen.difficulty, mock: screen.mock, answers, challenges, attempt: screen.attempt })} />;
  if (screen.name === 'results') return <QuizResults quiz={screen.quiz} answers={screen.answers} challenges={screen.challenges} onNew={newQuiz} onRetry={() => setScreen({ name: 'quiz', quiz: makeRetryQuiz(screen.quiz, screen.answers, screen.challenges), difficulty: screen.difficulty, mock: screen.mock, answers: {}, challenges: {}, attempt: screen.attempt + 1 })} />;

  return <div className="app-shell">
    <header className="site-header"><a className="brand" href="#top" aria-label="QuizForge home"><span><BrainCircuit size={21} /></span>QuizForge</a><span className="header-pill"><ShieldCheck size={15} /> Built for focused practice</span></header>
    <main id="top" className="home-main">
      <section className="hero"><span className="hero-kicker"><span /> AI-powered study practice</span><h1>Turn your notes into<br /><em>knowledge that sticks.</em></h1><p>Paste anything you’re learning. QuizForge shapes it into a focused quiz, explains every answer, and helps you revisit what you missed.</p></section>
      {savedSession && <section className="resume-banner"><History size={21} /><div><strong>{savedSession.name === 'results' ? 'Your latest results are saved' : 'Continue where you left off'}</strong><p>{savedSession.quiz.title} · {savedSession.quiz.questions.length} questions</p></div><button className="secondary-button" onClick={() => setScreen(savedSession)}>Continue</button><button className="discard-button" aria-label="Discard saved quiz" onClick={() => { localStorage.removeItem(SESSION_KEY); setSavedSession(null); }}><X size={17} /></button></section>}
      {state.status === 'loading' ? <section className="generator-card loading-card" aria-live="polite" aria-busy="true"><button className="cancel-button" onClick={cancel} aria-label="Cancel generation"><X size={19} /></button><div className="loader-orbit"><BrainCircuit size={28} /><span /></div><h2>Crafting your quiz…</h2><p>{state.slow ? 'This is taking longer than usual, but we’re still working.' : 'Reading your notes and building useful questions.'}</p><div className="skeleton-lines"><span /><span /><span /></div><button className="text-button" onClick={cancel}>Cancel</button></section> : <QuizForm onSubmit={requestQuiz} initialRequest={lastRequest.current} />}
      {state.status === 'error' && <section className="error-banner" role="alert"><TriangleAlert size={21} /><div><strong>We couldn’t create that quiz.</strong><p>{state.message} Your notes are still safe.</p></div><button className="secondary-button" onClick={() => lastRequest.current && generate(lastRequest.current)}><TimerReset size={16} /> Retry</button></section>}
      {state.status === 'success' && state.mock && <p className="mock-note">Demo mode: this quiz used a local sample response.</p>}
      <section className="trust-row" aria-label="Product benefits"><div><span>01</span><strong>Built from your notes</strong><p>Questions stay focused on the material you provide.</p></div><div><span>02</span><strong>Learn from mistakes</strong><p>Clear explanations turn wrong answers into progress.</p></div><div><span>03</span><strong>Practice with purpose</strong><p>Retry only what you missed—not the entire quiz.</p></div></section>
    </main>
    <footer><span>QuizForge</span><p>Study smarter, one question at a time.</p></footer>
  </div>;
}
