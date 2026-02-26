create or replace function public.expire_reservations()
returns void
language sql
security definer
as $$
  with expired_rows as (
    update public.slab_reservations sr
    set status = 'expired'
    where sr.status = 'active'
      and sr.expires_at <= now()
    returning sr.inventory_id
  ),
  agg as (
    select er.inventory_id, count(*)::int as cnt
    from expired_rows er
    group by er.inventory_id
  )
  update public.slabs_inventory si
  set stock = si.stock + agg.cnt
  from agg
  where si.id = agg.inventory_id;
$$;
