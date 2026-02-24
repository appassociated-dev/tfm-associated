## Duda 1: Sustitución de rutas en `CLAUDE.md`

No es necesario sustituir las rutas. Mantengo `skills/doc-spec-generator/SKILL.md` en `AGENTS.md` y copialo tal cual a `CLAUDE.md`.

**Motivo:**

* `skills/` es la fuente de verdad y está versionada en Git; por tanto, siempre existe.
* Las rutas en la tabla de *Available Skills* sirven para que el agente lea el archivo si lo necesita, no para el mecanismo de *auto-discovery* (que opera por nombre desde el directorio configurado).
* Una ruta que apunta a `skills/` es más fiable que una que apunta a `.claude/skills/`, ya que esta última solo existe tras ejecutar el *setup*.

Sustituir las rutas añade complejidad innecesaria al script sin aportar un beneficio real.

---

## Duda 2: Copia vs. *symbolic links*

La recomendación es utilizar **copias**, especialmente en tu caso.

### Comparativa

| Criterio                           | Copia                        | Symlink                                                                                                               |
| ---------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Compatibilidad Windows             | ✅                            | ⚠️ Requiere permisos o *Developer Mode*                                                                               |
| WSL2 sobre `/mnt/c/`               | ✅                            | ❌ Problemático: los symlinks creados en WSL sobre filesystem Windows pueden no comportarse correctamente fuera de WSL |
| Permite personalización por agente | ✅                            | ❌ `CLAUDE.md` y `GEMINI.md` serían idénticos                                                                          |
| Sin desfase si cambia la fuente    | ❌ Requiere re-ejecutar setup | ✅                                                                                                                     |
| Simplicidad del script             | ✅                            | ⚠️ Hay que asegurar que el agente siga el symlink                                                                     |

### Punto crítico en mi entorno

Tu repositorio está en `/mnt/c/Users/acester/...`, es decir, en un filesystem NTFS montado en WSL2.
Los symlinks creados desde WSL2 en ese entorno pueden romperse o no ser reconocidos correctamente si alguna herramienta accede al repositorio desde Windows nativo (Explorer, VS Code Windows, Git for Windows). Las copias no presentan este problema.

Además, si en algún momento `CLAUDE.md` necesita una línea específica para Claude que no aplique a Gemini, con copias puedes divergir. Con symlinks no sería posible.

El posible desfase (modificar `skills/my-skill/SKILL.md` y tener que re-ejecutar el *setup*) se mitiga fácilmente si el script es idempotente y forma parte del flujo documentado, por ejemplo, como *pre-commit hook* o paso estándar de desarrollo.
