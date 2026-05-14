alter table profiles add column if not exists is_admin boolean not null default false;

drop policy if exists "profiles update own" on profiles;
create policy "profiles update own" on profiles for update using (auth.uid() = id) with check (
    is_admin = (select is_admin from profiles where id = auth.uid())
);
