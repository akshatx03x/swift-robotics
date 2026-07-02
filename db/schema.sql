-- Schema for Fashion News Monitoring Agent MVP

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Topics Table
create table if not exists public.topics (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  enabled boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Competitors Table
create table if not exists public.competitors (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  enabled boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Sources Table
create table if not exists public.sources (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  url text not null unique,
  enabled boolean not null default true,
  priority text not null default 'Medium', -- High, Medium, Low
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Articles Table
create table if not exists public.articles (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  source text not null,
  url text not null unique,
  published_at timestamp with time zone not null,
  importance text not null, -- High, Medium, Low
  summary text not null,
  topic text not null,
  competitors text[] not null default '{}',
  reason text not null, -- "Why it matters"
  relevant boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.topics enable row level security;
alter table public.competitors enable row level security;
alter table public.sources enable row level security;
alter table public.articles enable row level security;

-- Policies for MVP ease-of-use
create policy "Allow public read access" on public.topics for select using (true);
create policy "Allow public write access" on public.topics for all using (true);

create policy "Allow public read access" on public.competitors for select using (true);
create policy "Allow public write access" on public.competitors for all using (true);

create policy "Allow public read access" on public.sources for select using (true);
create policy "Allow public write access" on public.sources for all using (true);

create policy "Allow public read access" on public.articles for select using (true);
create policy "Allow public write access" on public.articles for all using (true);

-- Seed Data (Sources)
insert into public.sources (name, url, enabled, priority)
values 
  ('Google News RSS - Fashion', 'https://news.google.com/rss/search?q=fashion+retail+industry', true, 'High'),
  ('Google News RSS - Textile', 'https://news.google.com/rss/search?q=textile+cotton+prices', true, 'Medium'),
  ('GNews - Fashion Economy', 'https://gnews.io/api/v4/search?q=fashion+economy', false, 'Medium'),
  ('NewsAPI - Apparel Business', 'https://newsapi.org/v2/everything?q=apparel+retail+business', false, 'High')
on conflict (url) do nothing;

-- Seed Data (Topics)
insert into public.topics (name, enabled)
values 
  ('Fashion', true),
  ('Luxury Fashion', true),
  ('Textile Industry', true),
  ('Cotton Prices', true),
  ('Sustainability', true),
  ('Retail', true),
  ('Ecommerce', true)
on conflict (name) do nothing;

-- Seed Data (Competitors)
insert into public.competitors (name, enabled)
values 
  ('Nike', true),
  ('Adidas', true),
  ('Puma', true),
  ('Zara', true),
  ('H&M', true),
  ('Uniqlo', true),
  ('Lululemon', true)
on conflict (name) do nothing;
