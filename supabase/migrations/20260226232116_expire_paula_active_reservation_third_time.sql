do $$
declare
  v_inv uuid;
  v_count int;
begin
  select sr.inventory_id
    into v_inv
  from public.slab_reservations sr
  where sr.user_email = 'paulanadinafiz@gmail.com'
    and sr.status = 'active'
    and sr.expires_at > now()
  order by sr.reserved_at desc
  limit 1;

  if v_inv is null then
    raise notice 'No active reservation found for paulanadinafiz@gmail.com';
    return;
  end if;

  update public.slab_reservations sr
  set status = 'expired',
      expires_at = now()
  where sr.user_email = 'paulanadinafiz@gmail.com'
    and sr.status = 'active'
    and sr.expires_at > now()
    and sr.inventory_id = v_inv;

  get diagnostics v_count = row_count;

  update public.slabs_inventory si
  set stock = si.stock + v_count
  where si.id = v_inv;

  raise notice 'Expired % reservation(s) + restored stock for inventory_id=%', v_count, v_inv;
end $$;
