drop function if exists public.reserve_inventory(uuid);

create or replace function public.reserve_inventory(p_inventory_id uuid)
returns public.slab_reservations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_stock int;
  v_res public.slab_reservations;
begin
  -- email desde JWT (magic link)
  v_email := (current_setting('request.jwt.claims', true)::json ->> 'email');

  if v_email is null or length(v_email) = 0 then
    raise exception 'Missing JWT email';
  end if;

  -- lock fila inventario
  select si.stock
    into v_stock
  from public.slabs_inventory si
  where si.id = p_inventory_id
  for update;

  if v_stock is null then
    raise exception 'Inventory not found';
  end if;

  if v_stock <= 0 then
    raise exception 'Out of stock';
  end if;

  -- 1 reserva activa por usuario
  if exists (
    select 1
    from public.slab_reservations sr
    where sr.user_email = v_email
      and sr.status = 'active'
      and sr.expires_at > now()
  ) then
    raise exception 'User already has an active reservation';
  end if;

  -- insertar reserva
  insert into public.slab_reservations (inventory_id, user_email, reserved_at, expires_at, status)
  values (p_inventory_id, v_email, now(), now() + interval '24 hours', 'active')
  returning * into v_res;

  -- descontar stock
  update public.slabs_inventory si
  set stock = si.stock - 1
  where si.id = p_inventory_id;

  return v_res;
end;
$$;
