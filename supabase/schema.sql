-- ============================================================
-- TIENDA ONLINE DE ALIMENTOS BALANCEADOS PARA POLLOS
-- Schema completo para Supabase (PostgreSQL)
-- Pegar todo este archivo en el SQL Editor de Supabase y ejecutar.
-- ============================================================

-- ============================================================
-- 1. TABLAS
-- ============================================================

create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  orden int default 0
);

create table public.productos (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid references public.categorias(id),
  nombre text not null,
  descripcion text,
  etapa text check (etapa in ('inicio', 'crecimiento', 'acabado', 'postura', 'otro')),
  presentacion_kg numeric not null,
  precio numeric(10,2) not null check (precio >= 0),
  stock int not null default 0 check (stock >= 0),
  imagen_url text,
  activo boolean default true,
  created_at timestamptz default now()
);

create table public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text,
  telefono text,
  direccion text,
  rol text not null default 'cliente' check (rol in ('cliente', 'admin'))
);

create table public.pedidos (
  id uuid primary key default gen_random_uuid(),
  codigo text unique,
  usuario_id uuid references public.perfiles(id),
  total numeric(10,2) not null default 0,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'confirmado', 'en_reparto', 'entregado', 'cancelado')),
  metodo_pago text check (metodo_pago in ('yape', 'plin', 'contra_entrega')),
  comprobante_url text, -- ruta del archivo dentro del bucket "comprobantes"
  direccion_entrega text,
  telefono_contacto text,
  notas text,
  created_at timestamptz default now()
);

create table public.pedido_items (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  producto_id uuid references public.productos(id),
  cantidad int not null check (cantidad > 0),
  precio_unitario numeric(10,2) not null,
  subtotal numeric(10,2) not null
);

create index idx_productos_categoria on public.productos(categoria_id);
create index idx_pedidos_usuario on public.pedidos(usuario_id);
create index idx_pedidos_estado on public.pedidos(estado);
create index idx_pedido_items_pedido on public.pedido_items(pedido_id);

-- ============================================================
-- 2. FUNCION AUXILIAR: ¿el usuario actual es admin?
-- ============================================================

create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.perfiles
    where id = auth.uid() and rol = 'admin'
  );
$$;

-- ============================================================
-- 3. TRIGGER: crear perfil automaticamente al registrarse
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, nombre, telefono, direccion)
  values (
    new.id,
    new.raw_user_meta_data ->> 'nombre',
    new.raw_user_meta_data ->> 'telefono',
    new.raw_user_meta_data ->> 'direccion'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 4. TRIGGER: codigo correlativo PED-00001
-- ============================================================

create sequence public.pedidos_codigo_seq start 1;

create or replace function public.asignar_codigo_pedido()
returns trigger
language plpgsql
as $$
begin
  new.codigo := 'PED-' || lpad(nextval('public.pedidos_codigo_seq')::text, 5, '0');
  return new;
end;
$$;

create trigger trg_asignar_codigo_pedido
  before insert on public.pedidos
  for each row
  when (new.codigo is null)
  execute function public.asignar_codigo_pedido();

-- ============================================================
-- 5. RPC: crear_pedido
--    Recibe items en JSON, valida stock, descuenta stock y
--    crea pedido + items en una sola transaccion.
--    p_items = [{"producto_id": "uuid", "cantidad": 2}, ...]
-- ============================================================

create or replace function public.crear_pedido(
  p_items jsonb,
  p_metodo_pago text,
  p_direccion_entrega text,
  p_telefono_contacto text,
  p_notas text default null,
  p_comprobante_url text default null
)
returns table (pedido_id uuid, codigo text, total numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario uuid := auth.uid();
  v_pedido_id uuid;
  v_total numeric(10,2) := 0;
  v_item record;
  v_producto record;
begin
  if v_usuario is null then
    raise exception 'Debes iniciar sesion para realizar un pedido';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido no contiene productos';
  end if;

  if p_metodo_pago not in ('yape', 'plin', 'contra_entrega') then
    raise exception 'Metodo de pago no valido';
  end if;

  -- Crear cabecera del pedido (el codigo lo asigna el trigger)
  insert into public.pedidos (usuario_id, total, metodo_pago, direccion_entrega, telefono_contacto, notas, comprobante_url)
  values (v_usuario, 0, p_metodo_pago, p_direccion_entrega, p_telefono_contacto, p_notas, p_comprobante_url)
  returning id into v_pedido_id;

  -- Recorrer items, validar y descontar stock con bloqueo de fila
  for v_item in
    select (e ->> 'producto_id')::uuid as producto_id,
           (e ->> 'cantidad')::int as cantidad
    from jsonb_array_elements(p_items) e
  loop
    if v_item.cantidad is null or v_item.cantidad <= 0 then
      raise exception 'Cantidad no valida en el pedido';
    end if;

    select id, nombre, precio, stock
    into v_producto
    from public.productos
    where id = v_item.producto_id and activo = true
    for update;

    if not found then
      raise exception 'Producto no disponible';
    end if;

    if v_producto.stock < v_item.cantidad then
      raise exception 'Stock insuficiente para "%": quedan % unidades', v_producto.nombre, v_producto.stock;
    end if;

    update public.productos
    set stock = stock - v_item.cantidad
    where id = v_producto.id;

    insert into public.pedido_items (pedido_id, producto_id, cantidad, precio_unitario, subtotal)
    values (v_pedido_id, v_producto.id, v_item.cantidad, v_producto.precio, v_producto.precio * v_item.cantidad);

    v_total := v_total + (v_producto.precio * v_item.cantidad);
  end loop;

  update public.pedidos set total = v_total where id = v_pedido_id;

  return query
    select p.id, p.codigo, p.total
    from public.pedidos p
    where p.id = v_pedido_id;
end;
$$;

-- ============================================================
-- 6. RPC: cambiar_estado_pedido (solo admin)
--    Si se cancela un pedido, repone el stock de los items.
-- ============================================================

create or replace function public.cambiar_estado_pedido(
  p_pedido_id uuid,
  p_estado text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_estado_actual text;
  v_item record;
begin
  if not public.es_admin() then
    raise exception 'No tienes permisos para cambiar el estado de pedidos';
  end if;

  if p_estado not in ('pendiente', 'confirmado', 'en_reparto', 'entregado', 'cancelado') then
    raise exception 'Estado no valido';
  end if;

  select estado into v_estado_actual
  from public.pedidos
  where id = p_pedido_id
  for update;

  if not found then
    raise exception 'Pedido no encontrado';
  end if;

  -- Reponer stock solo al pasar a cancelado desde un estado no cancelado
  if p_estado = 'cancelado' and v_estado_actual <> 'cancelado' then
    for v_item in
      select producto_id, cantidad from public.pedido_items where pedido_id = p_pedido_id
    loop
      update public.productos
      set stock = stock + v_item.cantidad
      where id = v_item.producto_id;
    end loop;
  end if;

  update public.pedidos set estado = p_estado where id = p_pedido_id;
end;
$$;

-- ============================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================

alter table public.categorias enable row level security;
alter table public.productos enable row level security;
alter table public.perfiles enable row level security;
alter table public.pedidos enable row level security;
alter table public.pedido_items enable row level security;

-- CATEGORIAS: lectura publica, escritura solo admin
create policy "categorias_select_publico" on public.categorias
  for select using (true);

create policy "categorias_write_admin" on public.categorias
  for all using (public.es_admin()) with check (public.es_admin());

-- PRODUCTOS: lectura publica solo de activos (admin ve todos), escritura solo admin
create policy "productos_select_publico" on public.productos
  for select using (activo = true or public.es_admin());

create policy "productos_insert_admin" on public.productos
  for insert with check (public.es_admin());

create policy "productos_update_admin" on public.productos
  for update using (public.es_admin()) with check (public.es_admin());

create policy "productos_delete_admin" on public.productos
  for delete using (public.es_admin());

-- PERFILES: cada usuario ve/edita el suyo; admin ve todos
create policy "perfiles_select_propio_o_admin" on public.perfiles
  for select using (id = auth.uid() or public.es_admin());

create policy "perfiles_update_propio_o_admin" on public.perfiles
  for update using (id = auth.uid() or public.es_admin())
  with check (id = auth.uid() or public.es_admin());

-- PEDIDOS: el cliente ve/crea los suyos; admin ve y actualiza todos
create policy "pedidos_select_propio_o_admin" on public.pedidos
  for select using (usuario_id = auth.uid() or public.es_admin());

create policy "pedidos_insert_propio" on public.pedidos
  for insert with check (usuario_id = auth.uid());

create policy "pedidos_update_admin" on public.pedidos
  for update using (public.es_admin()) with check (public.es_admin());

-- PEDIDO_ITEMS: visibles si el pedido padre es visible
create policy "pedido_items_select" on public.pedido_items
  for select using (
    exists (
      select 1 from public.pedidos p
      where p.id = pedido_id
        and (p.usuario_id = auth.uid() or public.es_admin())
    )
  );

create policy "pedido_items_insert_propio" on public.pedido_items
  for insert with check (
    exists (
      select 1 from public.pedidos p
      where p.id = pedido_id and p.usuario_id = auth.uid()
    )
  );

-- ============================================================
-- 8. STORAGE: buckets y politicas
--    - productos: publico (lectura libre, escritura admin)
--    - comprobantes: privado (cada usuario sube en su carpeta,
--      admin puede leer todos)
-- ============================================================

insert into storage.buckets (id, name, public)
values ('productos', 'productos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('comprobantes', 'comprobantes', false)
on conflict (id) do nothing;

-- Lectura publica de imagenes de productos
create policy "storage_productos_select" on storage.objects
  for select using (bucket_id = 'productos');

-- Solo admin sube/edita/borra imagenes de productos
create policy "storage_productos_insert_admin" on storage.objects
  for insert with check (bucket_id = 'productos' and public.es_admin());

create policy "storage_productos_update_admin" on storage.objects
  for update using (bucket_id = 'productos' and public.es_admin());

create policy "storage_productos_delete_admin" on storage.objects
  for delete using (bucket_id = 'productos' and public.es_admin());

-- Comprobantes: cada usuario sube dentro de su carpeta (uid/archivo)
create policy "storage_comprobantes_insert_propio" on storage.objects
  for insert with check (
    bucket_id = 'comprobantes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Comprobantes: el dueno o el admin pueden leer
create policy "storage_comprobantes_select" on storage.objects
  for select using (
    bucket_id = 'comprobantes'
    and (auth.uid()::text = (storage.foldername(name))[1] or public.es_admin())
  );

-- ============================================================
-- 9. SEED: categorias y productos de ejemplo
--    Precios referenciales en soles (S/). Ajustar a los reales.
-- ============================================================

insert into public.categorias (nombre, descripcion, orden) values
  ('Inicio', 'Alimento para pollitos BB de 1 a 21 dias. Alta proteina para un arranque fuerte.', 1),
  ('Crecimiento', 'Alimento para pollos de 22 a 35 dias. Desarrollo de musculo y esqueleto.', 2),
  ('Acabado y Engorde', 'Alimento de 36 dias a la saca. Maximo peso y conversion alimenticia.', 3),
  ('Postura', 'Alimento para gallinas ponedoras. Calcio y nutrientes para huevos de calidad.', 4);

insert into public.productos (categoria_id, nombre, descripcion, etapa, presentacion_kg, precio, stock)
select id, 'Alimento Inicio Pollo BB x 25 kg',
  'Crumble de alta proteina (21%) para pollitos de 1 a 21 dias. Con vitaminas y minerales para reducir mortalidad y asegurar un arranque parejo del lote.',
  'inicio', 25, 72.00, 40
from public.categorias where nombre = 'Inicio';

insert into public.productos (categoria_id, nombre, descripcion, etapa, presentacion_kg, precio, stock)
select id, 'Alimento Inicio Pollo BB x 50 kg',
  'Presentacion de 50 kg del alimento de inicio. Ideal para galpones medianos y grandes. Proteina 21%, con coccidiostato.',
  'inicio', 50, 138.00, 25
from public.categorias where nombre = 'Inicio';

insert into public.productos (categoria_id, nombre, descripcion, etapa, presentacion_kg, precio, stock)
select id, 'Alimento Crecimiento x 40 kg',
  'Pellet quebrado para pollos de 22 a 35 dias. Proteina 19%. Favorece el desarrollo de pechuga y estructura osea.',
  'crecimiento', 40, 108.00, 35
from public.categorias where nombre = 'Crecimiento';

insert into public.productos (categoria_id, nombre, descripcion, etapa, presentacion_kg, precio, stock)
select id, 'Alimento Crecimiento x 50 kg',
  'Saco de 50 kg para la etapa de crecimiento. Formula balanceada con maiz amarillo, torta de soya y nucleo vitaminico.',
  'crecimiento', 50, 132.00, 30
from public.categorias where nombre = 'Crecimiento';

insert into public.productos (categoria_id, nombre, descripcion, etapa, presentacion_kg, precio, stock)
select id, 'Alimento Acabado Engorde x 40 kg',
  'Pellet para pollos de 36 dias hasta la saca. Alta energia para maximo peso final y buena conversion alimenticia.',
  'acabado', 40, 105.00, 45
from public.categorias where nombre = 'Acabado y Engorde';

insert into public.productos (categoria_id, nombre, descripcion, etapa, presentacion_kg, precio, stock)
select id, 'Alimento Acabado Engorde x 50 kg',
  'Presentacion de 50 kg para la etapa final de engorde. Pigmentante natural para piel amarilla, muy valorada en el mercado.',
  'acabado', 50, 128.00, 38
from public.categorias where nombre = 'Acabado y Engorde';

insert into public.productos (categoria_id, nombre, descripcion, etapa, presentacion_kg, precio, stock)
select id, 'Alimento Postura Ponedoras x 40 kg',
  'Alimento para gallinas en produccion. Calcio 3.8% para cascara firme y proteina 17% para alta postura sostenida.',
  'postura', 40, 98.00, 28
from public.categorias where nombre = 'Postura';

insert into public.productos (categoria_id, nombre, descripcion, etapa, presentacion_kg, precio, stock)
select id, 'Alimento Postura Ponedoras x 50 kg',
  'Saco de 50 kg para gallinas ponedoras en piso o jaula. Con metionina y fosforo disponible para huevos grandes.',
  'postura', 50, 119.00, 22
from public.categorias where nombre = 'Postura';

insert into public.productos (categoria_id, nombre, descripcion, etapa, presentacion_kg, precio, stock)
select id, 'Pre-Postura Levante x 40 kg',
  'Alimento de transicion para pollonas de 15 a 18 semanas antes del primer huevo. Prepara la reserva de calcio.',
  'postura', 40, 102.00, 15
from public.categorias where nombre = 'Postura';

insert into public.productos (categoria_id, nombre, descripcion, etapa, presentacion_kg, precio, stock)
select id, 'Alimento Mixto Traspatio x 25 kg',
  'Formula economica para crianza familiar de traspatio: pollos y gallinas criollas de todas las edades.',
  'otro', 25, 58.00, 50
from public.categorias where nombre = 'Acabado y Engorde';

-- ============================================================
-- FIN DEL SCHEMA
-- Recuerda: para crear tu primer admin, registrate en la web y
-- luego ejecuta:
--   update public.perfiles set rol = 'admin' where id = 'UUID_DEL_USUARIO';
-- ============================================================
