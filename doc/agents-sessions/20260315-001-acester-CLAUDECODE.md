# Sesion Agente: 20260315-001-acester-CLAUDECODE

- **Agente de IA:** Claude Opus 4.6 (Claude Code CLI)
- **Fecha creacion:** 15 de marzo de 2026
- **Hora de inicio:** 11:29
- **Hora de ultimos trabajos:** 11:29

---

## Resumen de la Sesion

Pruebas visuales del frontend implementado en la sesion anterior. Deteccion y correccion de bug en notificaciones de error de login.

---

## Objetivos

- [x] Verificar UI del frontend sin backend
- [x] Corregir bug de notificaciones de error en login silenciadas

---

## Trabajo Realizado

### 11:29 - Bugfix: notificaciones de error en login silenciadas

**Descripcion:**
Al probar la UI sin backend, se detecto que los errores de login no mostraban notificaciones al usuario (solo console.log). Dos bugs combinados silenciaban las notificaciones.

**Bug 1 — Interceptor secuestraba 401 de login:**
El response interceptor en http-client.ts solo excluia `/auth/refresh` del auto-refresh flow. Un 401 en `/auth/login` (credenciales incorrectas) activaba la logica de refresh, que fallaba y hacia `window.location.href = '/login'` sin propagar el error al catch del login page.

**Bug 2 — extractHttpStatus buscaba formato incorrecto:**
La funcion en login.page.tsx buscaba `error.response.status` (formato Axios crudo), pero el interceptor transforma todos los errores a `ApiError` con `error.status` como propiedad directa.

**Archivos modificados:**

- `web/src/shared/api/http-client.ts` - Ampliar exclusion de refresh a todos los endpoints `/auth/`
- `web/src/features/auth/pages/login.page.tsx` - Import ApiError, reescribir extractHttpStatus con instanceof

**Resultados:**

- ✅ Notificacion roja de error visible al usuario al fallar login
- ✅ tsc --noEmit: 0 errores
- ✅ 404/404 tests pasan

## Proximos Pasos

---

## Notas y Aprendizajes

### Problemas Encontrados

**Notificaciones de login silenciadas:**

- **Descripcion:** Interceptor Axios secuestraba 401 de login (entraba al refresh flow)
- **Solucion:** Ampliar exclusion a `/auth/`
- **Prevencion:** Al implementar interceptors, verificar que no interfieran con flujos de auth.

---

## Metricas de la Sesion

- **Archivos modificados:** 1
- **Tests creados:** 0
- **Tests existentes verificados:** 404/404 pass

---

## Referencias

- Sesion anterior: doc/agents-sessions/20260314-002-acester-CLAUDECODE.md

---

**Estado final:** Completada
**Proxima sesion:** Frontend: continuar testando frontend
