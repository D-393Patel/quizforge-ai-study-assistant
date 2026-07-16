# QuizForge

QuizForge turns free-form study notes into a validated, interactive multiple-choice quiz. It is built around the less glamorous—but most important—part of an AI feature: treating model output as untrusted data and failing without losing the user's work.

## Features

- Real Gemini integration through a server-only API route
- Strict Zod validation on both request and response boundaries
- Interactive quiz navigation, scoring, explanations, and retry-only-missed flow
- Challenge questionable AI output and exclude it transparently from scoring
- Validated local session recovery and keyboard shortcuts (`1–4`, arrow keys)
- Development-only failure simulator for malformed, empty, timed-out, and failed responses
- Visible generation summary showing question count, difficulty, and validation status
- Explicit loading, slow, empty, validation, network, timeout, rate-limit, and provider-error states
- `AbortController` plus monotonically increasing request IDs so stale responses cannot win
- Responsive, keyboard-accessible interface with visible focus and screen-reader status messages
- Opt-in mock mode for evaluators without an API key
- Automated tests for invalid AI shapes, malformed JSON, scoring, and retries

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
cp .env.example .env
npm start
```

Open [http://localhost:3000](http://localhost:3000).

Add a Gemini API key to `.env` for real generation:

```env
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
```

To evaluate the complete UI without a key, set `MOCK_AI=true`. Mock mode is explicitly labelled and never silently replaces an unsuccessful model call.

## Commands

```bash
npm start       # client and API development server
npm run build   # type-check and create the production bundle
npm test        # run the test suite once
npm run dev     # start with server file watching
```

## Deploy on Render

The included `render.yaml` defines the web service, build command, health check, production environment, and Gemini model. Connect the repository to Render using **New → Blueprint**, then provide `GEMINI_API_KEY` in the Render dashboard. The key is marked `sync: false` and is never stored in the repository.

After deployment, add the public URL near the top of this README and test one real generation from the deployed application.

## Demo and interview

The [interview guide](docs/INTERVIEW_GUIDE.md) contains a 90-second recording script, architecture diagram, explanations for the main reliability decisions, and likely live-coding changes.

## Architecture and reliability

The browser posts notes and quiz settings to `POST /api/generate-quiz`. The Express server validates the request, calls Gemini with JSON-schema response mode and a 60-second timeout, safely removes an optional JSON code fence, parses the response, and validates the result with Zod. The React UI only receives trusted quiz objects.

Missing question IDs are the only semantic normalization because IDs do not affect answer correctness. The app refuses to guess missing answers, repair invalid indexes, or alter option content. Malformed, empty, or structurally invalid responses become retryable errors.

On the client, starting a request aborts the previous fetch. Every request also receives an increasing local ID; state is updated only if the completed request is still the newest. The ID check provides protection even if a transport or test double ignores abort signals.

The notes are marked as untrusted study material in the system prompt, and the model is instructed not to follow embedded instructions. API keys never reach the browser. Model text is rendered as normal React text, not HTML.

## Testing failure cases

The test suite covers malformed JSON, empty responses, incorrect answer indexes, duplicate options and IDs, safe ID normalization, scoring, and creation of a retry quiz without mutating the original.

For a manual timeout check, use browser network throttling or pause the API request and confirm the slow-state copy appears after six seconds. Starting another generation cancels the previous request; late responses are ignored.

## AI usage note

I used OpenAI Codex to help plan and implement the initial architecture, failure cases, UI, and test coverage. The code is intentionally kept direct and documented so every reliability decision can be reviewed and explained during an interview. All generated work should be manually reviewed and understood before submission.

## Known limitations

- Model-generated questions can still contain factual mistakes despite structural validation.
- Input is limited to 12,000 characters and quizzes to 15 questions; there is no chunking for long documents.
- Progress is not persisted across devices or browser refreshes.
- Rate limits and availability depend on the configured Gemini account and model.
- The mock fixture is based on photosynthesis and is intended only for interface evaluation.

## Time spent

Initial implementation: approximately 7.5 hours, including product planning, frontend, AI boundary, responsive styling, tests, and documentation. Replace this line with the submitter's actual tracked time before submission.

## Next steps

With more time, I would add browser-session persistence, integration tests against a fake HTTP server for overlapping requests, and an optional flashcard view. Streaming is deliberately deferred because partially streamed JSON increases complexity without improving the assignment's core reliability goals.
