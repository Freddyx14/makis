# Makis — Technical Implementation Guide

### Next.js laboratory API bridge — 2026-09-12

`app/laboratorio/page.tsx` renders the client campaign cockpit.
`app/api/lab/[...path]/route.ts` proxies allowlisted session/login/campaign routes
to server-only `LAB_API_URL`. It forwards the signed HTTP-only laboratory cookie,
checks mutation origins, limits request size and returns JSON without forwarding
the legacy page CSP. Without a configured password it rejects non-local hosts.
Use a trusted HTTPS deployment and the same password configuration in both apps.
The existing teammate Workspace contracts and Supabase APIs are not modified.

`GET /api/campaigns/{id}/workflow` returns private persisted state with `version`.
`POST` on that route accepts `{action, expected_version, ...actionFields}`;
Pydantic rejects extra/invalid fields, and the server checks ownership, brief
approval, prerequisites, active jobs and optimistic concurrency. Research,
strategies, fusion, content, regeneration, landing draft and report run as jobs;
the existing detail endpoint exposes jobs and agent traces. Other mutations are
transactional. Stage state is stored in additive `lab_state` rows in SQLite.

The single-process lifespan task checks approved scheduled non-email pieces every
60 seconds. It records mock executions only, including stable campaign/piece/version
idempotency keys and copied payloads; manual execution uses the same contract.
Executed pieces cannot be edited/regenerated. Brief mutation is blocked after
research to avoid stale downstream state. Simulator/manual rows are labeled by
origin, and manual input replaces only manual/simulated rows for its channels.

`META_MCP_URL` and `META_ACCESS_TOKEN` in `.env.example` are reserved server-only
values; no MCP discovery, Meta calls or token storage UI is active. Do not pass a
token to an unknown MCP server. Obtain the teammate's verified server URL, auth
contract, tool list and scopes before implementing that adapter.
See [README coverage](README.md#current-coverage-and-limits) for remaining gaps.

## CopilotKit + Google Workspace MCP Integration

This guide provides starter code snippets and architecture blueprints for **Team Maki Acevichado** (Joel, Diego, Milu, Freddy).

---

## 1. CopilotKit Setup (Targeting Partner Prize: AirPods Max)

CopilotKit embeds the AI agent directly into your React application state so the agent has full situational awareness without being trapped in a chatbot.

### Installation
```bash
npm install @copilotkit/react-core @copilotkit/react-ui
```

### Wrapping the Application (`App.tsx`)
```tsx
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";

export function App() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      <div className="flex h-screen bg-[#0a0b0f] text-white">
        {/* Your 5-Pillar Executive Cockpit */}
        <main className="flex-1 overflow-y-auto p-6">
          <ExecutiveCockpit />
        </main>

        {/* Ambient In-App Assistant Drawer */}
        <CopilotSidebar
          defaultOpen={false}
          instructions="You are Makis, the AI Chief of Staff. You monitor the company's back office across Google Workspace."
          labels={{
            title: "Makis Chief of Staff",
            initial: "Good morning. I am monitoring your company's Gmail, Calendar, Drive, and Sheets. How can I assist?",
          }}
        />
      </div>
    </CopilotKit>
  );
}
```

### Making Company State Readable to the Agent (`useCopilotReadable`)
```tsx
import { useCopilotReadable } from "@copilotkit/react-core";

export function ExecutiveCockpit() {
  const companyMetrics = {
    cashOnHand: 48200,
    cashRunwayMonths: 5.2,
    overdueInvoices: [
      { client: "Client B", amount: 2400, daysOverdue: 12 }
    ],
    meetingsToday: [
      { title: "Discovery Call: Acme Corp", time: "14:00", platform: "Google Meet" }
    ],
    pendingCommitments: [
      { client: "Client B", promise: "Send revised proposal deck", promisedDaysAgo: 3 }
    ]
  };

  // The agent instantly knows all company context without prompt engineering!
  useCopilotReadable({
    description: "Real-time 5-pillar company health metrics and active commitments",
    value: companyMetrics,
  });

  return (
    <div>{/* Cockpit UI */}</div>
  );
}
```

### Giving the Agent In-App Actions (`useCopilotAction`)
```tsx
import { useCopilotAction } from "@copilotkit/react-core";

export function ActionQueue() {
  useCopilotAction({
    name: "approveInvoiceReminder",
    description: "Dispatches the pre-drafted invoice reminder email via Gmail MCP",
    parameters: [
      { name: "clientId", type: "string", description: "The client ID" },
      { name: "draftSubject", type: "string", description: "Subject line" }
    ],
    handler: async ({ clientId, draftSubject }) => {
      console.log(`Dispatched reminder for ${clientId}`);
      // Triggers Gmail MCP tool call
      return `Email sent to ${clientId} regarding ${draftSubject}`;
    },
  });

  return <div>{/* Action queue UI */}</div>;
}
```

---

## 2. Google Workspace MCP Connector Pattern

Makis interfaces with Google Workspace through standard Model Context Protocol (MCP) servers:

```typescript
// Example: MCP Client Invocation in Node/TypeScript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export async function createGmailMcpClient() {
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-gmail"]
  });

  const client = new Client({ name: "makis-core", version: "1.0.0" }, { capabilities: {} });
  await client.connect(transport);
  return client;
}

// Available standard tools:
// - gmail.list_threads({ q: "is:unread label:important" })
// - gmail.create_draft({ to, subject, body })
// - calendar.list_events({ timeMin, timeMax })
// - calendar.create_event({ summary, start, end })
// - drive.search_files({ q: "mimeType = 'application/pdf'" })
// - sheets.get_spreadsheet_values({ spreadsheetId, range: "Sheet1!A1:E20" })
```

---

## 3. Demo Seed Data Architecture (Deterministic 4-Act Pitch)

For a guaranteed 5/5 score on stage without internet hiccups, use a deterministic state container with instant fallback:

```typescript
export const demoSeedState = {
  briefing: {
    greeting: "Good morning, Freddy.",
    summary: "3 priority actions queued. Total Runway: 5.2 months. 2 meetings scheduled today.",
    metrics: {
      cashOnHand: "$48,200 USD",
      overdueTotal: "$2,400 USD",
      activeClients: 8,
      atRiskCount: 1
    }
  },
  queuedActions: [
    {
      id: "act-1",
      pillar: "finance",
      title: "Send friendly invoice reminder to Client B ($2,400 USD)",
      targetService: "Gmail",
      preview: "Subject: Seguimiento amistoso — Factura N° 1042\nHola Paulina, esperando que estés muy bien...",
      status: "queued"
    },
    {
      id: "act-2",
      pillar: "operations",
      title: "Insert 45m buffer block in Google Calendar before 14:00 meeting",
      targetService: "Google Calendar",
      preview: "Event: Deep Work & Deck Review (13:15 - 14:00)",
      status: "queued"
    },
    {
      id: "act-3",
      pillar: "gtm",
      title: "Scaffold Drive workspace & proposal doc for lead 'Acme Corp'",
      targetService: "Google Drive",
      preview: "Drive folder: Clients/acme-corp/ with Brief.gdoc and Proposal_v1.gdoc",
      status: "queued"
    }
  ]
};
```
