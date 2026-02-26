-- Fix ambiguous column references in reservation RPCs

create or replace function public.reserve_inventory(p_inventory_id uuid)
returns public.slab_reservations
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
  v_user_email text;
  v_stock integer;
  v_row public.slabs_inventory;
  v_reservation public.slab_reservations;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select au.email
    into v_user_email
  from auth.users as au
  where au.id = v_user_id;

  -- Expire old active reservations for this user
  update public.slab_reservations as sr
     set status = 'expired'
   where sr.user_email = v_user_email
     and sr.status = 'active'
     and sr.expires_at <= now();

  -- Block if there is still an active reservation
  if exists (
    select 1
      from public.slab_reservations as sr
     where sr.user_email = v_user_email
       and sr.status = 'active'
  ) then
    raise exception 'Active reservation already exists';
  end if;

  select si.*
    into v_row
  from public.slabs_inventory as si
  where si.id = p_inventory_id
  for update;

  if v_row.id is null then
    raise exception 'Inventory not found';
  end if;

  v_stock := v_row.stock;
  if v_stock <= 0 then
    raise exception 'No stock available';
  end if;

  update public.slabs_inventory as si
     set stock = si.stock - 1
   where si.id = p_inventory_id;

  begin
    insert into public.slab_reservations (
      user_id,
      user_email,
      inventory_id,
      model,
      thickness,
      product_code,
      expires_at
    )
    values (
      v_user_id,
      v_user_email,
      v_row.id,
      v_row.model,
      v_row.thickness,
      v_row.product_code,
      now() + interval '24 hours'
    )
    returning * into v_reservation;
  exception
    when unique_violation then
      raise exception 'Active reservation already exists';
  end;

  return v_reservation;
end;
$$;

create or replace function public.expire_reservations()
returns void
language plpgsql
security definer
as $$
begin
  with expired as (
    update public.slab_reservations as sr
       set status = 'expired'
     where sr.status = 'active'
       and sr.expires_at <= now()
    returning sr.inventory_id
  )
  update public.slabs_inventory as si
     set stock = si.stock + 1
    from expired as e
   where si.id = e.inventory_id;
end;
$$;
