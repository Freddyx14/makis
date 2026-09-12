---
brand_name: "Mark AI"
version: "1.0.0"
date: "2026-09-12"
type: "new"
archetype:
  primary: "Sage"
  influencer: "Creator"
personality: ["clear", "warm", "operational", "exact", "calm"]
voice: ["direct but not abrupt", "knowledgeable but not condescending", "warm but not chatty"]
primary_color: "#F35B1C"
industry: "agency operating software"
---

# Brand identity: Mark AI

## Brand strategy

### Purpose

Give agency founders a clear operating environment so that distributed work becomes an informed decision, not another thing to chase.

### Vision

Every independent agency can operate with the context, rigor and leverage of a much larger company without losing human judgment.

### Mission

Mark AI connects an agency’s documents, departments and approved agents into a single operating surface for the founder and team.

### Values

| Value | Meaning | In practice |
|---|---|---|
| Context before action | A recommendation is only useful if its source is visible. | Every action links to the client, document or signal behind it. |
| Judgment stays human | Automation prepares work; people own consequential choices. | Sending, spending, signing and publishing require approval. |
| One reality | A client should not be rebuilt in every department. | Commercial, legal, finance and campaigns use connected records. |
| Useful over impressive | The interface earns attention by removing uncertainty. | Show the next decision, not decorative activity metrics. |

### Positioning

> For **agency founders** who **run clients, delivery, cash and decisions across disconnected tools**, **Mark AI** is the **agentic operating environment** that **connects every department to the next informed action** because **its agents work from the same auditable client and company context**.

### Essence, promise and mantra

- **Essence:** operational clarity
- **Brand promise:** Know what needs your decision, and why.
- **UVP:** One connected operating environment for the founder and every agency department.
- **Mantra:** Context. Decide. Move.

### Golden Circle

- **Why:** Founders should not carry the company’s context alone.
- **How:** Connect documents, departments and agents around one source of truth and human approval.
- **What:** An operating cockpit and focused modules for commercial, delivery, finance, legal, campaigns and capacity.

### Target audience

| Persona | Description | Needs | Pain points |
|---|---|---|---|
| Agency founder | Owner-operator of a growing creative, marketing or performance agency | one trustworthy view of the company and fast decisions | context spread across chats, spreadsheets and people |
| Functional lead | Responsible for campaigns, delivery or revenue | a focused workflow without losing client history | rebuilding briefs, unclear ownership and late handoffs |

### Alternatives and differentiation

| Alternative | What it does well | Where Mark AI differs |
|---|---|---|
| Generic AI chat | answers questions | operates from connected company context and routes to a real artifact or action |
| Project manager | tracks tasks | connects tasks to commercial, legal, cash and the founder’s decisions |
| CRM | manages pipeline | continues into delivery, finance, campaigns and operational memory |
| Campaign manager | runs media or content | is one focused department inside the agency operating environment |

### Brand identity prism

| Facet | Mark AI |
|---|---|
| Physique | white surfaces, orange signal, near-black text, modular M symbol, compact structured cards |
| Personality | clear, calm, capable and constructive |
| Culture | documentation, traceability, careful automation and continuous learning |
| Relationship | a Chief of Staff that prepares the work and leaves the decision with the founder |
| Reflection | a founder who has moved from reactive operator to informed owner |
| Self-image | “I know what is happening and can move the company deliberately.” |

## Visual identity

### Logo

**Primary lockup:** four rounded modules forming an abstract M, followed by the wordmark “mark ai”. Use on white or pale surfaces.

**Symbol only:** the four-module M. Use for favicon, app icon, avatar and navigation rail.

**Wordmark only:** use when the symbol has already appeared in the surrounding interface.

**Clear space:** 1× the width of one orange module on every side.

**Minimum size:** 88 px lockup and 24 px symbol on digital; 28 mm lockup and 8 mm symbol in print.

#### Logo rules

- Do not stretch, rotate or separate the modules.
- Do not recolor the orange modules individually.
- Do not add shadows, gradients, outlines or effects.
- Do not place the color lockup over a busy image.
- Do not use the lockup below its minimum size.

### Color system

Orange is used as a signal and commitment, not as a blanket background. White remains the dominant operating surface. Near-black gives long-form information the contrast it needs.

```json
{
  "colors": {
    "primary": {
      "name": "Mark Orange",
      "hex": "#F35B1C",
      "rgb": "243, 91, 28",
      "hsl": "18, 90%, 53%",
      "cmyk": "0, 63, 88, 5",
      "usage": "Primary CTA, active state, logo modules and high-value signals.",
      "tints": {"50":"#FFF3ED","100":"#FFE4D7","200":"#FFC7AE","300":"#FFAA85","400":"#FA814F","500":"#F35B1C","600":"#D9460F","700":"#B9380B","800":"#8D2D0A","900":"#5E1E08"}
    },
    "secondary": {
      "name": "Cinder Ink",
      "hex": "#1D1A17",
      "rgb": "29, 26, 23",
      "hsl": "30, 12%, 10%",
      "cmyk": "0, 10, 21, 89",
      "usage": "Primary text, dark mode surfaces and high-contrast wordmark.",
      "tints": {"50":"#F7F6F5","100":"#ECE9E6","200":"#D9D4CF","300":"#BDB5AE","400":"#968C84","500":"#706760","600":"#544C46","700":"#403A35","800":"#2B2723","900":"#1D1A17"}
    },
    "accent": {"name":"Apricot","hex":"#FFB38E","rgb":"255, 179, 142","hsl":"20, 100%, 78%","cmyk":"0, 30, 44, 0","usage":"Warm supporting surfaces and annotations only."},
    "neutral": {"white":"#FFFFFF","50":"#FAFAF9","100":"#F4F3F1","200":"#E7E5E1","300":"#D6D3D1","400":"#A8A29E","500":"#78716C","600":"#57534E","700":"#44403C","800":"#292524","900":"#1C1917","black":"#111111"},
    "semantic": {"success":"#16794A","warning":"#A85C00","error":"#B42318","info":"#2257A8"}
  }
}
```

#### Color usage and accessibility

- White and neutral surfaces: 75% or more of a product screen.
- Cinder Ink: default body copy and long-form reading.
- Mark Orange: active decisions, primary calls to action and logo only; never body copy on white.
- **Approved:** Cinder Ink on white (15.8:1, WCAG AAA); white on Cinder Ink (15.8:1, AAA); white on Mark Orange (4.6:1, AA); Cinder Ink on Apricot (10.6:1, AAA).
- **Do not use:** Mark Orange text on white for normal body text; it does not meet the body-text contrast target.

### Typography

```json
{
  "typography": {
    "heading": {"family":"Space Grotesk","fallback":"'Avenir Next', Arial, sans-serif","weights":[500,600,700],"letterSpacing":"-0.03em"},
    "body": {"family":"Avenir Next","fallback":"Arial, sans-serif","weights":[400,500,600],"letterSpacing":"0"},
    "mono": {"family":"SF Mono","fallback":"Menlo, monospace","weights":[400,600]},
    "scale": {"ratio":1.25,"base":"16px","display":"50px","h1":"40px","h2":"32px","h3":"25px","h4":"20px","body":"16px","small":"14px","caption":"12px"},
    "lineHeight": {"display":1.08,"heading":1.18,"body":1.55}
  }
}
```

- Use Space Grotesk for titles, metrics and short interface labels.
- Use Avenir Next for body copy and UI controls.
- Use monospace only for sources, IDs, dates and compact operational metadata.

### Layout, imagery and iconography

```json
{
  "spacing": {"base":"8px","scale":{"1":"4px","2":"8px","3":"12px","4":"16px","6":"24px","8":"32px","12":"48px","16":"64px","24":"96px","32":"128px"},"borderRadius":{"sm":"8px","md":"14px","lg":"24px","full":"9999px"}}
}
```

- Use a 12-column desktop grid, 24 px gutters and generous white space.
- Prefer functional diagrams, annotated screenshots and restrained geometric illustrations over stock photography.
- Icons use 24 px grid, 1.8 px rounded stroke, rounded joins and Cinder Ink or Mark Orange.
- The four-module M can become a subtle divider, loading cue or patterned background. Do not turn it into decoration without a hierarchy purpose.

## Voice and messaging

### Voice pillars

| We are | But not | In practice |
|---|---|---|
| Direct | abrupt | “Three client decisions need you today.” |
| Knowledgeable | condescending | “Here is the evidence behind this recommendation.” |
| Warm | chatty | “You can review the draft before it leaves.” |
| Precise | bureaucratic | “Invoice overdue by 12 days” rather than vague urgency. |

### Tone by context

| Context | Funny–Serious | Formal–Casual | Respectful–Irreverent | Enthusiastic–Matter-of-fact |
|---|---:|---:|---:|---:|
| Product marketing | 4 | 3 | 1 | 3 |
| In-product guidance | 4 | 4 | 1 | 3 |
| Support | 4 | 3 | 1 | 3 |
| Legal and finance | 5 | 2 | 1 | 5 |
| Error states | 5 | 3 | 1 | 4 |

### Message house

| Pillar | Key message | Proof to build |
|---|---|---|
| One operating reality | Every department starts from the same client and company context. | linked records, traceable source documents |
| Founder clarity | The cockpit reveals what needs a decision and why. | decision queue with evidence and cost of waiting |
| Human-controlled agents | Agents prepare work while humans approve meaningful external action. | approval log and action history |

### Elevator pitch

Mark AI helps agency founders run clients, cash, delivery and decisions from one connected operating environment. It turns scattered company context into a clear next action, while keeping consequential choices under human approval.

### Tagline and boilerplate

**Primary tagline:** Your agency, in context.

**Short:** Mark AI is the connected operating environment for agency founders.

**Medium:** Mark AI connects the commercial, delivery, finance, legal and campaign context of an agency. Its agents prepare the next action with evidence, while founders keep the decision and approval.

### Writing rules

- Use active voice and sentence-case headings.
- Prefer concrete quantities, dates and sources over general claims.
- Keep interface sentences under 14 words when possible.
- No exclamation marks in product UI. Emoji are not used in product UI.
- Prefer “founder” only in product positioning; use “you” in the interface.

### Vocabulary

| Always use | Instead of | Why |
|---|---|---|
| operating environment | all-in-one platform | describes the actual work surface |
| connected context | AI magic | makes the mechanism legible |
| propose / approve | autonomous execution | preserves human responsibility |
| department | silo | names a useful operating boundary |

| Never use | Why | Alternative |
|---|---|---|
| revolutionary | empty claim | name the concrete outcome |
| effortless | hides the user’s responsibility | clear, prepared, connected |
| fully autonomous | inaccurate for approvals | agent-assisted, approval-controlled |

## Applications and governance

### Architecture

Mark AI is a branded house. Departments use descriptive names: Mark AI Commercial, Delivery, Finance, Legal, Campaigns and Capacity. They do not receive independent logos or palettes.

### Core applications

- Product UI: white surface, Cinder Ink type, orange only for meaningful state and primary action.
- Founder cockpit: a “Mark” module marker identifies priority items, not every card.
- Campaign module: may use richer visual material, but keeps the same typography, orange signal and white operating surface.
- Social: orange field, white mark, one concise operational statement.

### Governance

- `brand-context.md` is the source of truth. The PDF is a human reference.
- Product and marketing changes use the token values in this file.
- New department modules inherit the master identity; they may not invent a separate palette or wordmark.
- Any exception needs a written rationale and an owner in the decision log.

### Quick reference

| Element | Value |
|---|---|
| Primary | Mark Orange `#F35B1C` |
| Ink | Cinder Ink `#1D1A17` |
| Surface | White `#FFFFFF` |
| Heading | Space Grotesk |
| Body | Avenir Next |
| Voice | Clear, warm, exact |
| Tagline | Your agency, in context. |
