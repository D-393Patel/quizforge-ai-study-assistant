import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { QuizForm } from '../components/QuizForm';
import { useQuizGeneration } from '../hooks/useQuizGeneration';
import type { GenerationRequest } from '../schemas/quiz';
import { loadSession } from '../utils/session';

const request: GenerationRequest = {
  notes: 'These are sufficiently detailed notes about cellular respiration and ATP production.',
  difficulty: 'medium',
  questionCount: 5,
};

function quiz(title: string) {
  return {
    title,
    questions: Array.from({ length: 5 }, (_, index) => ({
      id: `q-${index}`,
      question: `Question number ${index + 1}?`,
      options: ['First', 'Second'],
      correctIndex: 0,
      explanation: 'The first option is correct.',
    })),
  };
}

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) } as Response);
}

describe('AI reliability integration', () => {
  beforeEach(() => { localStorage.clear(); vi.restoreAllMocks(); });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it('does not let an older response overwrite the newest quiz', async () => {
    const resolvers: Array<(response: Response) => void> = [];
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((resolve) => resolvers.push(resolve))));
    const { result } = renderHook(() => useQuizGeneration());

    act(() => { void result.current.generate(request); });
    act(() => { void result.current.generate({ ...request, notes: `${request.notes} Newer request.` }); });
    await act(async () => resolvers[1](await jsonResponse({ quiz: quiz('Newest quiz'), mock: false })));
    await waitFor(() => expect(result.current.state.status).toBe('success'));
    await act(async () => resolvers[0](await jsonResponse({ quiz: quiz('Stale quiz'), mock: false })));
    expect(result.current.state.status === 'success' && result.current.state.quiz.title).toBe('Newest quiz');
  });

  it('restores notes and settings after a failed request', async () => {
    vi.stubGlobal('fetch', vi.fn(() => jsonResponse({ error: 'Provider unavailable.' }, 502)));
    render(<App />);
    const notes = screen.getByLabelText('Study notes or topic');
    fireEvent.change(notes, { target: { value: request.notes } });
    fireEvent.click(screen.getByDisplayValue('hard'));
    fireEvent.click(screen.getByDisplayValue('10'));
    fireEvent.click(screen.getByRole('button', { name: 'Create my study set' }));
    await screen.findByText('We couldn’t create that study set.');
    expect(screen.getByLabelText('Study notes or topic')).toHaveValue(request.notes);
    expect(screen.getByDisplayValue('hard')).toBeChecked();
    expect(screen.getByDisplayValue('10')).toBeChecked();
  });

  it('rejects unsupported note files without replacing notes', async () => {
    const { container } = render(<QuizForm onSubmit={vi.fn()} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['binary'], 'notes.pdf', { type: 'application/pdf' })] } });
    expect(await screen.findByText(/Use a .txt, .md, or .csv file/)).toBeVisible();
    expect(screen.getByLabelText('Study notes or topic')).toHaveValue('');
  });

  it('rejects oversized note files', async () => {
    const { container } = render(<QuizForm onSubmit={vi.fn()} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const oversized = new File([new Uint8Array(1_000_001)], 'large.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [oversized] } });
    expect(await screen.findByText(/over 1 MB/)).toBeVisible();
  });
});

describe('saved-session safety', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => cleanup());

  it('restores a valid saved quiz', () => {
    localStorage.setItem('quizforge-session-v1', JSON.stringify({ name: 'quiz', quiz: quiz('Saved quiz'), difficulty: 'hard', attempt: 1, answers: {}, challenges: {} }));
    expect(loadSession()?.quiz.title).toBe('Saved quiz');
  });

  it('discards corrupted local storage without crashing', () => {
    localStorage.setItem('quizforge-session-v1', '{not-json');
    expect(loadSession()).toBeNull();
    expect(localStorage.getItem('quizforge-session-v1')).toBeNull();
  });
});
