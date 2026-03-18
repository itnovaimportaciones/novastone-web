create table if not exists public.reservation_email_queue (
  id bigint generated always as identity primary key,
  reservation_id text,
  payload jsonb not null,
  error text,
  status text not null default 'pending',
  retries integer not null default 0,
  next_retry_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reservation_email_queue_status_next_retry_idx
  on public.reservation_email_queue (status, next_retry_at);

create or replace function public.set_reservation_email_queue_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_reservation_email_queue_updated_at on public.reservation_email_queue;

create trigger trg_set_reservation_email_queue_updated_at
before update on public.reservation_email_queue
for each row
execute function public.set_reservation_email_queue_updated_at();
