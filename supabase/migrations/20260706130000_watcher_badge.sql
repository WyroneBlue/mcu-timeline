-- Badge for discovering The Watcher easter egg (awarded via the existing
-- badge path, which also grants its XP as event_type 'badge')

insert into badges (code, name, description, icon)
values ('watcher_found', 'The Watcher', 'You noticed the one who watches', '👁️')
on conflict (code) do nothing;
