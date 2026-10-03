# BudgetTrip AI – Smart Budget Trip Planner

A responsive, server-backed travel planning prototype. Travelers enter a route, group size, trip length, INR budget, daily travel-time limit, spending strategy, and interests. Gemini returns structured travel ideas and a day-by-day itinerary. Server code independently totals estimated expenses, checks constraints, and asks the model to revise a plan when it fails the budget or requested safety-buffer checks.

> Trip details and prices are AI-generated estimates, not live quotes, availability, reservations, or booking advice. Confirm current logistics before travel.

## Features

- Trip planning for new destinations and user-entered requirements, with a prefilled Rajkot–Udaipur example.
- Input validation and off-topic / prompt-injection guardrails before any model call.
- Seven-stage planning flow: constraint extraction, travel options, itinerary, estimated costs, independent verification, up to three re-plans, and the verified result.
- Zod structured-output validation at each model stage; no hidden reasoning is returned to the browser.
- INR cost breakdown, application-calculated total, remaining budget, and budget-utilization charts.
- Expandable daily itinerary, print-to-PDF, clipboard copy, process transparency, and an actual prompt comparison.
- Ten real evaluation scenarios with metrics computed from generated outputs; results are not pre-populated.
- In-app prompt history and technique overview. It records the actual implemented milestones without invented timestamps or performance claims.
- Gemini credentials are read only in server code. Plans are held in page state and are not persisted.

## Architecture

- **Next.js App Router / TypeScript:** public pages, UI, and REST route handlers.
- **AI SDK + Google provider:** server-only structured generation using `GEMINI_API_KEY`.
- **Zod:** validates submitted trip requirements and every structured model response.
- **`server/aiService.ts`:** staged provider calls, constraint matching, plan revisions, and evaluation / comparison calls.
- **`server/budgetValidator.ts`:** independent category summation, remaining-budget and utilization calculations, plus itinerary and strategy checks.
- **`server/prompts.ts`:** stage-specific prompts, strategy guidance, prompt-history entries, and user-facing copy.
- **Recharts:** client-side budget charts using the validated server response.

API routes:

- `POST /api/plan` — validates intent and input; returns a budget-verified plan or a safe error.
- `POST /api/compare` — runs the basic and constraint-rich prompts on the same validated input.
- `POST /api/evaluate` — runs ten fixed scenarios sequentially and reports actual results and aggregate rates.

## Prompt engineering techniques

Role prompting, prompt chaining, explicit constraints, schema-based structured output, conditional re-planning, self-refinement through budget feedback, output validation, and input guardrails. The prompt-history route documents the implemented versions. Add an entry only when a prompt change is actually made; do not add unrun scores or estimated timestamps.

## Requirements

- Node.js compatible with the installed Next.js version and pnpm.
- A Google Gemini API key with model access.

## Local setup

1. Install dependencies with the package manager recorded in `package.json`:

   ```sh
   pnpm install --frozen-lockfile
   ```

2. Copy `.env.example` to `.env.local` and replace the example value with your Gemini key. Keep `.env.local` private; it is git-ignored. In v0/Vercel, configure `GEMINI_API_KEY` as a server environment variable instead.

   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

3. Start the development server:

   ```sh
   pnpm dev
   ```

4. Open the local URL reported by Next.js. Submit the demo trip or your own trip details.

The API key must not use a `NEXT_PUBLIC_` prefix and must never be added to a browser component or committed file. If it is missing, the API returns a friendly setup message without returning a stack trace.

## Evaluation methodology

The Evaluation page starts ten actual model calls when requested. Each successful response is validated with the relevant Zod output schema. A case satisfies constraints only when its itinerary has exactly the requested number of consecutive days, daily travel time stays within the input limit, and the independently calculated total does not exceed the budget. JSON validity rate is schema-valid generated outputs divided by all cases; constraint satisfaction rate is cases passing all stated checks divided by all cases. Failed and unavailable cases remain visible in the results. Evaluation can take a while and may be affected by provider quotas or model availability.

The prompt comparison runs a basic and a constraint-rich prompt against the same trip input. Its checks are computed from the returned outputs, not from hardcoded scores.

## Testing

- `pnpm exec tsc --noEmit` — TypeScript validation.
- `pnpm build` — production build.
- Submit empty or out-of-range values and confirm validation prevents a model request.
- Use the demo trip to inspect the staged plan, verification, chart, expandable days, copy / print, and prompt comparison.
- Run Evaluation to verify the live test-case output and measured rates.

## Deployment

Import the repository into Vercel, set `GEMINI_API_KEY` in the project’s server environment variables, and deploy. Do not expose the key as a public variable. Evaluation invokes ten real model requests sequentially and may require provider quota appropriate for a demo.

## Hackathon checklist

- [x] Working trip-planning interface and server API
- [x] Real Gemini API integration with a server-only key
- [x] Prompt chain, Zod structured outputs, and code-based budget verification
- [x] Automatic re-planning with a three-attempt ceiling
- [x] Input validation and off-topic guardrails
- [x] Ten live evaluation scenarios and metrics calculated from their results
- [x] Prompt comparison, in-app prompt history, and technique overview
- [x] Responsive itinerary and budget charts
- [x] Demo trip, print / PDF, and clipboard export
- [x] No fabricated plans, timestamps, or evaluation scores

## Notes

The planner does not persist user input, fetch live fares, or make reservations. Currency is INR. Evaluation scenarios include very restrictive budgets to exercise failure and re-planning behavior; not every constraint set is necessarily feasible.
