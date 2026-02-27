create or replace function public.clear_user_reservations(p_email text)
returns void
language plpgsql
security definer
as $$
declare
  r record;
begin
  if current_setting('request.jwt.claim.role', true) is distinct from 'service_role' then
    raise exception 'forbidden';
  end if;

  for r in
    select sr.inventory_id, count(*)::int as qty
    from public.slab_reservations sr
    where sr.user_email = p_email
      and sr.status = 'active'
    group by sr.inventory_id
  loop
    update public.slabs_inventory si
    set stock = si.stock + r.qty
    where si.id = r.inventory_id;
  end loop;

  delete from public.slab_reservations sr
  where sr.user_email = p_email
    and sr.status = 'active';
end;
$$;

revoke all on function public.clear_user_reservations(text) from public;
