> **Categoría:** 5. Usabilidad y Experiencia de Usuario

### 5.2 RNFT-046: Accesibilidad WCAG AA con Mantine

**RNF Base:** RNF-046 (Accesibilidad)

**Mantine incluye accesibilidad por defecto:**

- Focus visible en todos los elementos interactivos
- Roles ARIA correctos
- Labels asociados a inputs
- Contraste de colores WCAG AA

**Configuración adicional:**

```typescript
// Verificar contraste de colores personalizados
const theme = createTheme({
  colors: {
    brand: [/* asegurar ratio 4.5:1 mínimo */],
  },
});

// Skip to content link
<a href="#main-content" className="visually-hidden-focusable">
  Saltar al contenido
</a>
```

**Verificación:**

- axe-core en tests E2E
- Lighthouse Accessibility > 90
