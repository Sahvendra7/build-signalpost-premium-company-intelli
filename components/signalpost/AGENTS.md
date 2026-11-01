# Signalpost screen continuity

Preserve existing routes, branding and temporary owner-approved name-only identity. Device-local imported artifacts remain authoritative; no HTTP research API exists. Never simulate execution or infer refresh lineage.

## Dashboard metric scope
Overview now uses read-only dashboardMetrics in lib/signalpost/domain.ts. Cards count loaded valid-company records/claims, not unique organisations fully researched. Anchored identity and supported-claim totals explicitly include retained records; evidence totals are records, not unique sources. Material-event empty state only describes supplied loaded events.
Import extent compares loaded envelope length with supplied report.emitted_envelopes: partial, matching, mismatch or unknown; matching counts never prove research completeness. Report-only nonzero/unknown imports keep local cards unavailable. Explicit emitted=0 permits local zero counts; reportCoverage stays unknown for zero input denominator and preserves 0/nonzero ratio.
Report unique_companies_researched is shown separately with resumed/not-started caveat. Report completion dates never fall back to first envelope. CoverageChart describes loaded valid records with any supported claim (including supported zero and retained values), NOT producer category_available_rate. StatusChart describes all loaded-envelope claims. RunHistory uses producer emitted totals, not loaded counts.
Pinned pipeline.py batch_report: input/emitted/status/category counters are row/envelope based; unique_companies_researched counts orgs with results, not research completeness; operations aggregate unique results. Preserve these denominators.

## Evidence
Dashboard receipt wdlCGS3qvZC1kKG3w0YKR / git-content:f571cd2b12c75b05 passed managed build, TypeScript, route readiness/JBOX contract. Regression cases added, not independently executed; no browser interaction certification. No storage/schema/config/Git mutations. At milestone start clean jbox ahead 4. Overview semantic graph reconciled graphReady=true.