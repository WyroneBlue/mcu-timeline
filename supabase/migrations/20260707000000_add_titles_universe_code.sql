alter table titles add column universe_code text;
create index idx_titles_universe_code on titles (universe_code);
