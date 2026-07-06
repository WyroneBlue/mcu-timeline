-- ============================================================
-- GENERATED RECAPS (cached AI "Previously On" output)
-- ============================================================

create table if not exists generated_recaps (
    id bigserial primary key,
    title_id bigint not null references titles(id) on delete cascade,
    gap_hash text not null,
    locale text not null,
    mode text not null check (mode in ('per-title','flowing-story')),
    spoiler_level text not null default 'safe' check (spoiler_level in ('safe','mild','heavy')),
    content jsonb not null,
    model text,
    created_at timestamptz not null default now(),
    unique (title_id, gap_hash, locale, mode, spoiler_level)
);

alter table generated_recaps enable row level security;
-- no policies: server-only via service role
