# Tienda Online — Alimentos Balanceados para Pollos 🐣

Tienda e-commerce completa construida con **Next.js 14 (App Router) + TypeScript + Tailwind CSS + Supabase**, pensada para venta de alimentos balanceados en Perú (precios en soles, pago por Yape/Plin con comprobante o contra entrega).

## Funcionalidades

- Catálogo público con filtros por categoría, etapa del ave y buscador.
- Carrito persistente en `localStorage` con validación de stock.
- Registro/login con Supabase Auth (crea el perfil automáticamente vía trigger).
- Checkout con Yape / Plin (subida de comprobante a Storage privado) o contra entrega.
- Creación de pedidos vía RPC transaccional (`crear_pedido`): valida stock, lo descuenta y genera código correlativo `PED-00001`.
- Historial de pedidos del cliente con estados.
- Panel admin protegido por rol: dashboard con métricas, CRUD de productos con imágenes, gestión de pedidos con cambio de estado (cancelar repone stock) y visualización de comprobantes.
- Botón flotante de WhatsApp + aviso de pedido por WhatsApp.
- Seguridad con RLS en todas las tablas y verificación de rol en servidor (middleware + layout admin).

## 1. Requisitos

- Node.js 18.17 o superior
- Una cuenta gratuita en [supabase.com](https://supabase.com)

## 2. Crear el proyecto en Supabase

1. Entra a Supabase → **New project**. Elige nombre, contraseña de base de datos y región (recomendado: `South America (São Paulo)`).
2. Cuando el proyecto esté listo, ve a **SQL Editor** → **New query**.
3. Copia **todo** el contenido de `supabase/schema.sql`, pégalo y presiona **Run**.
   - Esto crea las tablas, triggers, funciones RPC, políticas RLS, los buckets de Storage (`productos` público y `comprobantes` privado) y datos de ejemplo (4 categorías y 10 productos).
4. Verifica en **Table Editor** que aparezcan las tablas `categorias`, `productos`, `perfiles`, `pedidos` y `pedido_items` con datos.
5. (Opcional para pruebas) En **Authentication → Providers → Email**, puedes desactivar *Confirm email* para no tener que confirmar el correo en cada registro de prueba. En producción se recomienda dejarlo activado.

## 3. Configurar variables de entorno

1. En Supabase, ve a **Project Settings → API** y copia la **Project URL** y la **anon public key**.
2. En la raíz del proyecto:

```bash
cp .env.local.example .env.local
```

3. Completa `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_ANON_KEY
```

## 4. Reemplazar los datos del negocio

Edita `lib/config.ts` y reemplaza los placeholders:

| Placeholder | Descripción |
|---|---|
| `[NOMBRE_EMPRESA]` | Nombre comercial de la tienda |
| `[NUMERO_WHATSAPP]` | Número con código de país, ej: `51999999999` |
| `[NUMERO_YAPE]` | Número de Yape/Plin que se muestra en el checkout |
| `[DIRECCION_LOCAL]` | Dirección física mostrada en el footer |

También puedes ajustar el horario, zonas de reparto y el umbral de stock bajo (busca los comentarios `// CONFIGURAR`).

## 5. Instalar y ejecutar en local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## 6. Crear el primer usuario admin

1. Regístrate normalmente desde la web (`/registro`).
2. En Supabase, ve a **Authentication → Users** y copia el **UUID** de tu usuario.
3. En **SQL Editor** ejecuta:

```sql
update public.perfiles
set rol = 'admin'
where id = 'PEGA_AQUI_EL_UUID';
```

4. Cierra sesión y vuelve a entrar en la web: verás el enlace **Panel admin** en el menú y podrás acceder a `/admin`.

> El rol se verifica **siempre en el servidor** (middleware + layout de `/admin`), nunca se confía en el cliente.

## 7. Desplegar en Vercel

1. Sube el proyecto a un repositorio de GitHub.
2. En [vercel.com](https://vercel.com) → **Add New → Project** → importa el repositorio.
3. En **Environment Variables** agrega:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Presiona **Deploy**. Listo: Vercel detecta Next.js automáticamente.
5. (Recomendado) En Supabase → **Authentication → URL Configuration**, agrega la URL de Vercel como *Site URL* y en *Redirect URLs*.

## Estructura del proyecto

```
├── supabase/schema.sql        # Todo el SQL: tablas, triggers, RPC, RLS, buckets, seed
├── middleware.ts              # Protección de /checkout, /mis-pedidos y /admin/*
├── lib/
│   ├── config.ts              # Datos del negocio (placeholders y constantes CONFIGURAR)
│   ├── types.ts               # Tipos TypeScript del esquema
│   ├── utils.ts               # Formato de soles, etapas, estados
│   └── supabase/              # Clientes de Supabase (browser y server)
├── components/                # Navbar, Footer, carrito, tarjetas, botón WhatsApp
└── app/
    ├── page.tsx               # Landing
    ├── productos/             # Catálogo y detalle
    ├── carrito/  checkout/    # Carrito y confirmación de pedido
    ├── login/  registro/      # Autenticación
    ├── mis-pedidos/           # Historial del cliente
    └── admin/                 # Dashboard, CRUD de productos, gestión de pedidos
```

## Notas técnicas

- **Stock seguro:** la RPC `crear_pedido` usa `SELECT ... FOR UPDATE`, así dos clientes no pueden comprar el mismo saco a la vez. Si falla la validación, toda la transacción se revierte.
- **Cancelaciones:** la RPC `cambiar_estado_pedido` repone el stock automáticamente al cancelar un pedido.
- **Comprobantes:** se guardan en el bucket privado `comprobantes` dentro de una carpeta por usuario (`uid/archivo`). El admin los visualiza con enlaces firmados temporales.
- **Costo de envío:** por defecto es 0 (se coordina por WhatsApp). Si defines uno, ajusta `COSTO_ENVIO` en `lib/config.ts` y súmalo en el checkout y en la RPC.
