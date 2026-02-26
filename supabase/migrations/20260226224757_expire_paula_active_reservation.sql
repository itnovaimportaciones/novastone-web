do $$
declare
  v_inv uuid;
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

  update public.slabs_inventory si
  set stock = si.stock + 1
  where si.id = v_inv;

  raise notice 'Reservation expired + stock restored for inventory_id=%', v_inv;
end $$;
