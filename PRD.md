# Mark AI — Product Requirements Document
## The agentic operating environment for agency founders

> **Version:** 6.4.0 · **Hackathon:** Agents, Everywhere (AI Tinkerers 2026)
> **Team:** Maki Acevichado (Joel Espinoza · Diego Celis · Miluska R. · Freddy Ñañez)
> **Stack:** FastAPI · OpenAI Agents SDK · Google Workspace MCP · Exa Search · Resend · SQLite · Chart.js

## 1. Product thesis

**Mark AI is the operating environment for a marketing-agency founder.** It brings together the context normally split across email, documents, calendars, spreadsheets and people, then presents the decision needing founder attention.

The founder starts by pasting an agency website. Mark AI builds a company workspace, connects authorized Google Workspace sources, and turns fragmented signals into a governed action queue. It does not replace judgment or autonomously take sensitive action. It prepares context, proposes the next step, and preserves a human-readable approval record.

**Markdown is the source of truth. The UI turns that truth into a clear operating surface.**

## 2. Problem

Small agencies do not lack information. They lack one view that connects information to the next decision.

| Source | Typical information | Failure today |
|---|---|---|
| Gmail | requests, invoices, commitments | follow-ups are lost |
| Calendar | meetings and deadlines | preparation and follow-through are missing |
| Drive | contracts, proposals, deliverables | context cannot be found when needed |
| Sheets | pipeline, cash and metrics | numbers do not trigger action |
| Founder memory | priorities and exceptions | the business depends on one person remembering everything |

Mark AI rests on three primitives:

1. Agencies already produce operational evidence in their website and work tools.
2. Agents can transform that evidence into structured operational state.
3. Founders retain review and approval for consequential actions.

It is neither a generic chatbot nor a standalone campaign manager. It is a contextual cockpit with focused operational modules.

## 3. Primary flow: website to operating cockpit

~~~mermaid
flowchart LR
    A["1. Paste agency URL"] --> B["2. Mark AI understands the business"]
    B --> C["3. Create workspace"]
    C --> D["4. Connect approved context"]
    D --> E["5. Prioritize signals and propose actions"]
    E --> F["6. Founder reviews, edits and approves"]
    F --> G["7. Record outcome and learn"]
    G -. feedback .-> E
~~~

### 3.1 Website-first onboarding

The first screen has one dominant field: **“Paste your agency website.”** The URL creates a first profile without a long form:

- agency name, offer and category;
- visible team, clients and markets;
- tone, public assets and calls to action;
- initial operational hypotheses.

The founder confirms or corrects the profile, then connects approved sources beginning with Google Workspace.

### 3.2 Connected context

| Source | Signals Mark AI organizes | Proposed action |
|---|---|---|
| Gmail | unanswered messages, overdue invoices, promises made | draft a follow-up |
| Calendar | upcoming meetings, unprepared sessions, commitments | prepare agenda or reserve time |
| Drive | contracts, proposals and missing documents | summarize, locate or create structure |
| Sheets | cash, sales, pipeline and operating metrics | flag a change, risk or decision |

External-impact actions such as sending email, publishing content, spending budget or creating an event require explicit founder approval.

### 3.3 Generated workspace

~~~text
workspace/<agency>/
├── account.md                   # current state, owner, blockers, next milestone
├── company/                     # company profile, strategy, goals and KPIs
├── people/                      # team members, roles, capacity and hiring context
├── operations/                  # pulse, meetings, tasks and procedures
├── clients/<slug>/account.md    # client agreement, state and next step
├── finance/                     # cash, collections, expenses and assumptions
├── legal/                       # contracts, IP and review status
├── documents/                   # proposals and key files
├── decisions.md                 # open and closed decisions with rationale
├── activity.jsonl               # chronological events and approvals
└── learnings.md                 # patterns for the next iteration
~~~

SQLite indexes artifacts, versions, sources, approvals and events. It never replaces documents; it makes the right context retrievable and explainable.

### 3.4 Company foundation: strategy, people and performance

Before Mark AI can make useful recommendations, it needs more than a website and inbox. It needs the operating facts that define how the agency intends to win, who is responsible for work, and how progress is measured.

| Canonical artifact | Contains | Used by |
|---|---|---|
| `company/profile.md` | legal and commercial name, offer, markets, ownership, operating model, systems and source links | onboarding, account view and any agent needing company context |
| `company/strategy.md` | positioning, ICP, service lines, differentiators, strategic bets and explicit non-goals | Founder Council, Commercial, Campaigns and portfolio decisions |
| `company/goals.md` | quarterly or annual outcomes, owner, due date, leading indicators and confidence | founder cockpit and weekly pulse |
| `company/kpis.md` | metric definition, source, cadence, baseline, target and latest value | Finance, Commercial, Delivery and reporting |
| `people/<slug>/profile.md` | role, responsibilities, skills, availability, capacity, manager and access boundary | Capacity, delivery assignment and hiring decisions |
| `people/roles.md` | the roles the agency needs, current owner, accountability and coverage gap | founder planning and team design |
| `people/hiring.md` | approved hiring need, rationale, budget, priority, stage and decision owner | capacity planning and Founder Council |

This is a lightweight people-and-capacity system, not an HRIS. Mark AI does not need sensitive employment records to help a founder operate. It needs only the minimum professional information required to understand responsibility, availability, capability and workload.

### 3.5 Goals, KPIs and strategy-to-work traceability

Every active initiative, client engagement and campaign should link upward to a strategic goal and, when measurable, to one or more KPIs. The system must show the chain instead of forcing the founder to infer it:

~~~mermaid
flowchart LR
    A["Strategy and non-goals"] --> B["Company goal"]
    B --> C["KPI and target"]
    C --> D["Initiative or client work"]
    D --> E["Owner, action and evidence"]
    E --> F["Outcome and learning"]
    F -. revise .-> A
~~~

| Requirement | Product behavior |
|---|---|
| Metric honesty | A KPI without a source, baseline or update date is visibly marked incomplete, not treated as a live performance claim. |
| Goal ownership | Every goal has one accountable owner, a time horizon and a next review date. |
| Leading and lagging indicators | A revenue outcome can be paired with leading indicators such as qualified opportunities, proposal conversion, delivery cycle time or collection days. |
| Capacity-aware planning | Mark AI flags a goal or client commitment when no role has capacity to own it. |
| Privacy boundary | Team profiles avoid personal or sensitive HR data. Access follows role necessity and is auditable. |
| Learning loop | A missed target produces an evidence-backed learning or decision proposal, not automatic changes to strategy. |

## 4. One platform, departments with different depth

The default view is for the founder: a simple surface to ask, decide and see the entire agency. It should not expose departmental production complexity by default.

When the founder or a functional owner needs deep work, they enter a focused department. Every department reads the same clients, documents, decisions and activity. None creates a parallel record of reality.

| Layer | Primary user | Purpose | Example |
|---|---|---|---|
| Founder cockpit | Founder | understand, prioritize and approve across the agency | “Which client, cash risk or legal decision needs me?” |
| Department module | Functional owner or founder in focus mode | execute an end-to-end workflow | Campaigns: brief, assets, review, media and results |
| Skills and agents | System | perform constrained work over authorized sources | prepare a meeting, draft a collection email, analyze performance |

### 4.1 Department map

| Department | What it governs | Initial workflows |
|---|---|---|
| Commercial | leads, discovery, proposals, pipeline and closing | research, discovery prep, proposal, follow-up and close |
| Delivery and operations | active clients, scope, milestones, meetings and blockers | open client, plan delivery, prepare meeting, handoff and close session |
| Finance and tax | cash, receivables, expenses, invoices, obligations and assumptions | cash pulse, collection, expense approval and due-date tracking |
| Legal | contracts, NDAs, IP assignments, risks and signatures | prepare draft, check agreement data and escalate legal advice |
| Marketing and campaigns | strategy, brand, content, creative, paid media and performance | client → brief → plan → production → review → approved media → results |
| Team and capacity | collaborators, owners, availability and workload | assign owner, detect overload and plan capacity |

**Campaigns is the first end-to-end module to build for the demo.** It receives a client and its context, prepares strategy and assets, coordinates creative work, executes or prepares approved media, and records results for the next iteration.

When a client is onboarded, Mark AI creates a workspace and connects accounts, documents, commitments, brand context, commercial scope and collection status. Every department then works from the same client reality.

## 5. Documentation as product

Mark AI renders documentation according to purpose. It is not a file explorer.

| Source document | UI view | Human action |
|---|---|---|
| Company or client account | entity status | update milestone, owner or blocker |
| Weekly pulse | priorities and risks | order the week |
| Client commitments | follow-up queue | approve a follow-up |
| Cash and collections | due-date cards and movement | approve reminder |
| Meetings | prepared agenda and next steps | prepare or block time |
| Key documents | search with summary and links | open, share or create |
| Decisions | question, rationale and result | confirm decision |
| Activity | timeline of changes and execution | audit action |

Approved UI changes update the related Markdown and write a new version. There are never two sources of truth.

### 5.1 Operational document contracts

| Pattern | Mark AI contract | Benefit |
|---|---|---|
| Canonical home | each client, document, decision and metric has one source location | no divergent copies |
| Account per entity | agency and every client has an `account.md` with state, owner, blocker and next milestone | cockpit answers “what is happening now?” |
| Decisions separate from tasks | `decisions.md` stores question, owner, options, impact and rationale | decisions are not mistaken for tasks |
| Activity history | `activity.jsonl` records changes, approvals and execution | explain what changed and when |
| Contracted skills | every skill declares input, output, permission and verification | repeatable flows rather than improvisation |

## 6. Product experience

1. **Website onboarding:** rapid profile and optional source connection.
2. **Founder cockpit:** contextual conversation plus a compact view of Commercial, Delivery, Finance, Legal, Marketing and Capacity.
3. **Departments and modules:** clear entrances to focused work without turning the cockpit into a technical console.
4. **Action review:** every proposal includes evidence, draft, impact and Approve / Edit / Reject controls.

The founder can ask about clients, sales, finance, tax, contracts, delivery, campaigns or team capacity. Every answer is grounded in the connected workspace and routes to an entity, document or concrete action.

### 6.1 Visible skill library

| Skill | Reads | Proposes | Requires approval |
|---|---|---|---|
| Founder pulse | accounts, Calendar, Gmail and cash | three weekly priorities | no, read-only |
| Collection follow-up | invoice, agreement and conversation | follow-up draft | yes, before sending |
| Meeting preparation | Calendar, account and documents | agenda, context and next steps | no, preparation only |
| Decision log | pulse and founder feedback | structured `decisions.md` entry | yes, before closing |
| Campaign creation | client account, brand, goals and commercial context | brief, plan and production workflow | yes, before publishing or spending |
| Contract review | agreement, proposal and approved template | draft, missing fields and flags | yes, before sending or signing |
| Cash pulse | receivables, expenses, invoices and dates | cash position, risk and next actions | no, read-only |
| Goal review | strategy, goals, KPIs, initiatives and recent activity | progress review, evidence gaps and proposed decisions | no, read-only |
| Capacity review | people profiles, roles, workload and client commitments | overload risk, ownership gap or hiring proposal | no, read-only |

### 6.2 Focus mode by client or project

| Moment | Mark AI capability | Product rule |
|---|---|---|
| Open context | load account, recent activity, commitments and key documents | read-only briefing before work |
| Work in focus | skills read only the open workspace and approved sources | one active client context prevents leakage |
| Close context | propose updates to state, activity, decisions, pending work and next milestone | nothing writes or executes without review |
| Resume | open the updated account and latest handoff | the user does not rediscover the work |

Account is the current snapshot. Activity is chronological history. Handoff is the next-session restart point.

### 6.3 Founder Council

The daily cockpit answers what to do inside a context. The Founder Council answers what deserves the founder’s time and signature across the company.

| Mode | Question | Output |
|---|---|---|
| Council | What needs my signature this week? | at most three decisions with recommendation and cost of waiting |
| Decide one | How do I close this decision? | options, evidence, recommendation and reopen condition |
| Capital | Where is the money and which expense has not earned its place? | collected, receivable, recurring spend and explicitly marked unknowns |
| Portfolio | What deserves hours and what pauses? | proposed verdict for clients, initiatives and projects |

Every proposed decision has an answerable question, one owner and date, linked evidence or declared uncertainty, two or three real options, a recommendation and reopen condition, and a cost of waiting.

Mark AI proposes. The founder decides. After approval, it records what changed and which artifacts or actions need updating. It surfaces operational contradictions before creating another task.

### 6.4 Agent roles and orchestration contract

Agents are specialized workers, not independent decision-makers. An orchestrator selects a workflow, loads only the authorized context, calls the necessary skills, and returns a structured proposal for the founder or role owner to review.

| Agent | Responsibility | Cannot do |
|---|---|---|
| Company Director | turn URL and founder confirmation into a company profile and initial workspace | invent company facts or approve its own profile |
| Chief of Staff | synthesize priorities, blockers, decisions and cross-department dependencies | execute external actions or decide company strategy |
| Commercial Agent | prepare lead research, discovery, proposal and follow-up drafts | send outreach or change deal status without approval |
| Delivery Agent | maintain client state, milestones, meetings and handoffs | move scope or promise a delivery without approval |
| Finance Agent | calculate cash, collections, expense and KPI views from authorized data | pay, file, or declare tax on behalf of the company |
| Legal Agent | prepare contract drafts and flag missing inputs or risks | provide legal advice, sign, or represent legal review |
| Campaign Agent | build brief, plan, production queue and performance synthesis | publish, spend budget or change live media without approval |
| People and Capacity Agent | identify ownership gaps, workload risks and hiring proposals | access sensitive HR records or make employment decisions |
| Documenter | write approved changes to canonical Markdown and append activity | overwrite a canonical source without an approved diff |
| Analyst | compare outcomes with goals and KPIs, then propose a learning | alter targets or strategy automatically |

### 6.5 Skill contract and required skills

Every skill is versioned and declares its input schema, allowed sources, output schema, permission level, verification step and canonical artifacts it may update. A skill cannot read another client or department by implication.

| Skill | Inputs | Output | Permission | Verification |
|---|---|---|---|---|
| `workspace-bootstrap` | URL, founder confirmation | profile, folder plan, source map | read-only | profile has evidence and declared unknowns |
| `company-foundation` | profile, founder input | company strategy, goals, KPIs, roles templates | draft only | every goal has owner and review date |
| `founder-pulse` | accounts, activity, calendar, finance | maximum three priorities | read-only | each priority links to evidence |
| `client-briefing` | one client workspace | account summary, commitments, blockers, next step | read-only | context boundary is one client |
| `client-handoff` | approved session changes | account update, activity record, handoff draft | draft only | diff is shown before write |
| `collection-follow-up` | invoice, agreement, thread | send-ready draft | propose only | amount, due date and recipient match source |
| `meeting-prep` | calendar event, account, documents | agenda and preparation pack | read-only | all cited documents are accessible |
| `goal-review` | strategy, KPI history, activity | progress review and decision proposal | read-only | missing baseline/source is marked |
| `capacity-review` | roles, availability, workload | workload risk or hiring proposal | read-only | no sensitive HR data loaded |
| `contract-draft` | approved template and deal data | legal draft with missing-field flags | draft only | template version and fields are traced |
| `campaign-runbook` | client, brand, objective, budget | brief, plan, production queue and measurement plan | draft only | budget and approval gates are explicit |
| `outcome-learning` | approved outcome and KPI delta | learning entry and proposed adjustment | propose only | observation is separated from inference |

### 6.6 Hooks and event lifecycle

Hooks keep the system current without creating hidden autonomous behavior. They respond to an event, record an activity item, update a derived view, and create a proposal only when an owner needs to decide.

| Hook | Trigger | Safe automatic work | Human-gated follow-up |
|---|---|---|---|
| `workspace.created` | agency profile is confirmed | create canonical folders and empty artifact templates | founder confirms profile and source connections |
| `client.created` | a lead becomes an active client | create client account, activity log and handoff template | approve scope, legal and billing setup |
| `source.synced` | Gmail, Calendar, Drive or Sheets sync finishes | index references and refresh derived signals | approve actions proposed from signals |
| `meeting.upcoming` | meeting enters preparation window | prepare context pack and agenda draft | owner reviews agenda or sends it |
| `invoice.overdue` | due date passes | flag risk and prepare follow-up draft | founder approves sending |
| `goal.review_due` | goal review date arrives | assemble KPI evidence and progress summary | owner decides continue, adjust or pause |
| `approval.granted` | founder approves a proposal | write approved Markdown diff and append activity | execution only if the approved action is external |
| `outcome.recorded` | approved action has result | link result to KPI and draft learning | founder accepts or rejects learning |

### 6.7 Workflow definitions

Workflows are explicit state machines. They are resumable because state, artifacts and the latest handoff live in the workspace.

| Workflow | Ordered states | Completion condition |
|---|---|---|
| Agency onboarding | URL → profile draft → founder confirmation → source connection → company foundation → first pulse | founder sees confirmed company, goals and first decision queue |
| Client lifecycle | lead → qualified → proposal → approved agreement → active delivery → closeout → archive | client account, commercial record, legal status, cash status and handoff agree |
| Campaign lifecycle | client context → brief → plan → production → review → founder approval → approved execution → results → learning | results link to the stated objective and next decision |
| Weekly founder rhythm | source sync → pulse → Council → approvals → focused work → handoff → KPI review | top decisions have owner, date and evidence |
| Hiring and capacity | capacity signal → role gap → hiring proposal → founder decision → assignment or pause | role owner and capacity impact are recorded |
| Contract workflow | deal data → draft → missing-field review → legal review if needed → founder approval → signature tracking | contract state is explicit; no signature happens through Mark AI without approval |

### 6.8 MCP and connector requirements

MCPs are adapters to authorized external tools. Mark AI uses the least privilege required for a workflow and separates read, draft and execute permissions. Connector setup is never considered proof that an action is approved.

| MCP / connector | Required capability | Minimum permission | Mark AI use | Approval gate |
|---|---|---|---|---|
| Google Gmail | search and read messages; draft email | read + drafts | commitments, collections, commercial context | sending is always explicit |
| Google Calendar | read events; draft or create event | read; write only when enabled | meeting prep, deadlines and capacity | create/update event requires approval |
| Google Drive | search, read metadata and approved documents | read; scoped write when enabled | source retrieval, document linking and workspace structure | create, move or share requires approval |
| Google Sheets | read named ranges and append approved rows | read; append only when enabled | cash, pipeline and KPI signals | write requires approval |
| Supabase | authenticated app data and realtime state | service role on server only | workspace index, approvals and application state | never expose service role to browser |
| Exa | public web research | API key on server only | website and market context | read-only |
| Gemini | structured generation and reasoning | API key on server only | profile extraction, synthesis and draft generation | output remains a proposal |
| Resend | create outbound email send request | server-only API key | approved email delivery | only after explicit approval |
| Meta Ads | read account and create paused campaign artifacts | scoped account access | approved campaign planning and execution | budget, publish and status changes require approval |

The implementation should add connectors in this order: Google read-only context → Supabase application state → Gemini structured generation → approved Gmail drafts → Drive/Calendar/Sheets scoped writes → Resend → Meta Ads. No connector is required for the deterministic demo path.

## 7. Guardrails

- Mark AI can read, summarize, prepare and recommend within authorized sources.
- It never sends email, creates events, moves files, pays, signs, publishes or deletes without explicit approval.
- Every recommendation retains a source reference.
- Incomplete or conflicting information is marked as uncertainty, never invented.
- Legal workflows prepare drafts and flags; they do not provide legal advice or replace professional review.
- Founder corrections update the learning record, not only the conversation.

## 8. Technical architecture

~~~text
mark-ai/
├── main.py                      # API and cockpit orchestration
├── agents/                      # director, chief of staff, documenter, analyst
├── integrations/                # Google Workspace MCP, Exa, Resend
├── services/                    # workspace store and action queue
├── skills/                      # versioned input/output/permission contracts
├── hooks/                       # event handlers and derived-state refresh
├── workflows/                   # resumable department state machines
├── mcp/                         # connector capability and permission adapters
├── modules/campaigns/           # end-to-end client campaign workflow
├── frontend/                    # onboarding, cockpit, review and documents
├── workspaces/
└── data/mark-ai.db              # index, events and approvals
~~~

## 9. Demo success criteria

- An agency URL creates a visible company profile and workspace in under one minute.
- The cockpit shows Gmail, Calendar, Drive and Sheets signals, or deterministic demo equivalents.
- The founder sees a prioritized action queue with evidence and context.
- The cockpit presents Commercial, Delivery, Finance, Legal, Marketing and Capacity as one connected agency.
- A client can be opened, briefed read-only and closed with proposed state, activity and handoff.
- Only one client or project is active unless the founder explicitly opens portfolio view.
- Founder Council returns at most three actionable decisions, each with evidence, recommendation, owner and cost of waiting.
- A plain-language question lands on the relevant entity, document or action.
- Client onboarding enables end-to-end Campaigns without rebuilding context.
- The founder can view company strategy, goals, KPIs, roles and available capacity without assembling them from separate tools.
- Every active goal names an owner, horizon, next review and at least one measurable or explicitly unknown indicator.
- A team or hiring recommendation is linked to a documented role, workload evidence and a founder decision.
- Human-edited and approved actions leave a trace in Markdown.

## 10. Team roles

| Team member | Responsibility |
|---|---|
| Joel Espinoza | orchestration, SQLite, analytics and learning |
| Diego Celis | FastAPI, connectors, extraction and structured context |
| Miluska R. | onboarding, founder cockpit, document rendering and human review |
| Freddy Ñañez | product architecture, operating priorities, demo and pitch |

## 11. Three-minute demo

1. **0:00–0:25.** “A founder does not need another chat. They need to know what requires a decision before opening five tools.”
2. **0:25–0:50.** Paste the agency URL, show the detected profile and confirm it.
3. **0:50–1:20.** Open the cockpit: overdue invoice, unprepared meeting and related contract.
4. **1:20–1:55.** Open a proposed action. Mark AI shows evidence, prepares a follow-up, and the founder edits and approves it.
5. **1:55–2:30.** Open Campaigns: client context becomes a brief, plan, production path and approved execution.
6. **2:30–3:00.** “Mark AI turns the agency back office into a system the founder can govern.”
