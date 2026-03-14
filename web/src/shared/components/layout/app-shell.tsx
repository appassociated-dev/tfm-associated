import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import {
  AppShell,
  Badge,
  Box,
  Burger,
  Divider,
  Flex,
  Group,
  Menu,
  NavLink,
  Text,
  UnstyledButton,
  useMantineTheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import logoHorizontalWhite from '@/shared/assets/logo-horizontal-white.svg';
import isotipoWhite from '@/shared/assets/isotipo-white.svg';
import { useAuth } from '@/features/auth/context/use-auth';
import { usePermissions } from '@/features/auth/context/use-permissions';
import { SwitchTenantModal } from './switch-tenant-modal';
import classes from './app-shell.module.css';

// === Tipos ===

interface NavItem {
  label: string;
  path: string;
  /** Permiso requerido. null = siempre visible. */
  permission: string | null;
}

// === Constantes ===

/** Items de navegación del sidebar. */
const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', permission: null },
  { label: 'Socios', path: '/members', permission: 'membership:members:read' },
  { label: 'Tesorería', path: '/treasury', permission: 'treasury:*:read' },
  { label: 'Planes de Cuota', path: '/treasury/fee-plans', permission: 'treasury:fee-plans:read' },
  { label: 'Configuración', path: '/settings', permission: 'settings:*:read' },
];

// === Componente ===

/**
 * Layout principal de la aplicación autenticada.
 * Usa Mantine AppShell con header, sidebar y contenido principal.
 */
export function AppLayout() {
  const theme = useMantineTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, tenant, role, logout } = useAuth();
  const { hasPermission } = usePermissions();

  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure(false);
  const [switchTenantOpened, setSwitchTenantOpened] = useState(false);

  /** Filtra items de navegación según permisos del usuario. */
  const visibleNavItems = NAV_ITEMS.filter(
    (item) => item.permission === null || hasPermission(item.permission),
  );

  /** Cierra sesión y redirige al login. */
  async function handleLogout(): Promise<void> {
    await logout();
    navigate('/login');
  }

  /** Navega a una ruta y cierra el sidebar en móvil. */
  function handleNavigate(path: string): void {
    navigate(path);
    // Cerrar sidebar en móvil después de navegar
    if (mobileOpened) {
      toggleMobile();
    }
  }

  return (
    <>
      <AppShell
        header={{ height: 60 }}
        navbar={{
          width: 240,
          breakpoint: 'sm',
          collapsed: { mobile: !mobileOpened },
        }}
        padding="md"
      >
        {/* === Header === */}
        <AppShell.Header>
          <Flex justify="space-between" align="center" h="100%" px="md">
            {/* Burger para móvil */}
            <Group>
              <Burger
                opened={mobileOpened}
                onClick={toggleMobile}
                hiddenFrom="sm"
                size="sm"
                aria-label="Abrir menú de navegación"
              />
              <Text fw={600}>{tenant?.name ?? 'Associated'}</Text>
            </Group>

            {/* Menú de usuario */}
            <Menu shadow="md" width={240} position="bottom-end">
              <Menu.Target>
                <UnstyledButton>
                  <Group gap="xs">
                    <Box
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: theme.colors.brand[7],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                      }}
                    >
                      {getUserInitials(user?.name)}
                    </Box>
                    <Text size="sm" visibleFrom="sm">
                      {user?.name ?? 'Usuario'}
                    </Text>
                  </Group>
                </UnstyledButton>
              </Menu.Target>

              <Menu.Dropdown>
                {/* Información del usuario */}
                <Menu.Label>
                  <Text fw={600} size="sm">
                    {user?.name}
                  </Text>
                  <Text c="dimmed" size="xs">
                    {user?.email}
                  </Text>
                </Menu.Label>

                {role && (
                  <Box px="sm" pb="xs">
                    <Badge color="brand" variant="light" size="sm">
                      {role}
                    </Badge>
                  </Box>
                )}

                <Divider />

                {/* Cambiar de colectividad */}
                <Menu.Item onClick={() => setSwitchTenantOpened(true)}>
                  Cambiar colectividad
                </Menu.Item>

                {/* Cerrar sesión */}
                <Menu.Item color="red" onClick={handleLogout}>
                  Cerrar sesión
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Flex>
        </AppShell.Header>

        {/* === Sidebar === */}
        <AppShell.Navbar p="md" style={{ backgroundColor: theme.other.brandDark }}>
          {/* Logo */}
          <Box mb="lg">
            <img src={logoHorizontalWhite} alt="Associated" width={150} />
          </Box>

          {/* Links de navegación */}
          <Box style={{ flex: 1 }}>
            {visibleNavItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <NavLink
                  key={item.path}
                  label={item.label}
                  active={isActive}
                  onClick={() => handleNavigate(item.path)}
                  classNames={{
                    root: `${classes.navLink} ${isActive ? classes.navLinkActive : ''}`,
                    label: `${classes.navLinkLabel} ${isActive ? classes.navLinkLabelActive : ''}`,
                  }}
                />
              );
            })}
          </Box>

          {/* Footer del sidebar */}
          <Box mt="auto" pt="md" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <img src={isotipoWhite} alt="Associated" width={28} style={{ opacity: 0.4 }} />
          </Box>
        </AppShell.Navbar>

        {/* === Contenido principal === */}
        <AppShell.Main>
          <Outlet />
        </AppShell.Main>
      </AppShell>

      {/* Modal de cambio de tenant */}
      <SwitchTenantModal opened={switchTenantOpened} onClose={() => setSwitchTenantOpened(false)} />
    </>
  );
}

// === Utilidades privadas ===

/** Extrae las iniciales del nombre del usuario (máximo 2 caracteres). */
function getUserInitials(name: string | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
