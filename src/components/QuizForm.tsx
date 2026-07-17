import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { ArrowRight, BookOpen, ChevronDown, FileText, ListChecks, ShieldCheck, Sparkles, Upload, X } from 'lucide-react';
import type { GenerationRequest } from '../schemas/quiz';

export type StudyMode = 'flashcards' | 'quiz';

const EXAMPLE = `Photosynthesis converts light energy into chemical energy in plants. It occurs mainly in chloroplasts. During the light-dependent reactions, chlorophyll absorbs sunlight and produces ATP and NADPH. The Calvin cycle uses carbon dioxide, ATP, and NADPH to create sugars. Oxygen is released when water molecules are split.`;

type Props = { onSubmit: (request: GenerationRequest, studyMode: StudyMode) => void; disabled?: boolean; initialRequest?: GenerationRequest | null; initialMode?: StudyMode };

export function QuizForm({ onSubmit, disabled, initialRequest, initialMode = 'flashcards' }: Props) {
  const [notes, setNotes] = useState(initialRequest?.notes ?? '');
  const [difficulty, setDifficulty] = useState<GenerationRequest['difficulty']>(initialRequest?.difficulty ?? 'medium');
  const [questionCount, setQuestionCount] = useState<5 | 10 | 15>(initialRequest?.questionCount ?? 5);
  const [studyMode, setStudyMode] = useState<StudyMode>(initialMode);
  const [debugFailure, setDebugFailure] = useState<GenerationRequest['debugFailure']>(undefined);
  const [showEvaluatorTools, setShowEvaluatorTools] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [touched, setTouched] = useState(false);
  const trimmedLength = notes.trim().length;
  const error = touched && trimmedLength < 20 ? 'Add at least 20 characters so the AI has enough context.' : '';

  function submit(event: FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (trimmedLength < 20 || trimmedLength > 12_000) return;
    onSubmit({ notes: notes.trim(), difficulty, questionCount, debugFailure }, studyMode);
  }

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setFileError('');
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !['txt', 'md', 'csv'].includes(extension)) { setFileError('Use a .txt, .md, or .csv file. Paste text from PDF or Word files for now.'); return; }
    if (file.size > 1_000_000) { setFileError('That file is over 1 MB. Upload a smaller file or paste the relevant section.'); return; }
    try {
      const content = (await file.text()).trim();
      if (!content) { setFileError('That file is empty. Choose a file containing study notes.'); return; }
      if (content.length > 12_000) { setFileError('That file contains more than 12,000 characters. Shorten it before uploading.'); return; }
      setNotes(content); setFileName(file.name); setTouched(false);
    } catch { setFileError('We could not read that file. Try another file or paste the notes.'); }
  }

  return <form className="generator-card" onSubmit={submit} noValidate>
    <div className="form-heading">
      <div><span className="eyebrow">Your study material</span><h2>What are you learning?</h2></div>
      <button className="text-button" type="button" onClick={() => { setNotes(EXAMPLE); setTouched(false); }} disabled={disabled}>Use an example</button>
    </div>
    <div className="import-row">
      <input ref={fileInputRef} className="sr-only" type="file" accept=".txt,.md,.csv,text/plain,text/markdown,text/csv" onChange={importFile} disabled={disabled} />
      {fileName ? <div className="imported-file"><FileText size={16} /><span><strong>{fileName}</strong>Imported into your notes</span><button type="button" aria-label="Remove imported notes" onClick={() => { setNotes(''); setFileName(''); setFileError(''); }}><X size={15} /></button></div> : <button className="upload-button" type="button" onClick={() => fileInputRef.current?.click()} disabled={disabled}><Upload size={16} /><span><strong>Upload notes</strong><small>TXT, MD, or CSV · up to 1 MB</small></span></button>}
      <span className="import-divider">or paste below</span>
    </div>
    {fileError && <p className="file-error" role="alert">{fileError}</p>}
    <label className="sr-only" htmlFor="notes">Study notes or topic</label>
    <textarea id="notes" value={notes} disabled={disabled} maxLength={12_000} aria-describedby="notes-help notes-error" aria-invalid={Boolean(error)} onBlur={() => setTouched(true)} onChange={(event) => setNotes(event.target.value)} placeholder="Paste class notes, a textbook summary, or describe a topic…" />
    <div className="field-meta"><span id="notes-error" className="field-error" role="alert">{error}</span><span id="notes-help">{notes.length.toLocaleString()} / 12,000</span></div>
    <div className="controls-row">
      <fieldset><legend>Difficulty</legend><div className="segmented">{(['easy', 'medium', 'hard'] as const).map((level) => <label key={level}><input type="radio" name="difficulty" value={level} checked={difficulty === level} onChange={() => setDifficulty(level)} disabled={disabled} /><span>{level}</span></label>)}</div></fieldset>
      <fieldset><legend>Questions</legend><div className="segmented">{([5, 10, 15] as const).map((count) => <label key={count}><input type="radio" name="count" value={count} checked={questionCount === count} onChange={() => setQuestionCount(count)} disabled={disabled} /><span>{count}</span></label>)}</div></fieldset>
    </div>
    <fieldset className="study-mode">
      <legend>How would you like to begin?</legend>
      <div className="mode-options">
        <label className={studyMode === 'flashcards' ? 'selected' : ''}>
          <input type="radio" name="study-mode" value="flashcards" checked={studyMode === 'flashcards'} onChange={() => setStudyMode('flashcards')} disabled={disabled} />
          <BookOpen size={19} /><span><strong>Flashcards first</strong><small>Review concepts, then take the quiz</small></span>
        </label>
        <label className={studyMode === 'quiz' ? 'selected' : ''}>
          <input type="radio" name="study-mode" value="quiz" checked={studyMode === 'quiz'} onChange={() => setStudyMode('quiz')} disabled={disabled} />
          <ListChecks size={19} /><span><strong>Start with quiz</strong><small>Jump directly into questions</small></span>
        </label>
      </div>
    </fieldset>
    {import.meta.env.DEV && <div className="evaluator-tools">
      <button className="evaluator-toggle" type="button" aria-expanded={showEvaluatorTools} onClick={() => setShowEvaluatorTools((visible) => !visible)}><ShieldCheck size={15} /> Test reliability <ChevronDown className={showEvaluatorTools ? 'open' : ''} size={15} /></button>
      {showEvaluatorTools && <label className="failure-control"><span><strong>Evaluator tools</strong>Simulate an unreliable AI response</span>
        <select value={debugFailure ?? ''} onChange={(event) => setDebugFailure((event.target.value || undefined) as GenerationRequest['debugFailure'])} disabled={disabled}>
          <option value="">Off — use real AI</option><option value="malformed">Malformed AI output</option><option value="empty">Empty AI output</option><option value="timeout">Provider timeout</option><option value="server">Server failure</option>
        </select><small>Development only. Production builds always use the configured AI provider.</small>
      </label>}
    </div>}
    <button className="primary-button generate-button" disabled={disabled} type="submit"><Sparkles size={18} aria-hidden /> Create my study set <ArrowRight size={18} aria-hidden /></button>
    <p className="privacy-note">One AI request creates both flashcards and a quiz. You can switch between them anytime.</p>
  </form>;
}
