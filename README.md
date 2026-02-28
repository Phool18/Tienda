# 🍰 Tienda de Postres — Documentación Completa

> Aplicación web full-stack para una tienda de postres artesanales.  
> Construida con **Angular 17** + **Supabase** (PostgreSQL, Auth, Storage).  
> Hosting 100% gratuito en **Vercel**. Sin servidor propio. Sin tarjeta de crédito.

---

## 📋 Tabla de Contenidos

1. [Descripción del Proyecto](#descripción-del-proyecto)
2. [Tecnologías Usadas](#tecnologías-usadas)
3. [Requisitos Previos](#requisitos-previos)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Configurar Supabase (Backend)](#configurar-supabase-backend)
6. [Configurar el Proyecto Angular](#configurar-el-proyecto-angular)
7. [Correr el Proyecto Localmente](#correr-el-proyecto-localmente)
8. [Crear Usuarios de Prueba](#crear-usuarios-de-prueba)
9. [Funcionalidades Detalladas](#funcionalidades-detalladas)
10. [Arquitectura del Sistema](#arquitectura-del-sistema)
11. [Seguridad](#seguridad)
12. [Desplegar en Vercel](#desplegar-en-vercel)
13. [Solución de Problemas Comunes](#solución-de-problemas-comunes)
14. [Escalabilidad Futura](#escalabilidad-futura)
15. [Costos](#costos)

---

## Descripción del Proyecto

Esta aplicación permite gestionar una tienda de postres con dos tipos de usuario:

- **Cliente (USER):** puede ver el catálogo, agregar productos al carrito, generar pedidos y enviarlos por WhatsApp.
- **Administrador (ADMIN):** puede crear, editar y eliminar productos, subir imágenes, ver todos los pedidos y cambiar su estado.

No tiene pasarela de pagos — el flujo es: el cliente genera el pedido → se guarda en la base de datos → se envía el resumen por WhatsApp para coordinar el pago y la entrega.

---

## Tecnologías Usadas

| Capa | Tecnología | Versión | Para qué sirve |
|------|-----------|---------|----------------|
| Frontend | Angular | 17 | Framework principal de la app |
| Estilos | Bootstrap | 5.3 | Diseño responsivo y componentes UI |
| Íconos | Bootstrap Icons | 1.11 | Íconos vectoriales |
| Backend/DB | Supabase | v2 | Base de datos PostgreSQL + Auth + Storage |
| Auth | Supabase Auth | — | JWT, registro, login, sesiones |
| BD | PostgreSQL | 15 | Base de datos relacional |
| Storage | Supabase Storage | — | Almacenamiento de imágenes |
| Hosting | Vercel | — | Deploy del frontend |
| Mensajería | WhatsApp deeplink | — | Envío de pedidos |

---

## Requisitos Previos

Antes de empezar necesitas tener instalado:

### Node.js
Descarga desde [nodejs.org](https://nodejs.org). Versión mínima: **18**.

Verifica con:
```bash
node -v   # debe mostrar v18.x.x o superior
npm -v    # debe mostrar 9.x.x o superior
```

### Angular CLI
```bash
npm install -g @angular/cli
ng version  # debe mostrar Angular CLI 17.x.x
```

### Cuentas necesarias (todas gratuitas)
- [Supabase](https://supabase.com) — para la base de datos y autenticación
- [Vercel](https://vercel.com) — para el hosting (solo si vas a desplegar)
- [GitHub](https://github.com) — para el repositorio (solo si vas a desplegar)

---

## Estructura del Proyecto

```
tienda-online/
│
├── src/
│   ├── app/
│   │   │
│   │   ├── core/                          # Lógica central (singleton)
│   │   │   ├── guards/
│   │   │   │   └── auth.guard.ts          # authGuard, adminGuard, userGuard
│   │   │   ├── models/
│   │   │   │   ├── user.model.ts          # Interface Profile
│   │   │   │   ├── product.model.ts       # Interface Product, ProductForm
│   │   │   │   └── order.model.ts         # Interface Order, OrderItem, CartItem
│   │   │   └── services/
│   │   │       ├── supabase.service.ts    # Cliente Supabase (singleton)
│   │   │       ├── auth.service.ts        # Login, registro, logout, signals
│   │   │       ├── product.service.ts     # CRUD productos + upload imágenes
│   │   │       ├── cart.service.ts        # Carrito con Angular Signals
│   │   │       ├── order.service.ts       # Crear pedidos + link WhatsApp
│   │   │       └── toast.service.ts       # Notificaciones globales
│   │   │
│   │   ├── features/                      # Páginas de la aplicación
│   │   │   ├── auth/
│   │   │   │   ├── login/                 # Pantalla de inicio de sesión
│   │   │   │   └── register/              # Pantalla de registro
│   │   │   ├── user/                      # Vistas del cliente
│   │   │   │   ├── catalog/               # Catálogo de productos
│   │   │   │   ├── cart/                  # Carrito + generar pedido
│   │   │   │   └── orders/                # Mis pedidos
│   │   │   └── admin/                     # Vistas del administrador
│   │   │       ├── products/              # CRUD de productos
│   │   │       └── orders/                # Gestión de pedidos
│   │   │
│   │   ├── shared/                        # Componentes reutilizables
│   │   │   └── components/
│   │   │       ├── navbar/                # Barra de navegación
│   │   │       └── toast/                 # Notificaciones tipo toast
│   │   │
│   │   ├── app.component.ts               # Componente raíz
│   │   ├── app.config.ts                  # Configuración de la app
│   │   └── app.routes.ts                  # Rutas con lazy loading
│   │
│   ├── environments/
│   │   ├── environment.ts                 # Variables para desarrollo
│   │   └── environment.prod.ts            # Variables para producción
│   │
│   └── styles.scss                        # Estilos globales (tema pastel)
│
├── supabase/
│   └── setup.sql                          # Script único: tablas + RLS + productos
│
├── angular.json                           # Configuración del proyecto Angular
├── package.json                           # Dependencias npm
├── tsconfig.json                          # Configuración TypeScript
├── vercel.json                            # Configuración de despliegue en Vercel
└── README.md                              # Esta documentación
```

---

## Configurar Supabase (Backend)

### Paso 1 — Crear el proyecto

1. Ve a [supabase.com](https://supabase.com) y haz clic en **Start your project**
2. Inicia sesión con GitHub o crea una cuenta
3. Haz clic en **New project**
4. Completa los datos:
   - **Organization:** tu organización (se crea automáticamente)
   - **Project name:** `tienda-postres` (o el nombre que quieras)
   - **Database Password:** elige una contraseña fuerte y guárdala
   - **Region:** `South America (São Paulo)` — es la más cercana a Perú
5. Haz clic en **Create new project**
6. Espera 2-3 minutos mientras Supabase aprovisiona los recursos

### Paso 2 — Ejecutar el SQL

1. En el menú izquierdo ve a **SQL Editor**
2. Haz clic en **New query**
3. Abre el archivo `supabase/setup.sql` del proyecto
4. Copia **todo** el contenido y pégalo en el editor
5. Haz clic en **Run** (o presiona `Ctrl + Enter`)
6. Verifica que al final diga:

```
status        | total_productos
--------------+----------------
Tablas OK     | 15
```

Esto confirma que las 4 tablas, el trigger, las políticas RLS y los 15 productos de postres se crearon correctamente.

### Paso 3 — Desactivar confirmación de email

Por defecto Supabase exige que los usuarios confirmen su email antes de poder iniciar sesión. Para desarrollo, desactiva esto:

1. Ve a **Authentication** → **Sign In / Providers**
2. Haz clic en **Email**
3. Desactiva la opción **Confirm email**
4. Haz clic en **Save**

> ⚠️ Para producción real puedes dejarlo activado, pero necesitarás configurar un servidor SMTP para que los emails lleguen correctamente.

### Paso 4 — Crear el bucket de imágenes

1. Ve a **Storage** en el menú izquierdo
2. Haz clic en **New bucket**
3. Nombre: `products`
4. Activa la opción **Public bucket** ✓
5. Haz clic en **Save**

Luego ejecuta esto en el SQL Editor para las políticas del bucket:

```sql
CREATE POLICY "products_images_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'products');

CREATE POLICY "products_images_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'products' AND auth.role() = 'authenticated'
  );

CREATE POLICY "products_images_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'products' AND auth.role() = 'authenticated'
  );

CREATE POLICY "products_images_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'products' AND auth.role() = 'authenticated'
  );
```

### Paso 5 — Obtener las credenciales

1. Ve a **Settings** → **API**
2. Copia estos dos valores:

```
Project URL:  https://XXXXXXXXXXXX.supabase.co
anon public:  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Los necesitarás en el siguiente paso.

---

## Configurar el Proyecto Angular

### Paso 1 — Instalar dependencias

```bash
# Descomprime el ZIP y entra a la carpeta
unzip tienda-online.zip
cd tienda-online

# Instala todas las dependencias
npm install
```

Este proceso puede tardar 1-2 minutos. Al finalizar debe aparecer algo como:
```
added 847 packages in 45s
```

### Paso 2 — Configurar las variables de entorno

Abre el archivo `src/environments/environment.ts` y reemplaza los valores:

```typescript
export const environment = {
  production: false,
  supabaseUrl: 'https://TU-PROJECT-ID.supabase.co',  // ← pega tu Project URL
  supabaseAnonKey: 'eyJhbGci...',                      // ← pega tu anon public key
  whatsappNumber: '51987654321',                        // ← tu número sin + ni espacios
  storeName: 'Dulce Tentación'                          // ← nombre de tu tienda
};
```

> 🔒 **Importante:** el archivo `environment.prod.ts` también debe tener los mismos valores. Nunca subas estos archivos a un repositorio público.

---

## Correr el Proyecto Localmente

```bash
npm start
```

Abre tu navegador en **http://localhost:4200**

La app recargará automáticamente cada vez que guardes un cambio en el código.

Para compilar para producción:
```bash
npm run build:prod
# Los archivos quedan en dist/tienda-online/browser/
```

---

## Crear Usuarios de Prueba

### Usuario Administrador

**Método 1 — Desde el dashboard de Supabase (recomendado):**

1. Ve a **Authentication** → **Users**
2. Haz clic en **Add user** → **Create new user**
3. Ingresa:
   - Email: `admin@tienda.com`
   - Password: `admin123`
4. Haz clic en **Create user**
5. Luego en el **SQL Editor** ejecuta:

```sql
UPDATE public.profiles
SET role = 'ADMIN'
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@tienda.com');
```

6. Verifica que funcionó:
```sql
SELECT email, role FROM auth.users u
JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'admin@tienda.com';
```
Debe mostrar `role = ADMIN`.

### Usuario Cliente

Simplemente **regístrate desde la app** en `/register`. El rol `USER` se asigna automáticamente.

Si el usuario se registra pero no puede iniciar sesión, ejecuta esto para confirmar el email:

```sql
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
```

### Credenciales de prueba

| Rol | Email | Contraseña | Acceso |
|-----|-------|-----------|--------|
| Admin | admin@tienda.com | admin123 | /admin/products, /admin/orders |
| Cliente | (el que registraste) | (el que pusiste) | /catalog, /cart, /my-orders |

---

## Funcionalidades Detalladas

### Vista de Cliente

#### Registro (`/register`)
- Formulario con nombre completo, teléfono, email y contraseña
- Validación de campos en tiempo real
- Confirmación de contraseña
- El perfil se crea automáticamente en la base de datos via trigger

#### Login (`/login`)
- Email y contraseña
- Mostrar/ocultar contraseña
- Redirección automática según rol:
  - USER → `/catalog`
  - ADMIN → `/admin/products`
- Mensaje de error claro si las credenciales son incorrectas

#### Catálogo (`/catalog`)
- Muestra todos los productos activos
- **Búsqueda** en tiempo real por nombre o descripción
- **Filtro** por categoría
- **Ordenamiento** por nombre, precio ascendente o descendente
- Emoji automático por categoría si el producto no tiene imagen
- Botón "Agregar al carrito" deshabilitado si no hay stock
- Notificación toast al agregar un producto

#### Carrito (`/cart`)
- Lista de productos agregados con imagen, nombre, precio unitario
- Aumentar o disminuir cantidad con botones + y −
- Eliminar producto individual
- Vaciar carrito completo
- Campo de notas opcional para el pedido
- Resumen con total calculado en tiempo real
- Botón "Confirmar pedido" que:
  1. Guarda el pedido en la base de datos
  2. Guarda cada ítem del pedido
  3. Abre un modal con botón de WhatsApp
- El link de WhatsApp incluye el número de pedido, lista de productos y total

#### Mis Pedidos (`/my-orders`)
- Lista de todos los pedidos del usuario logueado
- Ordenados del más reciente al más antiguo
- Muestra el ID corto del pedido, fecha, productos, total y estado
- Badge de color según estado:
  - 🟡 Pendiente
  - 🔵 Confirmado
  - 🟢 Entregado
  - 🔴 Cancelado

### Vista de Administrador

#### Gestión de Productos (`/admin/products`)
- Tabla con todos los productos (activos e inactivos)
- Botón **Nuevo Producto** abre un modal con formulario completo
- Campos del producto: nombre, categoría, descripción, precio, stock, imagen, estado
- Upload de imagen directamente a Supabase Storage
- Preview de la imagen antes de guardar
- Botón **Editar** — abre el mismo modal con los datos precargados
- Botón **Eliminar** — soft delete (el producto queda inactivo, no se borra)
- Feedback visual con toasts de éxito/error

#### Gestión de Pedidos (`/admin/orders`)
- Tabla con todos los pedidos de todos los clientes
- Muestra: ID pedido, nombre del cliente, teléfono, productos, total, fecha, estado
- **Estadísticas rápidas** en la parte superior: cantidad por estado
- **Filtro** por estado del pedido
- **Búsqueda** por nombre de cliente o ID de pedido
- Selector de estado en cada fila para cambiar directamente
- Los cambios se guardan inmediatamente en la base de datos

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                  NAVEGADOR (Cliente)                     │
│                                                          │
│  Angular SPA (Single Page Application)                  │
│  ┌──────────┐  ┌──────────┐  ┌─────────────────────┐   │
│  │  /login  │  │ /catalog │  │  /admin/products    │   │
│  │/register │  │   /cart  │  │  /admin/orders      │   │
│  └──────────┘  └──────────┘  └─────────────────────┘   │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS / REST API
                         │ Authorization: Bearer JWT
┌────────────────────────▼────────────────────────────────┐
│                    SUPABASE                              │
│                                                          │
│  ┌──────────────┐  ┌────────────────┐  ┌────────────┐  │
│  │  Auth (JWT)  │  │  PostgreSQL    │  │  Storage   │  │
│  │              │  │                │  │            │  │
│  │ - signUp     │  │ profiles       │  │ /products/ │  │
│  │ - signIn     │  │ products       │  │  (imgs)    │  │
│  │ - signOut    │  │ orders         │  │            │  │
│  │ - JWT refresh│  │ order_items    │  │            │  │
│  └──────────────┘  │                │  └────────────┘  │
│                    │  RLS Policies  │                   │
│                    │  (seguridad)   │                   │
│                    └────────────────┘                   │
└─────────────────────────────────────────────────────────┘
                         │ Hosting
┌────────────────────────▼────────────────────────────────┐
│                    VERCEL (CDN)                          │
│         Build estático de Angular + Edge Network         │
└─────────────────────────────────────────────────────────┘
```

### Flujo de autenticación

```
1. Usuario ingresa email + password
2. Angular llama → supabase.auth.signInWithPassword()
3. Supabase valida credenciales en auth.users
4. Supabase devuelve JWT (access_token + refresh_token)
5. Angular consulta public.profiles con el user_id
6. RLS de PostgreSQL valida que auth.uid() = profiles.id
7. Angular recibe el perfil con el rol (USER o ADMIN)
8. Angular navega según el rol
```

### Flujo de un pedido

```
1. Cliente agrega productos al carrito (CartService con Signals)
2. Cliente confirma pedido en /cart
3. Angular inserta registro en public.orders
4. Angular inserta registros en public.order_items (uno por producto)
5. RLS valida que user_id = auth.uid()
6. Angular genera link de WhatsApp con el resumen
7. Cliente hace clic → se abre WhatsApp con el mensaje listo
8. Admin recibe el mensaje y confirma el pedido
9. Admin cambia el estado en /admin/orders
10. Cliente ve el nuevo estado en /my-orders
```

---

## Seguridad

### Row Level Security (RLS)

Todas las tablas tienen RLS activado. Esto significa que **aunque alguien tenga la anon key de Supabase, no puede acceder a datos que no le corresponden**. La seguridad está en la base de datos, no solo en el frontend.

Resumen de políticas:

| Tabla | Usuario normal puede | Admin puede |
|-------|---------------------|-------------|
| profiles | Ver y editar solo el suyo | Ver todos |
| products | Ver solo los activos | Ver todos, crear, editar, eliminar |
| orders | Ver solo los suyos, crear | Ver todos, cambiar estado |
| order_items | Ver solo los de sus pedidos, crear | Ver todos |

### JWT

- El token expira en 1 hora
- Supabase lo refresca automáticamente
- Si el refresh falla, el usuario es redirigido al login
- El token viaja en el header `Authorization: Bearer <token>`

### Buenas prácticas aplicadas

- Nunca se guarda la contraseña en texto plano (bcrypt via Supabase)
- Los IDs son UUIDs aleatorios (no enumerables)
- Soft delete en productos (no se borran, quedan inactivos)
- Validación en frontend Y en la base de datos (CHECK constraints)
- Variables de entorno separadas para desarrollo y producción

---

## Desplegar en Vercel

### Paso 1 — Subir el código a GitHub

```bash
cd tienda-online
git init
git add .
git commit -m "tienda de postres inicial"
```

Crea un repositorio en [github.com](https://github.com/new) y luego:

```bash
git remote add origin https://github.com/TU-USUARIO/tienda-postres.git
git branch -M main
git push -u origin main
```

### Paso 2 — Conectar con Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesión con GitHub
2. Haz clic en **Add New Project**
3. Selecciona tu repositorio `tienda-postres`
4. Vercel detectará automáticamente que es un proyecto Angular
5. En la sección **Environment Variables** agrega:

| Variable | Valor |
|----------|-------|
| `SUPABASE_URL` | `https://XXXX.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJhbGci...` |

6. Haz clic en **Deploy**

### Paso 3 — Actualizar la URL en Supabase

Una vez que Vercel te dé la URL (ej: `tienda-postres.vercel.app`):

1. Ve a Supabase → **Authentication** → **URL Configuration**
2. Actualiza:
   - **Site URL:** `https://tienda-postres.vercel.app`
   - **Redirect URLs:** `https://tienda-postres.vercel.app/**`

### CI/CD automático

Cada vez que hagas `git push` a la rama `main`, Vercel redeploya automáticamente en 1-2 minutos. Para las ramas secundarias crea una URL de preview automática.

---

## Solución de Problemas Comunes

### ❌ "Credenciales incorrectas" al hacer login

**Causa más probable:** el email no está confirmado.

**Solución:**
```sql
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
```

O desactiva "Confirm email" en Authentication → Sign In / Providers → Email.

---

### ❌ La app carga indefinidamente después del login

**Causa:** el perfil no se creó en `public.profiles` porque el trigger falló.

**Solución:** el código ya tiene un fallback que crea el perfil si no existe. Si persiste, verifica manualmente:

```sql
SELECT u.email, p.id, p.role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id;
```

Si `p.id` es NULL para algún usuario, el perfil no se creó. Créalo manualmente:

```sql
INSERT INTO public.profiles (id, full_name, role)
SELECT id, split_part(email, '@', 1), 'USER'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);
```

---

### ❌ Error al subir imágenes

**Causa:** el bucket `products` no existe o no tiene políticas.

**Solución:** ve a Supabase → Storage → crea el bucket `products` como público y ejecuta las políticas de Storage del paso 4 de configuración.

---

### ❌ "NG5002: Unexpected token >" al compilar

**Causa:** arrow functions en templates HTML de Angular no están permitidas.

**Solución:** mueve la lógica a un método en el componente `.ts`:
```typescript
// En el .ts
toggleAlgo() { this.signal.update(v => !v); }

// En el .html
(click)="toggleAlgo()"
```

---

### ❌ Error "relation does not exist" en Supabase

**Causa:** el SQL no se ejecutó correctamente o se ejecutó parcialmente.

**Solución:** ve al SQL Editor y ejecuta nuevamente el `setup.sql` completo. Los `CREATE TABLE IF NOT EXISTS` y `DROP POLICY IF EXISTS` evitan errores de duplicados.

---

### ❌ Los productos no aparecen en el catálogo

**Causa:** la política RLS de `products_select` solo muestra productos con `active = true`.

**Verifica:**
```sql
SELECT name, active FROM public.products;
```

Si todos tienen `active = false`:
```sql
UPDATE public.products SET active = true;
```

---

## Escalabilidad Futura

| Cuando necesites | Solución |
|-----------------|----------|
| Más de 500MB de base de datos | Upgrade a Supabase Pro ($25/mes) |
| Pasarela de pagos | Integrar Culqi (Perú) o Stripe |
| Notificaciones automáticas | Supabase Edge Functions + Twilio |
| Búsqueda avanzada | Supabase Full Text Search (ya incluido en PostgreSQL) |
| App móvil | Angular + Ionic/Capacitor, mismos servicios |
| Múltiples tiendas | Agregar tabla `stores` + columna `store_id` en products |
| Dashboard de ventas | Supabase Analytics o integrar Chart.js |
| Imágenes optimizadas | Cloudinary free tier (25GB/mes) |

---

## Costos

| Servicio | Plan | Costo | Límites |
|----------|------|-------|---------|
| Supabase | Free | $0/mes | 500MB BD, 5GB storage, 50K usuarios |
| Vercel | Hobby | $0/mes | 100GB bandwidth, deploys ilimitados |
| GitHub | Free | $0/mes | Repos ilimitados |
| WhatsApp | deeplink | $0/mes | Ilimitado |
| **Total** | | **$0/mes** | — |

---

## Contacto y Soporte

- 📚 [Documentación Angular](https://angular.dev)
- 📚 [Documentación Supabase](https://supabase.com/docs)
- 📚 [Documentación Vercel](https://vercel.com/docs)
- 📚 [Bootstrap 5](https://getbootstrap.com/docs/5.3)
