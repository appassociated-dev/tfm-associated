> **Categoría:** 3. Rendimiento

### 3.6 RNFT-021: Caché con React Query

**RNF Base:** RNF-021 (Optimización de Recursos)

**Configuración React Query:**

```typescript
// query-client.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 30 * 60 * 1000, // 30 minutos (antes cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

**Estrategias de caché por tipo de dato:**

| Dato                 | staleTime | gcTime   | Invalidación |
| -------------------- | --------- | -------- | ------------ |
| Listado members      | 5 min     | 30 min   | Mutation     |
| Detalle member       | 10 min    | 60 min   | Mutation     |
| Tipos de cuota       | 1 hora    | 24 horas | Manual       |
| Configuración tenant | 1 hora    | 24 horas | Manual       |

**Prefetching para navegación:**

```typescript
// MembersList.tsx
const prefetchMember = (id: string) => {
  queryClient.prefetchQuery({
    queryKey: ['member', id],
    queryFn: () => fetchMember(id),
  });
};

// On hover
<Link onMouseEnter={() => prefetchMember(member.id)}>
  {member.name}
</Link>
```
