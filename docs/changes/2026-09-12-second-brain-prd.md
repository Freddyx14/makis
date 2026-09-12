# Add Second Brain knowledge graph to the PRD

**Date:** 2026-09-12  
**Owner:** Freddy Ñañez  
**Area:** Platform

## What changed

Added the founder-facing Second Brain module: an Obsidian-like visual knowledge graph backed by linked, typed Markdown artifacts.

## Why it changed

Founders need to understand how company strategy, people, clients, decisions, documents and outcomes connect, not only see isolated records or dashboards.

## User-visible behavior

The future product includes graph canvas, entity pages, context paths, knowledge inbox, hot context, and graph-health views. Every visible node links back to a canonical readable source.

## Data, permissions, or external effects

Graph traversal and ingestion respect workspace, client and role access boundaries. The graph index is derived from Markdown; it is not an independent truth store. Maintenance reports broken or orphaned nodes but never deletes them automatically.

## Verification

Markdown structure validated with `git diff --check`.

## Follow-ups or known limits

This specifies the module; no company knowledge graph, visual canvas, or ingestion pipeline has been implemented yet.
