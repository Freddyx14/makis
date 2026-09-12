# Next.js campaign laboratory

**Date:** 2026-09-12  
**Owner:** Codex with Joel  
**Area:** Campaigns | Platform

## What changed

Added an isolated five-stage Next.js campaign cockpit, typed API bridge and
additive SQLite workflow state. Retained FastAPI stage-1 behavior/data and the
teammate's Supabase workspace without changing shared Workspace contracts.

## Why it changed

Use the team's Next.js frontend while making the newly added campaign Markdown
specifications inspectable in a demo rather than replacing teammate work.

## User-visible behavior

Brief review, five-axis research, parallel strategy debate, selection/fusion,
reviewed copy batches, landing drafts, explicit per-piece approval, scheduled or
immediate mock execution, daily metrics, manual overrides and report iterations.
Examples and simulated results are labeled. Once research exists the source brief
cannot change; a new campaign is needed to prevent invalid downstream artifacts.

## Data, permissions, or external effects

Private signed-session ownership, expected-version writes and transaction guards.
An additive lab_state table preserves existing campaign records. Default demo
does not call external services. Real configuration sends context to the chosen
compatible LLM and queries to Exa, within reserved campaign search-call limits.
Scheduling is mock-only and active only while the one-worker API is running.
Email is blocked. Meta credentials are placeholders, not an active connection.
No commit/push, real publish, spend, or email send is performed by this change.
The pre-existing local architecture document modification is preserved.

## Verification

12 offline unittest checks pass, covering stage 1 and the complete five-stage demo,
manual replacement, ownership isolation, version conflicts, required approvals,
idempotency and scheduler approval gates. TypeScript noEmit check passes.
`next build` passes when run without a concurrent dev server. The Playwright
workflow passes through all five stages, including reload persistence, and
verifies a 390px mobile viewport without horizontal overflow. Screenshots were
visually inspected. An initial parallel build/dev run collided in `.next`; rerun
sequentially succeeded. These are local demo checks, not real provider validation.

## Follow-ups or known limits

See [README](../../README.md#current-coverage-and-limits) for exact coverage.
No three-signal competitor matching, price/pixel scrape, bitmap image adapter,
public landing/lead capture, Resend, social OAuth/Meta MCP, piece-level analytics
or Chart.js yet. Demo rules do not apply natural-language edits semantically.
The laboratory and teammate workspace are separate persistence/workflow systems;
unifying their contracts and authentication requires a later coordinated change.
The npm dependency audit reports 8 moderate and 2 high findings; dependencies
were not upgraded with a potentially breaking blanket audit fix.
