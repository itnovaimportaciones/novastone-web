create or replace function public.clear_user_reservations(p_email text)
returns void
language plpgsql
security definer
as $$
declare
  r record;
begin
  for r in
    select inventory_id, count(*)::int as qty
    from public.slab_reservations
    where user_email = p_email
      and status = 'active'
    group by inventory_id
  loop
    update public.slabs_inventory
    set stock = stock + r.qty
    where id = r.inventory_id;
  end loop;

  delete from public.slab_reservations
  where user_email = p_email
    and status = 'active';
end;
$$;
