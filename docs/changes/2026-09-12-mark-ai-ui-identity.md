# Apply Mark AI identity to the initial UI

**Date:** 2026-09-12  
**Owner:** Freddy Ñañez  
**Area:** Platform

## What changed

Applied the Mark AI orange-and-white visual system to the existing Next.js landing page, workspace onboarding, and workspace cockpit. Added the approved Mark AI lockup as a public asset and reusable React component.

## Why it changed

The shipped UI still presented the previous Makis campaign-lab identity, which conflicted with the Mark AI product definition and brandbook.

## User-visible behavior

- The application identifies itself as Mark AI.
- Landing and onboarding use English product language and the founder operating-environment proposition.
- The landing explains the connected agency departments, human approval, Founder Council, focus mode, and operating memory.
- The cockpit uses the Mark AI white surface, Cinder Ink text, and orange action signal.

## Data, permissions, or external effects

No API, schema, permission, or external-action behavior changed. This is a visual and copy-only change.

## Verification

`npm run typecheck` passes.

## Follow-ups or known limits

The underlying pipeline names and behavior still reflect the inherited campaign prototype. A later functional change must align these data contracts with the Mark AI PRD.
