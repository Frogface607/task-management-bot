-- Task Management Bot initial schema (PostgreSQL / Supabase)

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique not null,
  timezone text not null default 'Asia/Irkutsk',
  created_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  telegram_id text unique not null,
  username text,
  workspace_id uuid references workspaces(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists roles (
  id serial primary key,
  name text unique not null,
  access_level integer not null
);

create table if not exists user_roles (
  user_id uuid references users(id) on delete cascade,
  role_id integer references roles(id) on delete cascade,
  primary key (user_id, role_id)
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  assigned_to uuid references users(id) on delete set null,
  deadline timestamptz,
  status text not null default 'new' check (status in ('new','assigned','in_progress','pending_review','approved','rejected')),
  created_by uuid references users(id) on delete set null,
  workspace_id uuid references workspaces(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_tasks_assigned_to on tasks(assigned_to);
create index if not exists idx_tasks_workspace on tasks(workspace_id);
create index if not exists idx_tasks_status on tasks(status);

create table if not exists issues (
  id uuid primary key default gen_random_uuid(),
  reported_by uuid references users(id) on delete set null,
  category text not null,
  description text,
  photo_url text,
  status text not null default 'new' check (status in ('new','in_progress','resolved')),
  workspace_id uuid references workspaces(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_issues_reported_by on issues(reported_by);
create index if not exists idx_issues_workspace on issues(workspace_id);

-- Insert default roles
insert into roles (name, access_level) values
  ('Владелец', 100),
  ('Менеджер', 80),
  ('Бухгалтер', 60),
  ('Старший бухгалтер', 50),
  ('Младший бухгалтер', 40),
  ('Помощник', 20)
on conflict (name) do nothing;
