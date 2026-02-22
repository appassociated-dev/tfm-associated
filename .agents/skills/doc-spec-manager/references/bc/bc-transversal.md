## 7 bis. Extensión Transversal: Cumplimiento Normativo

**Nota:** Los requisitos N11 (Cumplimiento Normativo) se implementan como Application Services transversales que operan sobre los BCs existentes. Sin embargo, se documenta aquí un Aggregate específico para gestión de alertas legales que podría implementarse como extensión futura.

### 7 bis.1 Aggregate: AlertaLegal

```
┌─────────────────────────────────────────────────────────────┐
│ ALERT_LEGAL (Aggregate Root)                                │
├─────────────────────────────────────────────────────────────┤
│ Identity: AlertId                                           │
│                                                             │
│ Value Objects:                                              │
│   - TipoNormativa (enum: RGPD, Ley_Asociaciones, Laboral)  │
│   - NivelCriticidad (enum: info, advertencia, critica)      │
│   - PlazoLimite (fechaLimite, diasAviso)                    │
│                                                             │
│ Properties:                                                 │
│   - titulo: string                                          │
│   - descripcion: string                                     │
│   - normativaAfectada: TipoNormativa                        │
│   - nivelCriticidad: NivelCriticidad                        │
│   - fechaDeteccion: Date                                    │
│   - fechaLimite: Date? (plazo legal si aplica)              │
│   - estado: EstadoAlerta (pendiente, en_revision, resuelta) │
│   - accionRequerida: string                                 │
│   - responsable: UserId? (asignado para resolución)         │
│   - fechaResolucion: Date?                                  │
│   - observaciones: string?                                  │
│                                                             │
│ Invariants:                                                 │
│   - FechaLimite > FechaDeteccion (si definida)              │
│   - Estado resuelto requiere fechaResolucion definida       │
│   - Alertas críticas requieren responsable asignado         │
└─────────────────────────────────────────────────────────────┘
```

**Comportamientos:**
- `generateAlert(tipo, descripcion, criticidad)` → crea alerta
- `assignResponsible(usuario)` → delega resolución
- `markAsResolved(observaciones)` → cierra alerta
- `escalate()` → aumenta criticidad si plazo vencido

**Trazabilidad RF:**
| RF | Elemento de Dominio |
|----|---------------------|
| N11RF01-17 | AlertaLegal (Aggregate) - Extensión futura |

**Ubicación propuesta:** BC-Identity (como parte de auditoría) o módulo transversal dedicado.
