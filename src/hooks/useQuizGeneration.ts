import { useCallback, useEffect, useRef, useState } from 'react';
import { generateQuiz } from '../services/quizApi';
import type { GenerationRequest, Quiz } from '../schemas/quiz';

type State =
  | { status: 'idle' }
  | { status: 'loading'; slow: boolean }
  | { status: 'success'; quiz: Quiz; mock: boolean }
  | { status: 'error'; message: string };

export function useQuizGeneration() {
  const [state, setState] = useState<State>({ status: 'idle' });
  const controllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const cancel = useCallback(() => {
    requestIdRef.current += 1;
    controllerRef.current?.abort();
    controllerRef.current = null;
    setState({ status: 'idle' });
  }, []);

  const generate = useCallback(async (input: GenerationRequest) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const requestId = ++requestIdRef.current;
    setState({ status: 'loading', slow: false });
    const slowTimer = window.setTimeout(() => {
      if (requestId === requestIdRef.current) setState((current) => current.status === 'loading' ? { ...current, slow: true } : current);
    }, 6_000);

    try {
      const result = await generateQuiz(input, controller.signal);
      if (requestId === requestIdRef.current) setState({ status: 'success', ...result });
    } catch (error) {
      if (controller.signal.aborted || requestId !== requestIdRef.current) return;
      setState({ status: 'error', message: error instanceof Error ? error.message : 'Something went wrong. Please try again.' });
    } finally {
      window.clearTimeout(slowTimer);
      if (requestId === requestIdRef.current) controllerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => setState({ status: 'idle' }), []);
  useEffect(() => () => controllerRef.current?.abort(), []);
  return { state, generate, cancel, reset };
}
