create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  creator text not null,
  description text not null default '',
  video_url text not null,
  poster_url text,
  duration numeric not null default 0,
  level text not null check (level in ('beginner', 'intermediate', 'advanced')),
  topics text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.subtitle_lines (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos(id) on delete cascade,
  start_time numeric not null,
  end_time numeric not null,
  english text not null,
  chinese text not null,
  sort_order integer not null,
  word_card_ids uuid[] not null default '{}',
  constraint subtitle_time_order check (end_time > start_time)
);

create index if not exists subtitle_lines_video_order_idx
  on public.subtitle_lines(video_id, sort_order);

create table if not exists public.word_cards (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos(id) on delete cascade,
  term text not null,
  meaning text not null,
  example text not null,
  status text not null default 'new' check (status in ('new', 'learning', 'known'))
);

create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  subtitle_line_id uuid not null references public.subtitle_lines(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, subtitle_line_id)
);

create table if not exists public.learning_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  current_time numeric not null default 0,
  active_line_id uuid references public.subtitle_lines(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (user_id, video_id)
);

create table if not exists public.recordings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  subtitle_line_id uuid not null references public.subtitle_lines(id) on delete cascade,
  audio_url text not null,
  duration numeric,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.videos enable row level security;
alter table public.subtitle_lines enable row level security;
alter table public.word_cards enable row level security;
alter table public.favorites enable row level security;
alter table public.learning_progress enable row level security;
alter table public.recordings enable row level security;

create policy "public video read" on public.videos
  for select using (true);

create policy "public subtitle read" on public.subtitle_lines
  for select using (true);

create policy "public word card read" on public.word_cards
  for select using (true);

create policy "users manage own favorites" on public.favorites
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users manage own progress" on public.learning_progress
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users manage own recordings" on public.recordings
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
