## 8. Herramientas de Desarrollo

### 8.1 IDE y Extensiones

**Recomendado:** VS Code

**Extensiones esenciales:**

- ESLint
- Prettier
- Prisma
- Thunder Client / REST Client
- GitLens
- Error Lens

### 8.2 Linting y Formatting

| Herramienta | Propósito      | Configuración        |
| ----------- | -------------- | -------------------- |
| ESLint      | Linting TS/JS  | @typescript-eslint   |
| Prettier    | Formatting     | .prettierrc          |
| Husky       | Git hooks      | pre-commit           |
| lint-staged | Lint on commit | Solo archivos staged |

**Configuración Husky + lint-staged:**

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

### 8.3 Documentación

| Tipo         | Herramienta                     |
| ------------ | ------------------------------- |
| API          | Swagger/OpenAPI (auto-generado) |
| Código       | TSDoc comments                  |
| Arquitectura | Markdown + Mermaid diagrams     |
| ADRs         | Markdown (ya existentes)        |
