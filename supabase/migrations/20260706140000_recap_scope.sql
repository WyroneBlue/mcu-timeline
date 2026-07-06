-- Recap scopes: 'detailed' (everything important leading up to the title),
-- 'for-me' (personalized to the viewer's watch history) and 'missed-only'
-- (only the prerequisites the viewer hasn't seen). The scope is part of the
-- cache key.

alter table generated_recaps
    add column if not exists scope text not null default 'missed-only'
    check (scope in ('detailed', 'for-me', 'missed-only'));

do $$
declare cname text;
begin
    select conname into cname
    from pg_constraint
    where conrelid = 'generated_recaps'::regclass and contype = 'u';
    if cname is not null then
        execute format('alter table generated_recaps drop constraint %I', cname);
    end if;
end $$;

alter table generated_recaps
    add constraint generated_recaps_cache_key
    unique (title_id, gap_hash, locale, mode, spoiler_level, scope);
