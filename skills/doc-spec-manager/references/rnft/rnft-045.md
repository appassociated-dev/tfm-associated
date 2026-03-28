> **Categoría:** 5. Usabilidad y Experiencia de Usuario

### 5.1 RNFT-045: Diseño Responsive con Mantine

**RNF Base:** RNF-045 (Diseño Responsivo)

**Breakpoints Mantine:**

```typescript
// theme.ts
const theme = createTheme({
  breakpoints: {
    xs: '30em', // 480px
    sm: '48em', // 768px
    md: '64em', // 1024px
    lg: '74em', // 1184px
    xl: '90em', // 1440px
  },
});
```

**Uso de hooks responsive:**

```typescript
// Layout.tsx
import { useMediaQuery } from '@mantine/hooks';

const Layout = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <AppShell
      navbar={{ width: isMobile ? 0 : 250, breakpoint: 'sm' }}
      padding="md"
    >
      {isMobile ? <MobileNav /> : <DesktopNav />}
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
};
```

**Testing responsive:** Playwright con viewports móvil/tablet/desktop.
