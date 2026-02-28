-- 1) Borra reservas activas de un email y restockea
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

-- 2) Borra TODAS las reservas activas y restockea
create or replace function public.clear_all_reservations()
returns void
language plpgsql
security definer
as $$
begin
  update public.slabs_inventory si
  set stock = si.stock + sub.qty
  from (
    select inventory_id, count(*)::int as qty
    from public.slab_reservations
    where status = 'active'
    group by inventory_id
  ) sub
  where si.id = sub.inventory_id;

  delete from public.slab_reservations
  where status = 'active';
end;
$$;

revoke all on function public.clear_user_reservations(text) from public;
revoke all on function public.clear_all_reservations() from public;

grant execute on function public.clear_user_reservations(text) to service_role;
grant execute on function public.clear_all_reservations() to service_role;
