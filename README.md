# Signalpost

An evidence-first company-intelligence workspace for Norwegian-company research. Built with Next.js 16, React 19, TypeScript 5 and Tailwind 4. The application opens on the Overview, not a marketing page.

## Setup

Use Node.js 22 or newer and pnpm 10.16.1. Install with `pnpm install --frozen-lockfile`, then run `pnpm dev`. For a standalone production deployment run `pnpm build` followed by `pnpm start`. JBOX manages its own production preview; do not start a second server there. No environment variables, API keys or Supabase connection are required for the local artifact-import mode.

Routes: `/`, `/companies`, `/companies/[organisationNumber]`, `/evidence`, `/changes`, `/compare`, `/runs`, `/runs/[runId]`, `/settings`. The internal `/design-system` displays the delivered identity, typography, tokens and product components.

## Connection strategy: read-only CLI artifacts

The Python agent is unchanged and pinned to [ff3b5152221be3e39c6f6532f47ebf6f61442336](https://github.com/Sahvendra7/signalpost-agent/tree/ff3b5152221be3e39c6f6532f47ebf6f61442336). Its competition batch runner is a CLI, not an HTTP API. Run this in your Python-agent environment:

```bash
uv run python scripts/run_competition_batch.py --organisations <BATCH.jsonl> --output out/envelopes.jsonl --profiles-output out/profiles.jsonl --report out/report.json --snapshot-dir out/snapshots --run-id <RUN_ID>
```

In Signalpost Settings, choose the output files from one run, validate, review the run ID/counts/warnings, and explicitly select **Import and select this run**. Optional profiles require confirmation that they accompany that run because profiles have no inherent run ID. Envelopes alone are sufficient for company results; report-only imports are useful for telemetry but cannot create companies. Decompress gzip files before importing. Combined input size is limited to 25 MB.

Imports are staged before a single atomic browser save. Invalid JSONL identifies its line; malformed records, unsafe URLs, broken evidence references, mixed run IDs, duplicate organisations and duplicate saved run IDs are rejected. Validation failures do not replace active results. Partial report/envelope counts generate warnings and remain separate; the importer does not rewrite the report. Structure validation cannot independently verify the truth of producer claims.

## Data contract and architecture

- `lib/signalpost/domain.ts`: typed Company/Envelope, Claim, Evidence, Change, ResearchRun, Report and Profile concepts; metrics, period compatibility and read-service selectors.
- `lib/signalpost/import.ts`: runtime contract validation, JSONL parsing and staged import. Competition envelopes contain `organisation_number`, `run`, `claims`, `evidence`, `changes`, `errors` and `operations`. The different internal batch wrapper is rejected.
- `lib/signalpost/storage.ts`: versioned IndexedDB workspace, atomic saves and duplicate-run protection.
- `lib/signalpost/fixtures.ts`: explicitly fictitious demo companies and a downloadable synthetic import example, isolated from imported research.
- `components/signalpost/`: reusable navigation, statuses, facts, charts, evidence drawer and independently composed application areas.
- `tests/`: focused Node tests and pinned producer samples used only for adapter validation, not shipped as researched portfolio data.

Claims keep the six literal availability states: `available`, `not_available`, `blocked`, `not_applicable`, `ambiguous`, `failed`. `unverified` is not a seventh claim state. Changes preserve the producer taxonomy `added`, `removed`, `changed`, `unverified`, `unavailable`; an unavailable source does not prove removal. Carried-forward values retain their original evidence dates. Evidence IDs are joined only within their envelope. Companion profiles remain opaque context and never generate new company claims.

Summary statements render the supplied producer text and identifiers; missing summaries are not synthesized. Financial comparisons align period boundaries, account type, currency and supplied units. Unknown metadata produces separate observations rather than a silent comparison. Zero, false and empty arrays are not missing values. Missing report telemetry says Not available; coverage requires an actual denominator.

## Persistence and security boundaries

Runs, selected mode, directory filters, recent views and comparison selection are stored in IndexedDB on this browser/device only. Reloading the same origin preserves them. Clearing browser/site data deletes local workspace copies; retain original CLI files for recovery. There is no cross-device synchronization, server database or multi-user access control in this mode. Browser storage restrictions/quota failures show a retryable error and preserve the previous committed dataset.

Demo mode is visibly labeled and uses fictional organisations, reserved illustrative URLs, synthetic spans and fixture hashes. Imported synthetic fixtures remain labeled synthetic. Imported and disconnected modes never silently fall back to demo results.

Source content is escaped text, not injected HTML. External links permit HTTP(S) without credentials and use safe new-tab attributes. Snapshot filesystem references and raw input records are excluded from the display model; no browser filesystem access, arbitrary URL proxy or public snapshot download is provided. Never store API keys in IndexedDB/localStorage or expose private environment variables in client bundles.

## Future HTTP adapter

`SignalpostReadService` supplies all views from one selected run. `ExecutionService` defines future `submitBatch`, `getRunStatus` and `refreshCompany` operations; capability flags currently mark them unavailable. The unavailable implementation rejects rather than pretending to execute. No simulated progress is shown.

A separately hosted integration layer can call the unchanged CLI server-side, validate and serve its artifacts, add authenticated job ownership and durable storage, and expose authorized captured-source retrieval using opaque IDs. It must preserve evaluator/research semantics, keep provider secrets server-side, restrict process arguments, and never expose arbitrary filesystem paths. No such HTTP adapter or live execution backend is connected in this delivery.

## Checks

```bash
node --test tests/signalpost.test.cjs
pnpm exec tsc --noEmit
```

The test suite covers pinned producer mapping, all availability/change states, provenance joins, unsafe links, malformed fields, zero versus unknown, report denominators, financial compatibility, retained-source semantics, comparison limits/display-derived copy, unsupported execution, and IndexedDB commit/reload behavior using fake-indexeddb. These automated logic/repository checks are not a claim of a real browser end-to-end test or live Python execution. JBOX's managed preview supplies separate production build/start and platform route checks.

## Limitations

Read-only imported research, single-device persistence, and data-dependent telemetry. Live batch execution, refresh, authenticated snapshots and shared cloud workspaces require a separately deployed backend. Source links in demo fixtures are illustrative, not official research evidence. This application does not independently certify the agent's facts or provider availability.
