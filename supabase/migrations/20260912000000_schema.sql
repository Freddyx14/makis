-- Makis OS — esquema Postgres (Supabase)
-- Migración inicial

-- ---------------------------------------------------------------------------
-- Workspaces
-- ---------------------------------------------------------------------------

create table if not exists workspaces (
  id                text primary key,
  url               text not null,
  name              text not null,
  objective         text not null,
  budget            text,
  market            text,
  current_act       text not null default 'entrada',
  status            text not null default 'pending',
  drive_folder_url  text,
  owner_id          uuid references auth.users(id) on delete cascade,
  created_at        timestamptz not null default now()
);

create index if not exists idx_workspaces_owner on workspaces(owner_id);

-- ---------------------------------------------------------------------------
-- Documentos unicos por workspace: brief | research | strategy
-- ---------------------------------------------------------------------------

create table if not exists documents (
  workspace_id  text not null references workspaces(id) on delete cascade,
  kind          text not null,
  payload       jsonb not null,
  updated_at    timestamptz not null default now(),
  primary key (workspace_id, kind)
);

-- ---------------------------------------------------------------------------
-- Contenido (acto CONSTRUIR / GOBERNAR)
-- ---------------------------------------------------------------------------

create table if not exists content_pieces (
  id            text primary key,
  workspace_id  text not null references workspaces(id) on delete cascade,
  approval      text not null default 'draft',
  payload       jsonb not null,
  updated_at    timestamptz not null default now()
);

create index if not exists idx_content_ws on content_pieces(workspace_id);

-- ---------------------------------------------------------------------------
-- Eventos append-only: decision | execution | metric | learning
-- ---------------------------------------------------------------------------

create table if not exists events (
  id            text primary key,
  workspace_id  text not null references workspaces(id) on delete cascade,
  kind          text not null,
  payload       jsonb not null,
  created_at    timestamptz not null default now()
);

create index if not exists idx_events_ws on events(workspace_id, kind, created_at);

-- ---------------------------------------------------------------------------
-- Artefactos reales en Google Workspace. El corazon del criterio 2.
-- ---------------------------------------------------------------------------

create table if not exists artifacts (
  id            text primary key,
  workspace_id  text not null references workspaces(id) on delete cascade,
  slot          text not null,
  payload       jsonb not null,
  updated_at    timestamptz not null default now(),
  unique (workspace_id, slot)
);

-- ---------------------------------------------------------------------------
-- Trazabilidad. Se escribe ANTES de que el frontend se entere,
-- por eso un run interrumpido es reanudable y el cockpit repinta tras refrescar.
-- ---------------------------------------------------------------------------

create table if not exists agent_steps (
  id            text primary key,
  workspace_id  text not null references workspaces(id) on delete cascade,
  seq           bigserial,
  act           text not null,
  agent         text not null,
  status        text not null,
  payload       jsonb not null
);

create index if not exists idx_steps_ws on agent_steps(workspace_id, seq);

-- ---------------------------------------------------------------------------
-- Realtime: sustituye al SSE.
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table agent_steps;
alter publication supabase_realtime add table artifacts;
alter publication supabase_realtime add table content_pieces;
alter publication supabase_realtime add table workspaces;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table workspaces     enable row level security;
alter table documents      enable row level security;
alter table content_pieces enable row level security;
alter table events         enable row level security;
alter table artifacts      enable row level security;
alter table agent_steps    enable row level security;

-- Un usuario ve sus propios workspaces.
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'own workspaces' and tablename = 'workspaces') then
    create policy "own workspaces" on workspaces for select using (auth.uid() = owner_id);
  end if;
end $$;

-- Las tablas hijas heredan el permiso a traves del workspace.
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'own documents' and tablename = 'documents') then
    create policy "own documents" on documents for select using (exists (
      select 1 from workspaces w where w.id = documents.workspace_id and w.owner_id = auth.uid()
    ));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'own content' and tablename = 'content_pieces') then
    create policy "own content" on content_pieces for select using (exists (
      select 1 from workspaces w where w.id = content_pieces.workspace_id and w.owner_id = auth.uid()
    ));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'own events' and tablename = 'events') then
    create policy "own events" on events for select using (exists (
      select 1 from workspaces w where w.id = events.workspace_id and w.owner_id = auth.uid()
    ));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'own artifacts' and tablename = 'artifacts') then
    create policy "own artifacts" on artifacts for select using (exists (
      select 1 from workspaces w where w.id = artifacts.workspace_id and w.owner_id = auth.uid()
    ));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'own steps' and tablename = 'agent_steps') then
    create policy "own steps" on agent_steps for select using (exists (
      select 1 from workspaces w where w.id = agent_steps.workspace_id and w.owner_id = auth.uid()
    ));
  end if;
end $$;
