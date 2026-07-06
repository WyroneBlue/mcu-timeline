-- Moderated user reviews: text reviews per title with a moderation pipeline + community reports

-- ============================================================
-- REVIEWS
-- ============================================================

create table if not exists reviews (
    id bigserial primary key,
    user_id uuid not null references profiles(id) on delete cascade,
    title_id bigint not null references titles(id) on delete cascade,
    body text not null check (char_length(body) between 10 and 2000),
    locale text not null default 'en',
    status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'flagged')),
    moderation jsonb,
    report_count int not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (user_id, title_id)
);

create index idx_reviews_title_status on reviews(title_id, status);
create index idx_reviews_status on reviews(status);

alter table reviews enable row level security;
create policy "reviews read approved or own" on reviews for select using (status = 'approved' or auth.uid() = user_id);
create policy "reviews delete own" on reviews for delete using (auth.uid() = user_id);
-- No insert/update policies on purpose: all writes go through service-role
-- server routes so the moderation pipeline cannot be bypassed.

create trigger trg_reviews_touch_updated_at
    before update on reviews
    for each row execute function fn_touch_updated_at();

-- ============================================================
-- REVIEW REPORTS
-- ============================================================

create table if not exists review_reports (
    id bigserial primary key,
    review_id bigint not null references reviews(id) on delete cascade,
    user_id uuid not null references profiles(id) on delete cascade,
    reason text,
    created_at timestamptz not null default now(),
    unique (review_id, user_id)
);

create index idx_review_reports_review on review_reports(review_id);

alter table review_reports enable row level security;
create policy "review_reports read own" on review_reports for select using (auth.uid() = user_id);
-- Inserts go through the service-role report route (idempotent via unique constraint).
