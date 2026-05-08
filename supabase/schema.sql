-- Supabase 프로젝트 SQL 스키마
-- Supabase SQL 에디터에서 실행하세요.

create table public.clients (
  id bigint generated always as identity primary key,
  company text not null,
  address text,
  company_phone text,
  contact_person text not null,
  mobile_phone text,
  email text,
  status text not null default 'lead',
  registered_at timestamptz not null default now()
);
