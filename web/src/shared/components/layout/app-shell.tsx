import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import {
  ActionIcon,
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
  Tooltip,
  UnstyledButton,
  useComputedColorScheme,
  useMantineTheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconDashboard, IconUserPlus, IconReceipt, IconLayoutSidebar } from '@tabler/icons-react';
import logoHorizontal from '@/shared/assets/logo-horizontal.svg';
import logoHorizontalWhite from '@/shared/assets/logo-horizontal-white.svg';
import isotipo from '@/shared/assets/isotipo.svg';
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
  /** Icono del item de navegacion. */
  icon?: React.ComponentType<{ size?: number | string; stroke?: number }>;
}

interface NavSection {
  /** Titulo de la seccion (se muestra como encabezado). null = sin encabezado (ej. Dashboard). */
  title: string | null;
  items: NavItem[];
}

// === Constantes ===

/** Ancho del sidebar abierto en px. */
const NAVBAR_WIDTH = 240;

/** Ancho del sidebar colapsado en px (solo iconos). */
const NAVBAR_COLLAPSED_WIDTH = 70;

/**
 * Secciones de navegacion del sidebar agrupadas por bounded context.
 * Los permisos DEBEN coincidir con los permisos canonicos del backend
 * definidos en SYSTEM_ROLES (database-provisioning.service.ts).
 */
const NAV_SECTIONS: NavSection[] = [
  {
    title: null,
    items: [{ label: 'Dashboard', path: '/dashboard', permission: null, icon: IconDashboard }],
  },
  {
    title: 'Membresia',
    items: [
      {
        label: 'Nuevo Socio',
        path: '/members/new',
        permission: 'membership:members:create',
        icon: IconUserPlus,
      },
    ],
  },
  {
    title: 'Tesoreria',
    items: [
      {
        label: 'Planes de Cuota',
        path: '/treasury/fee-plans',
        permission: 'treasury:fee-plans:read',
        icon: IconReceipt,
      },
    ],
  },
];

// === Componente ===

/**
 * Layout principal de la aplicacion autenticada.
 * Usa Mantine AppShell con header, sidebar colapsable y contenido principal.
 */
export function AppLayout() {
  const theme = useMantineTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, tenant, role, logout } = useAuth();
  const { hasPermission } = usePermissions();

  const colorScheme = useComputedColorScheme('light');
  const isDark = colorScheme === 'dark';

  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure(false);
  const [desktopCollapsed, { toggle: toggleDesktop }] = useDisclosure(false);
  const [switchTenantOpened, setSwitchTenantOpened] = useState(false);

  // Logos adaptativos segun color scheme
  const currentLogo = isDark ? logoHorizontalWhite : logoHorizontal;
  const currentIsotipo = isDark ? isotipoWhite : isotipo;

  /**
   * Filtra secciones de navegacion segun permisos del usuario.
   * Solo se muestran secciones que tengan al menos un item visible.
   */
  const visibleSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) => item.permission === null || hasPermission(item.permission),
    ),
  })).filter((section) => section.items.length > 0);

  /** Cierra sesion y redirige al login. */
  async function handleLogout(): Promise<void> {
    await logout();
    navigate('/login');
  }

  /** Navega a una ruta y cierra el sidebar en movil. */
  function handleNavigate(path: string): void {
    navigate(path);
    if (mobileOpened) {
      toggleMobile();
    }
  }

  return (
    <>
      <AppShell
        header={{ height: 60 }}
        navbar={{
          width: {
            base: NAVBAR_WIDTH,
            sm: desktopCollapsed ? NAVBAR_COLLAPSED_WIDTH : NAVBAR_WIDTH,
          },
          breakpoint: 'sm',
          collapsed: { mobile: !mobileOpened },
        }}
        padding="lg"
      >
        {/* === Header === */}
        <AppShell.Header>
          <Flex justify="space-between" align="center" h="100%">
            {/* Brand: ancho fijo = sidebar width, alineado con el sidebar */}
            <Flex
              align="center"
              justify="space-between"
              px="md"
              h="100%"
              visibleFrom="sm"
              style={{
                width: desktopCollapsed ? NAVBAR_COLLAPSED_WIDTH : NAVBAR_WIDTH,
                borderRight: '1px solid var(--mantine-color-default-border)',
                flexShrink: 0,
              }}
            >
              {desktopCollapsed ? (
                /* Sidebar colapsado: isotipo con hover → toggle icon */
                <Tooltip label="Abrir menu" position="right" withArrow>
                  <UnstyledButton
                    onClick={toggleDesktop}
                    className={classes.isotipoToggle}
                    aria-label="Expandir menu de navegacion"
                  >
                    <img
                      src={currentIsotipo}
                      alt="Associated"
                      height={24}
                      className={classes.isotipoImg}
                    />
                    <IconLayoutSidebar
                      size={20}
                      stroke={1.5}
                      className={classes.isotipoToggleIcon}
                    />
                  </UnstyledButton>
                </Tooltip>
              ) : (
                /* Sidebar abierto: logo horizontal + toggle */
                <>
                  <img
                    src={currentLogo}
                    alt="Associated"
                    height={28}
                    className={classes.headerLogo}
                  />
                  <Tooltip label="Colapsar menu" position="bottom" withArrow>
                    <ActionIcon
                      variant="subtle"
                      onClick={toggleDesktop}
                      className={classes.headerToggle}
                      aria-label="Colapsar menu de navegacion"
                      size="sm"
                    >
                      <IconLayoutSidebar size={18} stroke={1.5} />
                    </ActionIcon>
                  </Tooltip>
                </>
              )}
            </Flex>

            {/* Movil: burger + logo */}
            <Group px="md" hiddenFrom="sm">
              <Burger
                opened={mobileOpened}
                onClick={toggleMobile}
                size="sm"
                aria-label="Abrir menu de navegacion"
              />
              <img src={currentLogo} alt="Associated" height={28} className={classes.headerLogo} />
            </Group>

            {/* Menu de usuario */}
            <Box px="md">
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

                  {tenant?.name && (
                    <>
                      <Divider />
                      <Menu.Label>
                        <Text size="xs" c="dimmed">
                          {tenant.name}
                        </Text>
                      </Menu.Label>
                    </>
                  )}

                  <Divider />

                  <Menu.Item onClick={() => setSwitchTenantOpened(true)}>
                    Cambiar colectividad
                  </Menu.Item>

                  <Menu.Item color="red" onClick={handleLogout}>
                    Cerrar sesion
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Box>
          </Flex>
        </AppShell.Header>

        {/* === Sidebar === */}
        <AppShell.Navbar p={desktopCollapsed ? 'xs' : 'md'} className={classes.navbar}>
          {/* Links de navegacion agrupados por seccion */}
          <Box style={{ flex: 1 }}>
            {visibleSections.map((section, sectionIndex) => (
              <Box key={section.title ?? `section-${sectionIndex}`}>
                {section.title && !desktopCollapsed && (
                  <Text className={classes.sectionHeader}>{section.title}</Text>
                )}
                {section.title && desktopCollapsed && (
                  <Divider className={classes.sectionDivider} />
                )}
                {section.items.map((item) => {
                  const isActive = location.pathname.startsWith(item.path);
                  const navLink = (
                    <NavLink
                      label={desktopCollapsed ? undefined : item.label}
                      leftSection={item.icon ? <item.icon size={20} stroke={1.5} /> : undefined}
                      active={isActive}
                      onClick={() => handleNavigate(item.path)}
                      classNames={{
                        root: `${classes.navLink} ${isActive ? classes.navLinkActive : ''} ${desktopCollapsed ? classes.navLinkCollapsed : ''}`,
                        label: `${classes.navLinkLabel} ${isActive ? classes.navLinkLabelActive : ''}`,
                      }}
                    />
                  );

                  if (desktopCollapsed) {
                    return (
                      <Tooltip
                        key={item.path}
                        label={item.label}
                        position="right"
                        withArrow
                        transitionProps={{ duration: 0 }}
                      >
                        {navLink}
                      </Tooltip>
                    );
                  }

                  return <Box key={item.path}>{navLink}</Box>;
                })}
              </Box>
            ))}
          </Box>

          {/* Footer del sidebar: nombre del tenant */}
          <Box mt="auto" pt="md" className={classes.sidebarFooter}>
            {!desktopCollapsed && tenant?.name && (
              <Text size="xs" className={classes.tenantName} lineClamp={1}>
                {tenant.name}
              </Text>
            )}
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

/** Extrae las iniciales del nombre del usuario (maximo 2 caracteres). */
function getUserInitials(name: string | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
