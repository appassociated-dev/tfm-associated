> **Categoría:** 3. Rendimiento

### 3.1 RNFT-015: Tiempos de Carga Frontend

**RNF Base:** RNF-015 (Tiempo de Respuesta de Páginas)

**Configuración Vite para optimización:**

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          mantine: ['@mantine/core', '@mantine/hooks'],
          query: ['@tanstack/react-query'],
        },
      },
    },
    chunkSizeWarningLimit: 500, // KB
  },
  plugins: [
    react(),
    compression({ algorithm: 'brotli' }),
  ],
});
```

**Métricas objetivo (Lighthouse):**

| Métrica | Objetivo | Herramienta |
|---------|----------|-------------|
| FCP (First Contentful Paint) | < 1.8s | Lighthouse |
| LCP (Largest Contentful Paint) | < 2.5s | Lighthouse |
| TTI (Time to Interactive) | < 3.8s | Lighthouse |
| CLS (Cumulative Layout Shift) | < 0.1 | Lighthouse |
| Bundle size (gzip) | < 200KB inicial | `vite-bundle-analyzer` |

**Lazy loading de rutas:**

```typescript
// routes.tsx
const MembersPage = lazy(() => import('./pages/Members'));
const TreasuryPage = lazy(() => import('./pages/Treasury'));

<Routes>
  <Route path="/members" element={
    <Suspense fallback={<PageSkeleton />}>
      <MembersPage />
    </Suspense>
  } />
</Routes>
```
