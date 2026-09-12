# Full offline KFC reference mockup

**Date:** 2026-09-12
**Owner:** Codex with Joel
**Area:** Campaigns

## What changed

Added a one-click, privately persisted KFC Peru reference fixture spanning five
stages, nine copy pieces, three visual placeholders, a landing draft, synthetic
executions, deterministic daily metrics and a report with low-confidence learning.

## Why it changed

Provide a fast presentation mockup without API spending or real brand actions.

## User-visible behavior

The laboratory button loads the completed report immediately; users can inspect
every stage. The `/nueva` entry form now defaults to read-only KFC mock inputs and
redirects to the exact campaign in the laboratory after creating it. Disabling
the mockup option retains real workspace creation and its original redirect.
The campaign URL parameter takes precedence over remembered selection but does
not bypass the API ownership checks.

Users can inspect
every stage. All inputs, prices, findings, approvals and outcomes are invented,
except the supplied reference URL. The site returned 403 and was not analyzed.

## Data, permissions, or external effects

The endpoint requires the existing session and creates new owned records in one
transaction. No existing campaign is changed. No search, LLM, image generation,
email sending, publication or spending occurs. The landing is not public.
Visual cards are layout placeholders with prompts, not generated photographs.
The follow-up entry-form integration is uploaded at the user's request; no
credentials or local campaign database are included.

## Verification

Offline acceptance check validates complete state, totals, mock-only executions
and absence of network calls. TypeScript and browser smoke checks run locally.

## Follow-ups or known limits

Not an official KFC campaign. Do not reuse invented prices, approval records or
results as real information. Replace visual placeholders and validate all brand
assets, offers, permissions and benchmarks before any real campaign.
