# Reporte de Bugs Backend -- Detectados durante Testing Manual Frontend

> **Fecha:** 16 de marzo de 2026
> **Branch:** mvp/frontend-fase1
> **Detectado por:** Testing manual del frontend fase 1
> **Severidad:** Bloqueante -- impide provisionar tenants y autenticar via HTTP

## Resumen Ejecutivo

Durante la puesta en marcha del frontend para testing manual, se detectaron 4 bugs en la capa HTTP del backend que impiden el flujo basico de provision de tenant + autenticacion. Los 4 bugs tienen una causa raiz comun: **los tests del backend testean handlers y controllers directamente como clases TypeScript, sin pasar por el servidor HTTP ni los guards de NestJS.** Esto deja sin cobertura la cadena completa request -> guards -> controller -> handler. El cuarto bug (nombre de BD de tenant con guiones en vez de underscores) evidencia que el flujo completo provision -> login -> operacion en tenant nunca se ejecuto end-to-end.

---

## Bug 1: @Public() faltante en endpoint de provision de tenant

**Estado:** Fix temporal aplicado
**Severidad:** Bloqueante
**Endpoint:** `POST /api/v1/tenants`

### Sintoma

El endpoint de provision de tenant retorna `401 Unauthorized` para cualquier request, incluso con el header `X-Api-Key` correcto.

### Causa raiz

En `api/src/identity/identity.module.ts` (lineas 96-103), se registran dos guards globales via `APP_GUARD`:

```typescript
// Guards globales (ADR-006 y ADR-007)
{
  provide: APP_GUARD,
  useClass: JwtAuthGuard,
},
{
  provide: APP_GUARD,
  useClass: PermissionsGuard,
},
```

El `JwtAuthGuard` (`api/src/shared/infrastructure/guards/jwt-auth.guard.ts`, linea 26) se ejecuta **antes** que el `SuperadminGuard` definido a nivel de endpoint en `api/src/identity/infrastructure/controllers/tenants.controller.ts` (linea 40).

```typescript
// tenants.controller.ts linea 40
@UseGuards(SuperadminGuard)
```

El orden de ejecucion real es:

1. `JwtAuthGuard` (global via APP_GUARD) -> **rechaza por falta de JWT** -> 401
2. `SuperadminGuard` (endpoint-level) -> **nunca se ejecuta**

Esto genera un problema de chicken-and-egg: no se puede tener un JWT sin usuarios, y no se pueden crear usuarios sin provisionar un tenant.

### Archivos afectados

| Archivo                                                             | Linea  | Detalle                                                  |
| ------------------------------------------------------------------- | ------ | -------------------------------------------------------- |
| `api/src/identity/identity.module.ts`                               | 96-103 | APP_GUARD registra JwtAuthGuard globalmente              |
| `api/src/shared/infrastructure/guards/jwt-auth.guard.ts`            | 26-36  | `canActivate()` delega a Passport si no es `@Public()`   |
| `api/src/identity/infrastructure/controllers/tenants.controller.ts` | 39-40  | Endpoint con `@Public()` + `@UseGuards(SuperadminGuard)` |
| `api/src/identity/infrastructure/auth/public.decorator.ts`          | 18     | Decorator que setea metadata `isPublic: true`            |

### Fix temporal aplicado

Se agrego el decorador `@Public()` en `tenants.controller.ts` (linea 39) para que `JwtAuthGuard` lo reconozca y haga bypass. El `SuperadminGuard` queda como unica autenticacion del endpoint via header `X-Api-Key`.

```typescript
// tenants.controller.ts lineas 37-40 (estado actual con fix)
@Post()
@HttpCode(HttpStatus.CREATED)
@Public()                       // <-- FIX TEMPORAL: bypass JwtAuthGuard global
@UseGuards(SuperadminGuard)     // SuperadminGuard valida X-Api-Key
```

Se agrego un comentario FIXME en lineas 23-27 documentando la situacion:

```typescript
/**
 * FIXME(temporal): @Public() anadido para bypasear JwtAuthGuard global.
 * Sin esto, el guard JWT rechaza antes de que SuperadminGuard valide el API Key.
 * Pendiente de revisar con el responsable de backend (chicken-and-egg: no se puede
 * tener JWT si no hay usuarios, y no hay usuarios sin provisionar tenant).
 */
```

Tambien se configuro `SUPERADMIN_API_KEY` en `.env`.

### Fix definitivo propuesto

Evaluar si `@Public()` es el enfoque correcto para este endpoint o si se necesita un mecanismo de guard exclusion mas granular. El `SuperadminGuard` ya valida la API Key, por lo que `@Public()` + `SuperadminGuard` es funcionalmente correcto. La alternativa seria un guard compuesto que combine ambas logicas.

---

## Bug 2: Regex sobre-escapada en generador de bridges Prisma

**Estado:** Corregido
**Severidad:** Bloqueante
**Script:** `api/scripts/generate-prisma-bridges.js`

### Sintoma

Al iniciar el backend, los modelos de Prisma (`client.tenant`, `client.user`, etc.) eran todos `undefined`. El `PrismaClient` se creaba sin conocimiento de ningun modelo, lo que causaba errores en cualquier operacion de base de datos.

### Causa raiz

El script `generate-prisma-bridges.js` genera archivos `index.js` (bridges CJS) para los clientes Prisma generados. Estos bridges leen el archivo `internal/class.ts` generado por Prisma y extraen informacion critica mediante regex: `inlineSchema`, `runtimeDataModel`, `parameterizationSchema`.

**El bug:** Las regex en el template literal tenian 8 backslashes (`\\\\\\\\`) donde se necesitaban 4 (`\\\\`). En un template literal de JavaScript:

- 4 backslashes (`\\\\`) en el source -> 2 backslashes literales en el string -> regex busca 1 backslash literal
- 8 backslashes (`\\\\\\\\`) en el source -> 4 backslashes literales en el string -> regex busca 2 backslashes literales

El contenido real en `internal/class.ts` usa escapes con 1 backslash. Las regex con 8 backslashes nunca matcheaban, los fallbacks se usaban (schema vacio, models vacio), y `PrismaClient` se creaba sin modelos.

### Fix aplicado

Se corrigieron las 4 regex del template `BRIDGE_TEMPLATE` en `api/scripts/generate-prisma-bridges.js`. Estado actual corregido (lineas 31-38):

```javascript
const inlineSchemaMatch = classContent.match(/"inlineSchema":\\s*"((?:[^"\\\\]|\\\\.)*)"/);
const inlineSchema = inlineSchemaMatch ? JSON.parse('"' + inlineSchemaMatch[1] + '"') : '';

const runtimeDataModelMatch = classContent.match(
  /config\\.runtimeDataModel\\s*=\\s*JSON\\.parse\\("((?:[^"\\\\]|\\\\.)*)"/,
);
const runtimeDataModel = runtimeDataModelMatch
  ? JSON.parse(JSON.parse('"' + runtimeDataModelMatch[1] + '"'))
  : { models: {}, enums: {}, types: {} };

const paramStringsMatch = classContent.match(/strings:\\s*JSON\\.parse\\("((?:[^"\\\\]|\\\\.)*)"/);
const paramGraphMatch = classContent.match(/graph:\\s*"((?:[^"\\\\]|\\\\.)*)"/);
```

Se regeneraron ambos bridges (`prisma/main/generated/index.js` y `prisma/tenant/generated/index.js`).

### Archivos afectados

| Archivo                                  | Detalle                                       |
| ---------------------------------------- | --------------------------------------------- |
| `api/scripts/generate-prisma-bridges.js` | Template BRIDGE_TEMPLATE con regex corregidas |
| `api/prisma/main/generated/index.js`     | Bridge regenerado                             |
| `api/prisma/tenant/generated/index.js`   | Bridge regenerado                             |

---

## Bug 3: PermissionsGuard recibe permissions como string en vez de array

**Estado:** Pendiente de fix
**Severidad:** Bloqueante (afecta cualquier endpoint con `@RequirePermissions()`)
**Guard:** `api/src/shared/infrastructure/guards/permissions.guard.ts`

### Sintoma

Despues de provisionar un tenant exitosamente y hacer login, cualquier request autenticada a un endpoint protegido con `@RequirePermissions()` lanza:

```
TypeError: userPermissions.some is not a function
```

Esto indica que `userPermissions` no es un array (probablemente es un string).

### Investigacion

Se rastreo el flujo completo de permisos desde el seed hasta el guard:

#### Paso 1: Seed de roles (donde se origina el problema)

En `api/src/identity/infrastructure/services/database-provisioning.service.ts`, linea 189:

```typescript
await this.prisma.role.create({
  data: {
    id: roleId,
    code: role.code,
    name: role.name,
    description: role.description,
    permissions: JSON.stringify(role.permissions), // <-- BUG: doble serializacion
    isSystem: true,
    tenantId: tenantId ?? null,
  },
});
```

El campo `permissions` en el schema Prisma (`api/prisma/main/schema.prisma`, linea 74) es de tipo `Json`:

```prisma
permissions Json    @default("[]")
```

Prisma serializa automaticamente valores a JSON cuando el campo es tipo `Json`. Al hacer `JSON.stringify(role.permissions)` manualmente, el valor se **doble-serializa**:

- `role.permissions` para PRESIDENT es `['*']` (un array JS)
- `JSON.stringify(['*'])` produce el string `'["*"]'`
- Prisma recibe `'["*"]'` (un string) y lo almacena como JSON string: `"[\"*\"]"`
- Al leerlo, Prisma auto-parsea el JSON y devuelve... el string `'["*"]'` (no el array)

#### Paso 2: Login handler lee los permisos

En `api/src/identity/application/commands/login.handler.ts`, linea 93:

```typescript
const permissions = (membership.role.permissions as string[]) ?? [];
```

El cast `as string[]` es una operacion de TypeScript en compilacion. En runtime, `membership.role.permissions` es el string `'["*"]'`, y el cast no hace nada. La variable `permissions` termina siendo un **string**, no un array.

#### Paso 3: JWT payload incluye el string

En `login.handler.ts`, lineas 96-103:

```typescript
const payload: JwtPayload = {
  sub: user.id.toValue(),
  tenantId: membership.tenant.id,
  email: user.email.value,
  name: user.name,
  rol: membership.role.code,
  permissions, // <-- string '["*"]' en vez de array ['*']
};
```

El JWT se firma con `permissions` como string. Cuando se decodifica, `req.user.permissions` es un string.

#### Paso 4: JwtStrategy propaga el valor tal cual

En `api/src/identity/infrastructure/auth/jwt.strategy.ts`, lineas 27-43:

```typescript
validate(payload: JwtPayload): {
  userId: string;
  tenantId: string;
  email: string;
  name: string;
  rol: string;
  permissions: string[];
} {
  return {
    userId: payload.sub,
    tenantId: payload.tenantId,
    email: payload.email,
    name: payload.name,
    rol: payload.rol,
    permissions: payload.permissions,  // <-- pasa el string tal cual
  };
}
```

#### Paso 5: PermissionsGuard llama .some() sobre el string

En `api/src/shared/infrastructure/guards/permissions.guard.ts`, linea 59:

```typescript
private hasPermission(userPermissions: string[], required: string): boolean {
  return userPermissions.some((granted) => {  // <-- TypeError: string no tiene .some()
```

El parametro `userPermissions` es en realidad un string (ej: `'["*"]'`), no un `string[]`. Los strings no tienen metodo `.some()`.

### Causa raiz confirmada

**Doble serializacion JSON** en `database-provisioning.service.ts` linea 189. El `JSON.stringify()` es innecesario porque Prisma ya serializa automaticamente los campos `Json`.

### Fix propuesto

**Opcion A (recomendada): Eliminar JSON.stringify en el seed**

En `api/src/identity/infrastructure/services/database-provisioning.service.ts`, linea 189, cambiar:

```typescript
// ANTES (bug)
permissions: JSON.stringify(role.permissions),

// DESPUES (fix)
permissions: role.permissions,
```

Esto requiere tambien re-provisionar tenants existentes o ejecutar un script de migracion de datos que parsee los permisos doble-serializados.

**Opcion B (defensiva): Parsear en el login handler**

En `api/src/identity/application/commands/login.handler.ts`, linea 93:

```typescript
// ANTES
const permissions = (membership.role.permissions as string[]) ?? [];

// DESPUES (defensivo)
const rawPermissions = membership.role.permissions;
const permissions: string[] = Array.isArray(rawPermissions)
  ? rawPermissions
  : typeof rawPermissions === 'string'
    ? JSON.parse(rawPermissions)
    : [];
```

**Recomendacion: aplicar ambas opciones** -- la A para corregir la causa raiz, la B como defensa en profundidad.

### Archivos afectados

| Archivo                                                                     | Linea | Detalle                                     |
| --------------------------------------------------------------------------- | ----- | ------------------------------------------- |
| `api/src/identity/infrastructure/services/database-provisioning.service.ts` | 189   | `JSON.stringify()` innecesario (causa raiz) |
| `api/src/identity/application/commands/login.handler.ts`                    | 93    | Cast `as string[]` no convierte en runtime  |
| `api/src/identity/application/commands/switch-tenant.handler.ts`            | 58    | Mismo patron con cast `as string[]`         |
| `api/src/identity/infrastructure/auth/jwt.strategy.ts`                      | 41    | Propaga el valor sin validar tipo           |
| `api/src/shared/infrastructure/guards/permissions.guard.ts`                 | 59    | `.some()` falla sobre string                |

---

## Bug 4: Tenant database name con guiones en vez de underscores

**Estado:** Pendiente de fix
**Severidad:** Bloqueante (afecta cualquier operacion en BD de tenant)
**Servicio:** `api/src/identity/infrastructure/services/database-provisioning.service.ts`

### Sintoma

Al crear tipos de socio despues de provisionar el tenant, Prisma lanza:

```
P1003: DatabaseDoesNotExist
database "tenant_2d6a5b40-61eb-4d69-8c4e-a5f39f53df90" does not exist
```

Pero el log de provision muestra que la BD se creo como:

```
associated_2d6a5b40_61eb_4d69_8c4e_a5f39f53df90
```

### Causa raiz

Hay una discrepancia en el nombre de la BD del tenant entre el momento de creacion y el momento de conexion:

- **Creacion (provision):** El nombre usa underscores: `associated_2d6a5b40_61eb_4d69_8c4e_a5f39f53df90`
- **Conexion (runtime):** El template `DATABASE_TENANT_URL` reemplaza `{tenantId}` con el UUID raw que contiene guiones: `tenant_2d6a5b40-61eb-4d69-8c4e-a5f39f53df90`

PostgreSQL interpreta los guiones como operadores de resta si no se escapan, y en este caso la BD con guiones simplemente no existe porque se creo con underscores.

### Archivos afectados

| Archivo                                                                     | Detalle                                   |
| --------------------------------------------------------------------------- | ----------------------------------------- |
| `api/src/identity/infrastructure/services/database-provisioning.service.ts` | Genera nombre de BD con underscores       |
| `DATABASE_TENANT_URL` en `.env`                                             | Template usa `{tenantId}` sin transformar |
| Servicio de resolucion de tenant (PrismaTenantService o similar)            | Construye connection string con UUID raw  |

### Fix propuesto

Asegurar que el mismo algoritmo de transformacion de nombre se use tanto al crear la BD como al conectarse. Opciones:

- Normalizar el UUID (reemplazar guiones por underscores) en ambos lugares
- Usar el campo `databaseName` del tenant (que ya se persiste en la tabla `tenants`) como fuente de verdad para la conexion

---

## Causa Raiz Comun

Los 4 bugs comparten la misma causa raiz estructural: **los tests del backend no pasan por la capa HTTP**.

El backend usa tests unitarios que instancian handlers y controllers directamente como clases TypeScript, invocando sus metodos sin levantar el servidor HTTP de NestJS. Esto significa que:

1. **Los guards globales (APP_GUARD) nunca se ejecutan** en los tests. El Bug 1 (JwtAuthGuard bloqueando antes de SuperadminGuard) y el Bug 3 (PermissionsGuard recibiendo tipo incorrecto) solo se manifiestan cuando un request HTTP real atraviesa la cadena completa de guards.

2. **Los bridges CJS no se usan en los tests** si los tests importan PrismaClient directamente o usan mocks. El Bug 2 (regex sobre-escapada) solo se manifiesta cuando el proceso Node.js real carga el `index.js` generado.

3. **La serializacion JSON de Prisma no se prueba end-to-end**. Los tests mockearon los repositorios, por lo que la doble serializacion del Bug 3 nunca fue ejercitada con datos reales de la base de datos.

En resumen: la piramide de testing carece de la capa de integracion HTTP. Los tests unitarios verifican logica de negocio pero no la infraestructura que conecta esa logica con el mundo exterior.

Este problema se extiende mas alla de los guards: el flujo completo de provision -> login -> operacion en tenant nunca se ejecuto end-to-end contra una base de datos real en un test automatizado. El Bug 4 (nombre de BD con guiones) solo se manifiesta cuando se crea un tenant real y despues se intenta operar en su BD -- un flujo que ningun test cubre.

---

## Recomendaciones

### R1. Incorporar capa de tests de integracion HTTP

**Que:** Agregar una capa de tests que levante el servidor NestJS completo (con guards, middleware, Prisma real) y ejecute requests HTTP con supertest.

**Por que:** Los 4 bugs detectados comparten la misma causa raiz: los tests actuales testean handlers/controllers como clases TypeScript sin pasar por HTTP. Los guards globales (APP_GUARD), la serializacion de Prisma, y la resolucion de conexiones de tenant nunca se ejercitan en los tests.

**Como:** Usar `@nestjs/testing` con `createNestApplication()` + `supertest`. Configurar un `TestingModule` que use la BD real de Docker (no mocks). Ejemplo minimo:

```typescript
const moduleRef = await Test.createTestingModule({
  imports: [AppModule],
}).compile();

const app = moduleRef.createNestApplication();
app.setGlobalPrefix('api');
app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
await app.init();

await request(app.getHttpServer())
  .post('/api/v1/tenants')
  .set('X-Api-Key', 'test-key')
  .send({ name: 'Test', cif: 'G12345678', ... })
  .expect(201);
```

**Prioridad:** Alta. Deberia ser el primer cambio antes de seguir desarrollando features.

### R2. Agregar test E2E del flujo critico provision -> login -> operacion

**Que:** Un unico test que ejecute el flujo completo: provisionar tenant -> login -> crear tipo de socio (o cualquier operacion en la BD del tenant).

**Por que:** Este flujo cruza 3 BCs (Identity, Membership/Treasury), 2 bases de datos (main + tenant), y toda la cadena de guards. Los Bugs 1, 3 y 4 solo se detectan ejecutando este flujo end-to-end.

**Como:** Un test de Playwright o supertest que encadene los 3 requests y verifique que todo funciona. Puede ser un "smoke test" que corra en CI.

**Prioridad:** Alta.

### R3. Agregar validacion defensiva en PermissionsGuard

**Que:** Parsear `user.permissions` defensivamente antes de llamar `.some()`, aceptando tanto array como string JSON.

**Por que:** Defensa en profundidad. Aunque se corrija la causa raiz (Bug 3), un JWT viejo o un cambio futuro en el schema podria volver a enviar permisos como string. El guard debe ser resiliente.

**Como:** Implementar `parsePermissions(raw: unknown): string[]` que maneje array nativo, string JSON, y fallback a `[]`.

**Prioridad:** Media. Se complementa con el fix de la causa raiz.

### R4. Revisar patron de provisioning (SuperadminGuard vs JWT)

**Que:** Definir la solucion definitiva para la autenticacion del endpoint de provision: `@Public()` + `SuperadminGuard` (actual), un guard compuesto `ApiKeyOrJwtGuard`, o un mecanismo de bootstrap separado.

**Por que:** El fix actual (`@Public()` + SuperadminGuard) es funcionalmente correcto pero el equipo debe validar que es el approach deseado. El endpoint queda protegido por API Key, no por JWT.

**Como:** Reunion tecnica con el equipo backend para decidir. Las opciones son: (a) mantener `@Public()` + SuperadminGuard como solucion definitiva, (b) crear un guard compuesto, (c) crear un CLI de bootstrap separado del API.

**Prioridad:** Media. El fix temporal funciona.

### R5. Auditar campos Json de Prisma para doble serializacion

**Que:** Buscar todos los `JSON.stringify()` que escriben a campos Prisma de tipo `Json` y eliminarlos.

**Por que:** Prisma auto-serializa los campos `Json`. Hacer `JSON.stringify()` encima causa doble serializacion, que se manifiesta como tipos incorrectos al leer (string en vez de array/object). El Bug 3 es un caso confirmado; puede haber mas.

**Como:** `grep -rn "JSON.stringify" api/src/ | grep -i "create\|update\|upsert"` y revisar cada resultado contra el schema Prisma.

**Prioridad:** Media.

### R6. Agregar test de integracion para el script de bridges Prisma

**Que:** Un test que ejecute `generate-prisma-bridges.js` y verifique que el `index.js` generado puede instanciar un PrismaClient funcional con modelos definidos.

**Por que:** El Bug 2 (regex sobre-escapada) podria reaparecer si alguien modifica el script. Un test automatizado lo detectaria inmediatamente.

**Como:** Test que ejecuta el script, importa el bridge, instancia el cliente, y verifica que `Object.keys(client)` incluye los modelos esperados (`tenant`, `user`, `role`, etc).

**Prioridad:** Baja. El fix ya esta aplicado y es estable.

### R7. Agregar regla lint para casts inseguros sobre campos Prisma Json

**Que:** Detectar patrones como `(field as string[])` sobre campos Prisma `Json` que no tienen efecto en runtime.

**Por que:** El cast `as string[]` da falsa seguridad -- TypeScript no queja, pero en runtime el valor puede ser cualquier cosa que Prisma deserialice del campo JSON. El Bug 3 se hubiera evitado si el linter rechazara este patron.

**Como:** Regla ESLint custom o usar `@typescript-eslint/no-unsafe-type-assertion` (si esta disponible). Como minimo, documentar la convencion: "Nunca castear campos Json -- siempre parsear y validar en runtime".

**Prioridad:** Baja.

---

## Estado Actual

| Bug | Estado       | Fix aplicado                                         | Archivo modificado                                                                       |
| --- | ------------ | ---------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1   | Fix temporal | `@Public()` + `SUPERADMIN_API_KEY` en `.env`         | `api/src/identity/infrastructure/controllers/tenants.controller.ts`                      |
| 2   | Corregido    | Regex de 8 a 4 backslashes + regeneracion de bridges | `api/scripts/generate-prisma-bridges.js`                                                 |
| 3   | Pendiente    | --                                                   | `api/src/identity/infrastructure/services/database-provisioning.service.ts` (causa raiz) |
| 4   | Pendiente    | --                                                   | database-provisioning.service.ts / tenant connection resolution                          |

## Archivos Modificados (fixes temporales y definitivos)

| Archivo                                                             | Cambio                                           |
| ------------------------------------------------------------------- | ------------------------------------------------ |
| `api/src/identity/infrastructure/controllers/tenants.controller.ts` | Agregado `@Public()` + import + comentario FIXME |
| `api/.env`                                                          | Agregado `SUPERADMIN_API_KEY`                    |
| `api/scripts/generate-prisma-bridges.js`                            | Corregidas 4 regex en BRIDGE_TEMPLATE            |
| `api/prisma/main/generated/index.js`                                | Regenerado con bridge corregido                  |
| `api/prisma/tenant/generated/index.js`                              | Regenerado con bridge corregido                  |
