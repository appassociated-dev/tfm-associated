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
