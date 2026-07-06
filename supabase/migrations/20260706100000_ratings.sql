-- Star ratings: users rate titles 1-5, public aggregated stats, XP for first rating

-- ============================================================
-- RATINGS
-- ============================================================

create table if not exists ratings (
    user_id uuid not null references profiles(id) on delete cascade,
    title_id bigint not null references titles(id) on delete cascade,
    rating int not null check (rating between 1 and 5),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (user_id, title_id)
);

create index idx_ratings_title on ratings(title_id);

alter table ratings enable row level security;
create policy "ratings public read" on ratings for select using (true);
create policy "ratings insert own" on ratings for insert with check (auth.uid() = user_id);
create policy "ratings update own" on ratings for update using (auth.uid() = user_id);
create policy "ratings delete own" on ratings for delete using (auth.uid() = user_id);

-- ============================================================
-- RATING STATS VIEW
-- ============================================================

create or replace view title_rating_stats with (security_invoker = true) as
select title_id, round(avg(rating)::numeric, 1) as avg_rating, count(*) as rating_count
from ratings group by title_id;

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

create or replace function fn_touch_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger trg_ratings_touch_updated_at
    before update on ratings
    for each row execute function fn_touch_updated_at();

-- ============================================================
-- XP EVENTS: allow 'rating' event type
-- ============================================================

alter table xp_events drop constraint xp_events_event_type_check;
alter table xp_events add constraint xp_events_event_type_check
    check (event_type in ('watch', 'review', 'quiz', 'badge', 'streak', 'rating'));
