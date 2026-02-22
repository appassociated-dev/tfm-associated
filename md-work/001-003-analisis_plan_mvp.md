# Análisis del plan de fases del MVP

## Resumen ejecutivo

La estrategia de dividir el MVP en tres fases con gradiente progresivo backend→frontend es **técnicamente sólida** y está bien fundamentada. El análisis de dependencias entre casos de uso reveló **un problema de bloqueo crítico** y **una consideración moderada** que se resuelven con dos ajustes:

1. **Crítico:** Mover UC-010 (Gestión de ejercicios) backend de Fase 2 a Fase 1.
2. **Moderado:** Intercambiar UC-007 (Estados del socio) backend a Fase 1 y UC-020 (Cargos manuales) backend a Fase 2.

Ambos ajustes mantienen la distribución 12/5/5 backend por fase y no alteran los totales globales (19 backend / 17 frontend).

---

## 1. Valoración de la estrategia general

### 1.1. División en fases con gradiente backend→frontend

| Fase | Backend | Frontend | Ratio B/F |
|------|---------|----------|-----------|
| F1 (original) | 11 (69%) | 5 (31%) | 2.2:1 |
| F2 (original) | 6 (43%) | 8 (57%) | 0.75:1 |
| F3 (original) | 2 (33%) | 4 (67%) | 0.5:1 |

**Veredicto: buena estrategia.** Razones:

1. **Reduce el riesgo de integración.** Frontloading del backend garantiza que las APIs están estabilizadas antes de que el frontend las consuma en volumen. Esto evita el patrón frecuente de "reescribir el frontend porque la API cambió".

2. **Permite validación temprana del modelo de dominio.** Las fases iniciales consolidan el core de BC-Identity, BC-Membership y BC-Treasury sin la presión de sincronizar con la UI. Los Aggregates, Value Objects y Domain Events quedan definidos e integrados antes de exponerlos al usuario final.

3. **El gradiente es progresivo, no abrupto.** La Fase 1 ya incluye 5 tareas de frontend (login, alta de socio, baja, planes de cuota, suscripciones), lo cual aporta un producto mínimamente demostrable desde el inicio. No es un "backend silencioso" que no puede mostrarse.

4. **Las fases finales se benefician de APIs estables.** En Fase 2 y Fase 3, el frontend puede avanzar con contratos de API ya consolidados, reduciendo la necesidad de mocks y retrabajo.

### 1.2. Selección de 19 UCs para el MVP

La selección cubre el ciclo de vida completo del socio y la gestión financiera básica:

- **Identidad**: provisión, autenticación, roles → ciclo de onboarding del tenant.
- **Membresía**: tipos, altas, bajas, estados, ejercicios → lifecycle del socio.
- **Tesorería**: planes, suscripciones, cargos, cobros, SEPA → ciclo financiero completo.
- **Transversales**: importación masiva, dashboard, gráficos → operativa y visibilidad.

Es una selección coherente. No se han incluido UCs secundarios (comunicaciones, documentos, eventos) que pueden diferirse sin afectar al MVP. La exclusión de UC-022 (workflow de morosidad) es aceptable: UC-013 puede implementar la baja por impago con un flujo simplificado.

### 1.3. Distribución por Bounded Context

| BC | Backend | Frontend | Total |
|----|---------|----------|-------|
| BC-Identity | 3 | 2 | 5 |
| BC-Membership | 6 | 5 | 11 |
| BC-Treasury | 8 | 8 | 16 |
| Transversal | 2 | 2 | 4 |

BC-Treasury concentra el 44% de las tareas. Esto refleja correctamente la complejidad del dominio financiero (planes, suscripciones, cargos, cobros, SEPA). No hay desbalance artificial.

---

## 2. Análisis de dependencias: fase por fase

### Grafo de dependencias entre los UCs del MVP

```
UC-001 (Tenant)
  └──▶ UC-002 (Autenticación)
        └──▶ [Todos los demás UCs]

UC-008 (Tipos de socio)
  ├──▶ UC-006 (Ficha de socio)
  ├──▶ UC-017 (Planes de cuota)
  │     └──▶ UC-018 (Suscripciones)
  │           └──▶ UC-019 (Cargos periódicos)
  │                 └──▶ UC-023 (Remesas SEPA)
  │                       └──▶ UC-024 (Devoluciones SEPA)
  └──▶ UC-010 (Ejercicios)
        └──▶ UC-019 (Cargos periódicos) [evento FiscalYearOpened]

UC-010 (Ejercicios)
  └──▶ UC-011 (Alta de socio) [precondición: ejercicio abierto]
        └──▶ UC-018 (Suscripciones) [dispara creación]
              └──▶ UC-019 (Cargos periódicos)

UC-007 (Estados) ──▶ UC-013 (Baja de socio) [máquina de transiciones]
UC-011 (Alta de socio) ──▶ UC-006 (Ficha de socio) [crea el Member]

UC-020 (Cargos manuales) ──▶ UC-021 (Cobros) [cargos pendientes]
UC-019 (Cargos periódicos) ──▶ UC-021 (Cobros) [cargos pendientes]
UC-056 (Importación masiva) [independiente, crea socios]

UC-064, UC-065 (Dashboard/Gráficos) [solo lectura, sin dependencias de escritura]
```

### 2.1. Fase 1 — Análisis sobre el plan original

**Backend (11 tareas originales):**

| UC | Dependencias satisfechas en F1 | Estado |
|----|-------------------------------|--------|
| UC-001 | Ninguna necesaria | OK |
| UC-002 | UC-001 ✓ | OK |
| UC-006 | UC-008 ✓ | OK |
| UC-008 | Ninguna necesaria | OK |
| UC-011 | UC-008 ✓, UC-017 ✓, **UC-010 ✗** | **BLOQUEADO** |
| UC-013 | **UC-007 ✗** (parcial) | Riesgo de retrabajo |
| UC-017 | UC-008 ✓ | OK |
| UC-018 | UC-011 ✓, UC-017 ✓ | OK |
| UC-019 | UC-018 ✓, **UC-010 ✗** | **BLOQUEADO** |
| UC-020 | Ninguna necesaria | OK |
| UC-021 | UC-019 ✓, UC-020 ✓ | OK |

**Frontend (5 tareas):**

| UC | Backend disponible en F1 | Estado |
|----|--------------------------|--------|
| UC-002 | ✓ | OK |
| UC-011 | ✓ (si se resuelve UC-010) | Condicionado |
| UC-013 | ✓ | OK |
| UC-017 | ✓ | OK |
| UC-018 | ✓ | OK |

### 2.2. Fase 2 — Análisis sobre el plan original

**Backend (6 tareas originales):**

| UC | Dependencias satisfechas | Estado |
|----|--------------------------|--------|
| UC-004 | UC-001 (F1) ✓ | OK |
| UC-007 | Miembros existentes (F1) ✓ | OK |
| UC-010 | Ninguna necesaria | OK |
| UC-023 | Cargos generados (F1) ✓ | OK |
| UC-024 | UC-023 ✓ (misma fase) | OK (orden interno) |
| UC-056 | Ninguna necesaria | OK |

**Frontend (8 tareas):**

| UC | Backend disponible | Estado |
|----|-------------------|--------|
| UC-006 | F1 ✓ | OK |
| UC-008 | F1 ✓ | OK |
| UC-019 | F1 ✓ | OK |
| UC-020 | F1 ✓ | OK |
| UC-021 | F1 ✓ | OK |
| UC-023 | F2 ✓ (orden interno) | OK |
| UC-024 | F2 ✓ (orden interno) | OK |
| UC-056 | F2 ✓ (orden interno) | OK |

### 2.3. Fase 3 — Análisis sobre el plan original

| UC | Tipo | Dependencias satisfechas | Estado |
|----|------|--------------------------|--------|
| UC-001 | Front | Backend F1 ✓ | OK |
| UC-010 | Front | Backend F2 ✓ | OK |
| UC-064 | Back+Front | Solo lectura, datos acumulados | OK |
| UC-065 | Back+Front | Solo lectura, datos históricos | OK |

**Fase 3 no presenta problemas de dependencias.**

---

## 3. Problemas detectados

### 3.1. CRÍTICO — UC-010 (Gestión de ejercicios) debe estar en Fase 1 backend

**Problema:** UC-010 está asignado a Fase 2 backend, pero dos UCs de Fase 1 dependen de él.

**Evidencia directa de la especificación:**

1. **UC-011 (Alta simple de socio)** — Precondiciones:
   > *"Ejercicio activo abierto"*
   >
   > FE-5: *"Sin ejercicio abierto → bloqueante"*

   Sin UC-010 implementado, no existe el concepto de ejercicio fiscal en el sistema. UC-011 no puede dar de alta socios porque la precondición "ejercicio activo abierto" no se cumple.

2. **UC-019 (Generación masiva de cargos periódicos)** — Dependencia por evento:
   > *El evento `FiscalYearOpened` activa la generación mensual de cargos en BC-Treasury.*

   Sin UC-010, no se emite `FiscalYearOpened`, y el cron job de UC-019 no tiene contexto de ejercicio sobre el cual generar cargos.

**Impacto:** Si UC-010 permanece en Fase 2, UC-011 y UC-019 no pueden funcionar de forma completa en Fase 1. Esto invalida gran parte del backend de Fase 1, ya que UC-018 (suscripciones) depende de UC-011, y UC-021 (cobros) depende de UC-019.

**Cadena de bloqueo:**
```
UC-010 ausente en F1
  └──▶ UC-011 bloqueado (no hay ejercicio abierto)
        └──▶ UC-018 bloqueado (no hay socios dados de alta)
              └──▶ UC-019 bloqueado (no hay suscripciones)
                    └──▶ UC-021 bloqueado (no hay cargos)
```

Es decir: **5 de los 11 backends de Fase 1 quedan comprometidos** por esta dependencia.

**Solución:** Mover UC-010 backend de Fase 2 a Fase 1.

### 3.2. MODERADO — UC-007 (Estados del socio) y su relación con UC-013 (Baja)

**Problema:** UC-013 (Baja de socio) está en Fase 1, pero UC-007 (Gestión de estados) está en Fase 2. UC-013 ejecuta transiciones de estado (ACTIVO → BAJA_VOLUNTARIA, ACTIVO → BAJA_DISCIPLINARIA, etc.) que están formalmente definidas en la máquina de estados de UC-007.

**Matización:** UC-013 puede implementar las transiciones que necesita (las transiciones a estados terminales) sin requerir el sistema completo de UC-007. Lo que UC-013 necesita es *escribir* transiciones específicas; UC-007 define el *framework general* de transiciones, el historial (`StatusHistory`), las transiciones automáticas (por morosidad) y la consulta de timeline.

**Riesgo:** Si UC-013 implementa las transiciones de estado de forma ad-hoc en Fase 1, habrá que refactorizar cuando UC-007 entre en Fase 2 para unificar el modelo de transiciones y el historial.

**Solución adoptada:** Intercambiar UC-007 y UC-020 entre fases:

- **UC-007 (Estados del socio) backend → Fase 1.** Implementar el `StatusHistory` y la máquina de transiciones desde el inicio, evitando retrabajo. El evento `MemberStatusChanged` queda disponible desde Fase 1, permitiendo a BC-Treasury suspender/reactivar cobros correctamente.

- **UC-020 (Cargos manuales) backend → Fase 2.** UC-020 no genera bloqueos en Fase 2 por tres razones:
  1. UC-021 (Registro de cobros) sigue funcionando en Fase 1 con los cargos periódicos de UC-019.
  2. UC-024 (Devoluciones SEPA) también está en Fase 2 y se beneficia de tener UC-020 disponible en la misma fase para repercutir gastos bancarios.
  3. Los cargos manuales (derramas, cargos individuales) son operativa suplementaria; el flujo principal de tesorería (plan → suscripción → cargo periódico → cobro) está cubierto por UC-019.

### 3.3. MENOR — UC-004 (Roles y permisos) en Fase 2

**Observación:** Múltiples UCs de Fase 1 tienen precondiciones de permisos específicos (`membership:members:create`, `membership:members:write`, `tesoreria:write`). Sin embargo, UC-001 (provisión de tenant) ya crea los roles predefinidos (Presidente, Secretario, Tesorero, Vocal, Socio) y el usuario administrador inicial.

**Implicación:** En Fase 1, el sistema funciona con un único usuario administrador que tiene todos los permisos. La asignación de roles a otros usuarios (que es lo que gestiona UC-004) queda diferida a Fase 2.

**Valoración:** Esto es **aceptable para un MVP** Fase 1. El admin inicial puede operar todas las funcionalidades. La gestión de roles adicionales (asignar Secretario, crear roles personalizados) entra naturalmente en Fase 2, cuando el sistema ya tiene datos y usuarios reales. No hay bloqueo técnico, solo una limitación operativa consciente.

---

## 4. Plan de fases definitivo

### Fase 1 (17 tareas: 12 backend + 5 frontend)

| Código UC | Descripción | Bounded Context | Prioridad | F1 - Back | F1 - Front |
|-----------|-------------|-----------------|-----------|-----------|------------|
| UC-001 | Provisión de nuevo tenant | BC-Identidad | Must | SI | - |
| UC-002 | Autenticación multi-tenant | BC-Identidad | Must | SI | SI |
| UC-006 | Gestión de ficha de socio | BC-Membresía | Must | SI | - |
| **UC-007** | **Gestión de estados del socio** | **BC-Membresía** | **Must** | **SI** | **-** |
| UC-008 | Configuración de tipos de socio | BC-Membresía | Should | SI | - |
| **UC-010** | **Gestión de ejercicios** | **BC-Membresía** | **Must** | **SI** | **-** |
| UC-011 | Alta simple de socio | BC-Membresía | Must | SI | SI |
| UC-013 | Baja de socio | BC-Membresía | Must | SI | SI |
| UC-017 | Configuración de planes de cuota | BC-Tesorería | Must | SI | SI |
| UC-018 | Gestión de suscripciones de cuota | BC-Tesorería | Must | SI | SI |
| UC-019 | Generación masiva de cargos periódicos | BC-Tesorería | Must | SI | - |
| UC-021 | Registro de cobros | BC-Tesorería | Must | SI | - |

**Distribución: 12 backend (71%) / 5 frontend (29%)**

### Fase 2 (13 tareas: 5 backend + 8 frontend)

| Código UC | Descripción | Bounded Context | Prioridad | F2 - Back | F2 - Front |
|-----------|-------------|-----------------|-----------|-----------|------------|
| UC-004 | Gestión de roles y permisos | BC-Identidad | Must | SI | - |
| UC-006 | Gestión de ficha de socio | BC-Membresía | Must | - | SI |
| UC-008 | Configuración de tipos de socio | BC-Membresía | Should | - | SI |
| UC-019 | Generación masiva de cargos periódicos | BC-Tesorería | Must | - | SI |
| **UC-020** | **Gestión de cargos manuales** | **BC-Tesorería** | **Must** | **SI** | **SI** |
| UC-021 | Registro de cobros | BC-Tesorería | Must | - | SI |
| UC-023 | Generación de remesas SEPA | BC-Tesorería | Must | SI | SI |
| UC-024 | Gestión de devoluciones SEPA | BC-Tesorería | Must | SI | SI |
| UC-056 | Importación masiva de socios | Transversal | Must | SI | SI |

**Distribución: 5 backend (38%) / 8 frontend (62%)**

### Fase 3 (6 tareas: 2 backend + 4 frontend)

| Código UC | Descripción | Bounded Context | Prioridad | F3 - Back | F3 - Front |
|-----------|-------------|-----------------|-----------|-----------|------------|
| UC-001 | Provisión de nuevo tenant | BC-Identidad | Must | - | SI |
| UC-010 | Gestión de ejercicios | BC-Membresía | Must | - | SI |
| UC-064 | Dashboard principal y KPIs | Transversal | Must | SI | SI |
| UC-065 | Gráficos de evolución | Transversal | Should | SI | SI |

**Distribución: 2 backend (33%) / 4 frontend (67%)**

### Distribución final

| Fase | Backend | Frontend | Total | Ratio B/F |
|------|---------|----------|-------|-----------|
| F1 | 12 (71%) | 5 (29%) | 17 | 2.4:1 |
| F2 | 5 (38%) | 8 (62%) | 13 | 0.63:1 |
| F3 | 2 (33%) | 4 (67%) | 6 | 0.5:1 |
| **Total** | **19 (53%)** | **17 (47%)** | **36** | — |

### Resumen de cambios respecto al plan original

| Cambio | Origen | Destino | Motivo |
|--------|--------|---------|--------|
| UC-010 backend | F2 | F1 | Crítico: UC-011 y UC-019 lo requieren como precondición |
| UC-007 backend | F2 | F1 | Moderado: evita retrabajo en UC-013 y habilita `MemberStatusChanged` |
| UC-020 backend | F1 | F2 | Compensación: operativa suplementaria sin bloqueos |

---

## 5. Verificación de dependencias del plan definitivo

### Fase 1 — Todas las dependencias resueltas

| UC | Dependencias | Estado |
|----|-------------|--------|
| UC-001 | Ninguna | OK |
| UC-002 | UC-001 ✓ | OK |
| UC-006 | UC-008 ✓ | OK |
| UC-007 | Miembros existentes (UC-011) ✓ | OK |
| UC-008 | Ninguna | OK |
| UC-010 | Ninguna | OK |
| UC-011 | UC-008 ✓, UC-010 ✓, UC-017 ✓ | OK |
| UC-013 | UC-007 ✓ | OK |
| UC-017 | UC-008 ✓ | OK |
| UC-018 | UC-011 ✓, UC-017 ✓ | OK |
| UC-019 | UC-018 ✓, UC-010 ✓ | OK |
| UC-021 | UC-019 ✓ | OK |

**Ningún bloqueo. Todas las dependencias se satisfacen dentro de la fase.**

### Fase 2 — Todas las dependencias resueltas

| UC | Dependencias | Estado |
|----|-------------|--------|
| UC-004 | UC-001 (F1) ✓ | OK |
| UC-020 | Miembros existentes (F1) ✓ | OK |
| UC-023 | Cargos generados (F1) ✓ | OK |
| UC-024 | UC-023 ✓ (orden interno) | OK |
| UC-056 | Ninguna | OK |
| Frontends | APIs de F1 o F2 disponibles ✓ | OK |

**Ningún bloqueo. UC-020 se integra sin fricciones junto a UC-024.**

### Fase 3 — Sin cambios, sin bloqueos

| UC | Dependencias | Estado |
|----|-------------|--------|
| UC-001 front | Backend F1 ✓ | OK |
| UC-010 front | Backend F1 ✓ | OK |
| UC-064 | Solo lectura, datos acumulados ✓ | OK |
| UC-065 | Solo lectura, datos históricos ✓ | OK |

---

## 6. Orden de implementación sugerido dentro de cada fase

### Fase 1 — Backend (orden por dependencias)

```
 1. UC-001  Provisión de tenant          [sin dependencias]
 2. UC-002  Autenticación multi-tenant   [depende de UC-001]
 3. UC-008  Tipos de socio               [configuración base]
 4. UC-010  Gestión de ejercicios        [necesario para altas]
 5. UC-007  Estados del socio            [máquina de transiciones]
 6. UC-006  Ficha de socio               [depende de UC-008]
 7. UC-011  Alta simple de socio         [depende de UC-008, UC-010]
 8. UC-013  Baja de socio               [depende de UC-007, miembros existentes]
 9. UC-017  Planes de cuota              [depende de UC-008]
10. UC-018  Suscripciones de cuota       [depende de UC-011, UC-017]
11. UC-019  Cargos periódicos            [depende de UC-018, UC-010]
12. UC-021  Registro de cobros           [depende de UC-019]
```

### Fase 1 — Frontend (orden por dependencias)

```
1. UC-002  Login / selector de tenant    [puede empezar en paralelo con backend]
2. UC-017  Configuración de planes       [API disponible desde paso 9 del backend]
3. UC-018  Gestión de suscripciones      [API disponible desde paso 10]
4. UC-011  Wizard de alta de socio       [API disponible desde paso 7]
5. UC-013  Pantalla de baja de socio     [API disponible desde paso 8]
```

### Fase 2 — Backend

```
1. UC-004  Roles y permisos              [independiente]
2. UC-020  Cargos manuales               [independiente]
3. UC-056  Importación masiva            [independiente]
4. UC-023  Remesas SEPA                  [depende de cargos generados en F1]
5. UC-024  Devoluciones SEPA             [depende de UC-023]
```

### Fase 2 — Frontend

```
1. UC-006  Ficha de socio               [API de F1]
2. UC-008  Configuración tipos de socio [API de F1]
3. UC-019  Vista de cargos periódicos   [API de F1]
4. UC-020  Vista de cargos manuales     [API de F2, orden interno]
5. UC-021  Registro de cobros           [API de F1]
6. UC-056  Importación masiva           [API de F2, orden interno]
7. UC-023  Remesas SEPA                 [API de F2, orden interno]
8. UC-024  Devoluciones SEPA            [API de F2, orden interno]
```

### Fase 3

```
1. UC-064  Dashboard y KPIs (back)       [solo lectura]
2. UC-065  Gráficos de evolución (back)  [solo lectura]
3. UC-001  Provisión de tenant (front)   [API de F1]
4. UC-010  Gestión de ejercicios (front) [API de F1]
5. UC-064  Dashboard y KPIs (front)      [API de F3, orden interno]
6. UC-065  Gráficos de evolución (front) [API de F3, orden interno]
```

---

## 7. Conclusión

La estrategia de fases con gradiente backend→frontend es **fundamentalmente correcta** y responde a un criterio técnico sólido. La selección de los 19 UCs cubre un ciclo de vida funcional completo para un MVP.

Los dos ajustes aplicados resuelven todas las dependencias detectadas:

1. **UC-010 → Fase 1** elimina la cadena de bloqueo UC-011 → UC-018 → UC-019 → UC-021 que comprometía el 45% del backend de Fase 1.
2. **UC-007 ↔ UC-020** elimina el riesgo de retrabajo en UC-013 sin introducir bloqueos nuevos ni alterar la distribución de tareas.

Con estos ajustes, el plan es viable, libre de bloqueos entre fases, y las dependencias dentro de cada fase se resuelven respetando el orden de implementación sugerido.
