create or replace function public.cancel_my_reservations()
returns int
language plpgsql
security definer
as $$
declare
  v_email text;
  r record;
  v_count int := 0;
begin
  v_email := coalesce((auth.jwt() ->> 'email'), '');
  if v_email = '' then
    raise exception 'not authenticated';
  end if;

  for r in
    select inventory_id, count(*)::int as qty
    from public.slab_reservations
    where user_email = v_email
      and status = 'active'
    group by inventory_id
  loop
    update public.slabs_inventory
    set stock = stock + r.qty
    where id = r.inventory_id;

    v_count := v_count + r.qty;
  end loop;

  update public.slab_reservations
  set status = 'expired',
      expires_at = now() - interval '1 minute'
  where user_email = v_email
    and status = 'active';

  return v_count;
end;
$$;

revoke all on function public.cancel_my_reservations() from public;
grant execute on function public.cancel_my_reservations() to authenticated;
