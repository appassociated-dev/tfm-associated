> **Categoría:** 5. Usabilidad y Experiencia de Usuario

### 5.3 RNFT-056: PWA con Workbox

**RNF Base:** RNF-056 (Progressive Web App)

**Configuración Vite PWA:**

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Associated - Member Portal',
        short_name: 'Associated',
        theme_color: '#228be6',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.associated\.com\/api\/v1\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 300 },
            },
          },
        ],
      },
    }),
  ],
});
```

**Funcionalidad offline:**

| Recurso        | Estrategia   | Descripción        |
| -------------- | ------------ | ------------------ |
| Shell de app   | CacheFirst   | Siempre disponible |
| API datos      | NetworkFirst | Fallback a caché   |
| Imágenes       | CacheFirst   | Reducir tráfico    |
| Carnet digital | CacheFirst   | Disponible offline |
