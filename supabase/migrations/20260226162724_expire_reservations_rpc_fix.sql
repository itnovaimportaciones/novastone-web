create or replace function public.expire_reservations()
returns void
language sql
security definer
as $$
  with expired as (
    update public.slab_reservations
    set status = 'expired'
    where status = 'active'
      and expires_at <= now()
    returning inventory_id
  ),
  agg as (
    select inventory_id, count(*)::int as cnt
    from expired
    group by inventory_id
  )
  update public.slabs_inventory i
  set stock = i.stock + agg.cnt
  from agg
  where i.id = agg.inventory_id;
$$;
