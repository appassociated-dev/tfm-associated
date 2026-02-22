> **Categoría:** 3. Rendimiento

### 3.7 RNFT-050: Skeleton Screens con Mantine

**RNF Base:** RNF-050 (Skeleton Screens)

**Implementación con Mantine Skeleton:**

```typescript
// MemberCard.skeleton.tsx
export const MemberCardSkeleton = () => (
  <Card>
    <Group>
      <Skeleton height={50} circle />
      <Stack gap="xs" style={{ flex: 1 }}>
        <Skeleton height={16} width="70%" />
        <Skeleton height={12} width="40%" />
      </Stack>
    </Group>
    <Skeleton height={100} mt="md" />
  </Card>
);

// MembersList.tsx
const { data, isLoading } = useQuery(['members'], fetchMembers);

if (isLoading) {
  return (
    <Stack>
      {Array(5).fill(0).map((_, i) => <MemberCardSkeleton key={i} />)}
    </Stack>
  );
}
```

**Regla:** Toda vista con fetch de datos debe mostrar skeleton durante carga.
