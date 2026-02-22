# Associated - Especificacion del ERP Ligero para Colectividades Espanolas

Repositorio de documentacion de especificacion para **Associated**, un ERP ligero orientado a la gestion de colectividades espanolas (asociaciones, clubes, federaciones, etc.).

Este proyecto forma parte de un Trabajo de Fin de Master (TFM).

## Estructura del repositorio

```
spec/                         # Documentos fuente de especificacion
  003_requisitos-funcionales.md   # 221 requisitos funcionales
  004_rnf-base.md                 # 66 requisitos no funcionales
  005_modelo-dominio.md           # 6 Bounded Contexts (DDD)
  006_adrs.md                     # 12 decisiones arquitectonicas
  007_stack.md                    # Stack tecnologico
  008_rnf-tecnicos.md             # RNF tecnicos de implementacion
  009_user-stories.md             # 202 user stories (MoSCoW)
  010_casos-uso.md                # 76 casos de uso detallados

.agents/skills/               # Skills de Claude Code
  doc-spec-generator/             # Generacion y actualizacion de spec
  doc-spec-manager/               # Navegacion y consulta de la spec
    references/                   # Fragmentos individuales por entidad
```

## Documentacion

La especificacion cubre ~32.600 lineas con ~1.800 referencias cruzadas entre documentos, organizadas en una cadena de trazabilidad completa:

```
RF (que) -> RNF (restricciones) -> BC (donde) -> ADR (por que)
  -> Stack (con que) -> RNFT (como) -> US (quien) -> UC (flujo completo)
```

Para mas detalle consultar `spec/mapa-documentacion.md`.

## Stack tecnologico previsto

- **Backend:** NestJS (Node.js)
- **Frontend:** React
- **Base de datos:** PostgreSQL

## Requisitos

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) para aprovechar los skills de navegacion y generacion de especificacion.
- Python 3.10+ para los scripts de generacion en `.agents/skills/doc-spec-generator/scripts/`.
