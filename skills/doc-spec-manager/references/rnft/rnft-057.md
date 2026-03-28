> **Categoría:** 6. Mantenibilidad y Operaciones

### 6.1 RNFT-057: Documentación con OpenAPI

**RNF Base:** RNF-057 (Documentación Técnica)

**Swagger en NestJS:**

```typescript
// main.ts
const config = new DocumentBuilder()
  .setTitle('Associated API')
  .setDescription('API del ERP para colectividades')
  .setVersion('1.0')
  .addBearerAuth()
  .addApiKey({ type: 'apiKey', name: 'X-Tenant-Id', in: 'header' })
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

**Decoradores en controllers:**

```typescript
@ApiTags('Members')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Tenant-Id', required: true })
@Controller('members')
export class MembersController {

  @Get()
  @ApiOperation({ summary: 'Listar members del tenant' })
  @ApiResponse({ status: 200, type: [MemberDto] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  findAll(@Query() query: ListMembersQuery) { ... }
}
```

**Generación de tipos para frontend:**

```bash
# Generar tipos TypeScript desde OpenAPI
npx openapi-typescript http://localhost:3000/api-json -o ./src/api/types.ts
```

**Inventario de Endpoints:** El inventario formal de endpoints del sistema se define en `spec/013_inventario-de-endpoints.md` bajo el formato EP-NNN. Cada endpoint EP referencia el caso de uso (UC) que lo origina y las entidades (ENT) que expone. La especificación OpenAPI generada por `@nestjs/swagger` DEBE ser consistente con este inventario.
