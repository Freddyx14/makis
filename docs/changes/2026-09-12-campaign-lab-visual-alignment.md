# Campaign laboratory visual alignment

**Date:** 2026-09-12
**Owner:** Codex with Joel
**Area:** Campaigns | Platform

## What changed

Restyled the Next.js campaign laboratory to share the public Mark AI landing's
typography, white canvas, peach field and orange action treatment. Removed the
persistent sidebar, repeated campaign statistics and technical breadcrumb.

## Why it changed

The laboratory should feel like one product rather than a separate dashboard.

## User-visible behavior

The five-stage pipeline remains the primary navigation. Campaign selection stays
available in one compact control. Campaign data, approvals, content, reports and
expandable traces remain available; the surface has fewer competing controls.

## Data, permissions, or external effects

Visual-only change. No API contract, persistence, external call or permission
changes.

## Verification

TypeScript no-emit and 13 offline tests pass. Desktop visual inspection was run
at 1440px and responsive styles retain the single-column mobile layout.

## Follow-ups or known limits

The public and laboratory routes remain separately composed. Future shared
header/navigation work should use common components rather than duplicating
route-local markup.
