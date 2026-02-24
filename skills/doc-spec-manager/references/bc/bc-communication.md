## 6. BC-Communication: Notificaciones y Mensajería

### 6.1 Descripción

Gestiona el envío de comunicaciones a socios: emails, notificaciones push, SMS y el tablón de anuncios interno. Procesa eventos de otros BCs para generar notificaciones automáticas.

### 6.2 Aggregates

#### 6.2.1 Aggregate: Communication

```
┌─────────────────────────────────────────────────────────────┐
│ COMMUNICATION (Aggregate Root)                              │
├─────────────────────────────────────────────────────────────┤
│ Identity: CommunicationId                                   │
│                                                             │
│ Value Objects:                                              │
│   - Contenido (asunto, cuerpo, formato)                     │
│   - SegmentoDestinatarios (criterios de filtrado)           │
│                                                             │
│ Entities:                                                   │
│   - Envio[] (cada envío individual a un destinatario)       │
│                                                             │
│ Properties:                                                 │
│   - canal: CanalComunicacion                                │
│   - tipo: TipoComunicacion (manual, automatica)             │
│   - plantillaId: TemplateId?                                │
│   - fechaProgramada: DateTime?                              │
│   - estado: EstadoComunicacion                              │
│   - creadoPor: UserId                                       │
│                                                             │
│ Invariants:                                                 │
│   - Al menos un destinatario                                │
└─────────────────────────────────────────────────────────────┘
```

#### 6.2.2 Entity: Envio

```
┌─────────────────────────────────────────────────────────────┐
│ ENVIO (Entity)                                              │
├─────────────────────────────────────────────────────────────┤
│ Identity: EnvioId                                           │
│                                                             │
│ Properties:                                                 │
│   - memberId: MemberId                                      │
│   - destino: string (email, teléfono según canal)           │
│   - estado: EstadoEnvio                                     │
│   - fechaEnvio: DateTime?                                   │
│   - fechaApertura: DateTime? (tracking email)               │
│   - errorMensaje: string?                                   │
└─────────────────────────────────────────────────────────────┘
```

#### 6.2.3 Aggregate: Template

```
┌─────────────────────────────────────────────────────────────┐
│ TEMPLATE (Aggregate Root)                                   │
├─────────────────────────────────────────────────────────────┤
│ Identity: TemplateId                                        │
│                                                             │
│ Properties:                                                 │
│   - codigo: string                                          │
│   - nombre: string                                          │
│   - canal: CanalComunicacion                                │
│   - asunto: string (con placeholders)                       │
│   - cuerpo: string (con placeholders)                       │
│   - variablesDisponibles: string[]                          │
│   - esSistema: boolean (no editable si true)                │
│   - activa: boolean                                         │
│                                                             │
│ Invariants:                                                 │
│   - Código único dentro del tenant                          │
│   - Plantillas sistema no modificables                      │
└─────────────────────────────────────────────────────────────┘
```

#### 6.2.4 Aggregate: Anuncio

```
┌─────────────────────────────────────────────────────────────┐
│ ANUNCIO (Aggregate Root)                                    │
├─────────────────────────────────────────────────────────────┤
│ Identity: AnuncioId                                         │
│                                                             │
│ Properties:                                                 │
│   - titulo: string                                          │
│   - contenido: string                                       │
│   - fechaPublicacion: Date                                  │
│   - fechaExpiracion: Date?                                  │
│   - destacado: boolean                                      │
│   - publicadoPor: UserId                                    │
│   - estado: EstadoAnuncio                                   │
│                                                             │
│ Invariants:                                                 │
│   - FechaExpiracion > FechaPublicacion (si definida)        │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 Domain Events

BC-Communication emite eventos relacionados con el ciclo de vida de las comunicaciones:
| Evento | Trigger | Payload | Consumidores |
|--------|---------|---------|--------------|
| `CommunicationSent` | Envío completado | communicationId, totalDestinatarios, canal, fechaEnvio | - |
| `EmailBounced` | Email rebota (bounce) | envioId, memberId, email, tipoBounce (hard/soft), motivo | BC-Membership (marcar email inválido si hard bounce) |
| `WelcomeNotificationSent` | Email bienvenida enviado a nuevo socio | memberId, email, fechaEnvio, templateId | - |
| `PaymentReminderSent` | Recordatorio de pago enviado | memberId, email, cargoId, importe, fechaLimite | - |
| `DelinquencyNoticeSent` | Aviso de morosidad enviado | memberId, email, deudaTotal, fechaEnvio | - |
| `DirectDebitNoticeSent` | Aviso pre-remesa enviado | memberId, email, remesaId, importe, fechaCargo | - |
| `RegistrationConfirmationSent` | Confirmación de inscripción a evento | memberId, email, eventId, registrationId | - |

**Notas:**
- `CommunicationSent`: Marca la finalización del proceso de envío masivo
- `EmailAbierto` y `EnlaceClicado`: Eventos de tracking para métricas internas (no requieren consumidores externos)
- `EmailBounced`: Permite a BC-Membership actualizar la validez de emails de socios según tipo de bounce (hard/soft)

Este BC **también es consumidor** de eventos de otros BCs:

| Evento Origen | Acción en BC-Communication |
|---------------|---------------------------|
| `MemberRegistered` | Enviar email bienvenida |
| `ChargeGenerated` | Enviar aviso de cuota próxima |
| `DelinquencyDetected` | Iniciar workflow de avisos |
| `EventPublished` | Notificar a socios según preferencias |
| `RegistrationCompleted` | Enviar confirmación |

### 6.4 Trazabilidad RF

| RF | Elemento de Dominio |
|----|---------------------|
| N6RF01-04 | Communication (Aggregate), canales |
| N6RF05-07 | SegmentoDestinatarios, Template |
| N6RF08-09 | Envio (Entity), tracking |
| N6RF10-16 | Plantillas sistema (notificaciones automáticas) |
| N6RF17-23 | Extensión: Acta (específico - ver BC-Documents) |
