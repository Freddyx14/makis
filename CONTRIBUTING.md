# Contributing to Mark AI

## Documentation is part of every change

Every functional change must update the documentation in the same pull request or commit. A feature is not complete when the code works; it is complete when a future teammate can understand what changed, why it changed, and how to verify it.

### Required change record

For each meaningful change, add or update a Markdown record in `docs/changes/` using this structure:

```md
# <Short change title>

**Date:** YYYY-MM-DD  
**Owner:** Name  
**Area:** Commercial | Delivery | Finance | Legal | Campaigns | Capacity | Platform

## What changed

## Why it changed

## User-visible behavior

## Data, permissions, or external effects

## Verification

## Follow-ups or known limits
```

### What must be updated

| Change type | Required documentation update |
|---|---|
| Product behavior, UX, agent or workflow | `PRD.md` plus a record in `docs/changes/` |
| API, schema, connector or permission | `TECH_GUIDE.md` plus a record in `docs/changes/` |
| Setup, commands, environment or deployment | `README.md` plus a record in `docs/changes/` |
| Brand, naming, visual token or copy | `brand/brand-context.md` and the affected brand asset |
| Bug fix | a record in `docs/changes/` with reproduction and verification |

### Rules

- Write new documentation in English.
- State facts, limitations and unknowns. Do not document assumptions as confirmed behavior.
- Link the exact source of truth rather than copying it into several places.
- Document external side effects, approval requirements and rollback behavior.
- Do not merge a functional change with no documentation update unless it is a purely internal refactor with no behavior, contract or operational impact. State that exception in the commit body.

## Pull-request checklist

- [ ] Code and tests reflect the intended change.
- [ ] A change record exists in `docs/changes/` when required.
- [ ] PRD, technical guide, setup guide, or brand context was updated where applicable.
- [ ] Documentation is in English and links to the canonical artifact.
- [ ] External actions still require the intended human approval.
