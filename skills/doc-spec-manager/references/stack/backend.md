## 2. Backend

### 2.1 Lenguaje: TypeScript 5.9.x

**Seleccionado:** TypeScript

| Criterio                    | TypeScript   | C#/.NET      | Java/Spring   | Go        |
| --------------------------- | ------------ | ------------ | ------------- | --------- |
| Tipado estático             | ✅ Excelente | ✅ Excelente | ✅ Excelente  | ✅ Bueno  |
| Soporte DDD                 | ✅ Bueno     | ✅ Excelente | ✅ Excelente  | ⚠️ Manual |
| Full-stack (mismo lenguaje) | ✅ Sí        | ❌ No        | ❌ No         | ❌ No     |
| Curva aprendizaje           | ✅ Baja      | ⚠️ Media     | ⚠️ Media-Alta | ⚠️ Media  |
| Ecosistema npm              | ✅ Masivo    | N/A          | N/A           | ⚠️ Menor  |
| Tooling moderno             | ✅ Excelente | ✅ Bueno     | ⚠️ Pesado     | ✅ Bueno  |

**Justificación:**

- Tipado fuerte permite modelar Value Objects con precisión
- Mismo lenguaje en frontend y backend reduce context switching
- Decoradores nativos facilitan implementación de Clean Architecture
- Ecosistema npm ofrece librerías para casi cualquier necesidad
- Excelente soporte en IDEs (VS Code, WebStorm)

**Configuración recomendada (tsconfig.json):**

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### 2.2 Framework: NestJS 11.x

**Seleccionado:** NestJS

| Criterio               | NestJS             | Express    | Fastify    | Hono         |
| ---------------------- | ------------------ | ---------- | ---------- | ------------ |
| Arquitectura modular   | ✅ Nativa          | ❌ Manual  | ❌ Manual  | ❌ Manual    |
| Inyección dependencias | ✅ Nativa          | ❌ Externa | ❌ Externa | ❌ Externa   |
| OpenAPI/Swagger        | ✅ Integrado       | ⚠️ Manual  | ⚠️ Manual  | ⚠️ Manual    |
| Validación             | ✅ class-validator | ⚠️ Manual  | ⚠️ Manual  | ⚠️ Manual    |
| CQRS support           | ✅ @nestjs/cqrs    | ❌ No      | ❌ No      | ❌ No        |
| Documentación          | ✅ Excelente       | ✅ Buena   | ✅ Buena   | ⚠️ Creciendo |

**Justificación:**

- **Módulos nativos** → mapeo directo a Bounded Contexts (ADR-003)
- **Inyección de dependencias** → facilita Clean Architecture (ADR-009)
- **OpenAPI integrado** → documentación automática (ADR-010)
- **@nestjs/cqrs** → soporte para Command/Query separation
- **Guards y Interceptors** → implementación limpia de RBAC (ADR-007)

**Estructura de módulo alineada con ADR-003:**

```
src/
├── modules/
│   ├── membresia/
│   │   ├── application/
│   │   │   ├── commands/
│   │   │   ├── queries/
│   │   │   └── dtos/
│   │   ├── domain/
│   │   │   ├── aggregates/
│   │   │   ├── entities/
│   │   │   ├── value-objects/
│   │   │   ├── events/
│   │   │   └── repositories/  (interfaces)
│   │   ├── infrastructure/
│   │   │   ├── persistence/
│   │   │   ├── controllers/
│   │   │   └── services/
│   │   └── membresia.module.ts
```

### 2.3 Librerías Backend Complementarias

| Librería            | Propósito           | Versión                                              | ADR/RNF   |
| ------------------- | ------------------- | ---------------------------------------------------- | --------- |
| `@nestjs/passport`  | Autenticación       | 11.x                                                 | ADR-006   |
| `@nestjs/jwt`       | Tokens JWT          | 11.x                                                 | ADR-006   |
| `passport-jwt`      | Estrategia JWT      | 4.x                                                  | ADR-006   |
| `@nestjs/swagger`   | OpenAPI docs        | 11.x                                                 | ADR-010   |
| `class-validator`   | Validación DTOs     | 0.14.x                                               | RNF-008   |
| `class-transformer` | Serialización       | 0.5.x                                                | -         |
| `@nestjs/cqrs`      | CQRS pattern        | 11.x                                                 | ADR-009   |
| `@nestjs/schedule`  | Jobs programados    | 6.x                                                  | ADR-008   |
| `argon2`            | Hash passwords      | 0.44.x                                               | RNF-006   |
| `date-fns`          | Manipulación fechas | 4.x                                                  | -         |
| `sepa-xml`          | Generación SEPA     | 0.4.x _(pendiente de evaluación — posible abandono)_ | N4RF17-23 |
