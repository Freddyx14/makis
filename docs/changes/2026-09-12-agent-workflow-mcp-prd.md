# Add agent, skill, hook, workflow and MCP contracts to the PRD

**Date:** 2026-09-12  
**Owner:** Freddy Ñañez  
**Area:** Platform

## What changed

Documented the implementation contracts for agent roles, skills, hooks, workflows, and MCP/connectors in the Mark AI PRD.

## Why it changed

The implementation needs bounded, auditable behavior before agents and external integrations are built.

## User-visible behavior

Future product behavior is defined around explicit proposals, approvals, evidence, client boundaries, and resumable workflows rather than opaque autonomous agents.

## Data, permissions, or external effects

The PRD defines least-privilege connector access and explicit approval gates for writes, publishing, spending, sending, signing, or sharing. No connector or credential was configured.

## Verification

Markdown structure validated with `git diff --check`.

## Follow-ups or known limits

These are implementation contracts only. The current codebase does not yet contain the full skills, hooks, workflows, MCP adapters, or Gemini integration.
