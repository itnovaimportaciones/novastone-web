alter table public.slab_reservations
drop constraint if exists slab_reservations_inventory_id_fkey;

alter table public.slab_reservations
add constraint slab_reservations_inventory_id_fkey
foreign key (inventory_id) references public.slabs_inventory(id)
on delete cascade;
