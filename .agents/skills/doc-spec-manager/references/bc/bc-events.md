## 5. BC-Events: Actividades y Participación

### 5.1 Descripción

Gestiona el ciclo de vida de eventos y actividades: planificación, inscripciones, control de aforo y registro de asistencia.

### 5.2 Aggregates

#### 5.2.1 Aggregate: Event

```
┌─────────────────────────────────────────────────────────────┐
│ EVENT (Aggregate Root)                                      │
├─────────────────────────────────────────────────────────────┤
│ Identity: EventId                                           │
│                                                             │
│ Value Objects:                                              │
│   - EventPeriod (fechaInicio, fechaFin)                     │
│   - Location (direccion, coordenadas?, sala?)               │
│   - RegistrationConfig (openDate, closeDate,                │
│                         requierePago, precio?)              │
│                                                             │
│ Entities:                                                   │
│   - Registration[] (participantes inscritos)                │
│                                                             │
│ Properties:                                                 │
│   - tipoEvento: TipoEventoId                                │
│   - nombre: string                                          │
│   - descripcion: string                                     │
│   - aforo: int? (null = ilimitado)                          │
│   - estado: EventStatus                                     │
│   - fiscalYearId: FiscalYearId                               │
│   - organizadorId: UserId                                   │
│                                                             │
│ Computed:                                                   │
│   - plazasDisponibles: int                                  │
│   - inscripcionAbierta: boolean                             │
│                                                             │
│ Invariants:                                                 │
│   - FechaFin >= FechaInicio                                 │
│   - Inscripciones.count <= Aforo (si definido)              │
│   - FechaCierreInscripcion <= FechaInicio                   │
└─────────────────────────────────────────────────────────────┘
```

#### 5.2.2 Entity: Registration (dentro de Event)

```
┌─────────────────────────────────────────────────────────────┐
│ REGISTRATION (Entity)                                       │
├─────────────────────────────────────────────────────────────┤
│ Identity: RegistrationId                                    │
│                                                             │
│ Value Objects:                                              │
│   - DatosInscripcion (campos configurables por evento)      │
│                                                             │
│ Properties:                                                 │
│   - memberId: MemberId? (null si externo)                   │
│   - datosExterno: DatosPersonales? (si no es socio)         │
│   - fechaInscripcion: Date                                  │
│   - estado: RegistrationStatus                              │
│   - cargoId: CargoId? (si requiere pago)                    │
│   - asistencia: Asistencia?                                 │
│                                                             │
│ Invariants:                                                 │
│   - O memberId o datosExterno, no ambos                     │
│   - Si requierePago, cargoId debe existir                   │
└─────────────────────────────────────────────────────────────┘
```

#### 5.2.3 Value Object: Asistencia

```
┌─────────────────────────────────────────────────────────────┐
│ ASISTENCIA (Value Object)                                   │
├─────────────────────────────────────────────────────────────┤
│ Properties:                                                 │
│   - confirmada: boolean                                     │
│   - horaEntrada: DateTime?                                  │
│   - metodoCheckin: CheckinMethod (QR, Manual)               │
│   - registradoPor: UserId?                                  │
└─────────────────────────────────────────────────────────────┘
```

#### 5.2.4 Aggregate: TipoEvento

```
┌─────────────────────────────────────────────────────────────┐
│ TIPO_EVENTO (Aggregate Root)                                │
├─────────────────────────────────────────────────────────────┤
│ Identity: TipoEventoId                                      │
│                                                             │
│ Properties:                                                 │
│   - codigo: string                                          │
│   - nombre: string                                          │
│   - color: string (para calendario)                         │
│   - requiereInscripcion: boolean                            │
│   - camposInscripcion: CampoFormulario[]                    │
│   - activo: boolean                                         │
│                                                             │
│ Invariants:                                                 │
│   - Código único dentro del tenant                          │
└─────────────────────────────────────────────────────────────┘
```

#### 5.2.5 Aggregate: SocialDinner

```
┌─────────────────────────────────────────────────────────────┐
│ SOCIAL_DINNER (Aggregate Root)                              │
├─────────────────────────────────────────────────────────────┤
│ Identity: SocialDinnerId                                    │
│                                                             │
│ Value Objects:                                              │
│   - MenuOption (nombre, precio)                             │
│   - RestaurantData (nombre, direccion, telefono)            │
│                                                             │
│ Entities:                                                   │
│   - ReservaComida[] (inscripciones con selección menú)      │
│                                                             │
│ Properties:                                                 │
│   - eventoId: EventId (referencia al evento base)           │
│   - restaurante: RestaurantData                             │
│   - opcionesMenu: MenuOption[] (diferentes menús)           │
│   - fechaLimiteReserva: Date                                │
│   - numeroComensales: int (total confirmado)                │
│   - basePrice: Money                                        │
│   - requisitosAlimentarios: string[] (alergias, vegano...)  │
│                                                             │
│ Invariants:                                                 │
│   - FechaLimiteReserva < fechaInicio del evento             │
│   - Al menos una opción de menú disponible                  │
│   - NumeroComensales = suma de reservas confirmadas         │
└─────────────────────────────────────────────────────────────┘
```

**Comportamientos:**
- `addMenuOption(name, price)` → añade opción al listado
- `makeReservation(member, menuOption)` → registra inscripción con menú
- `updateReservation(reservation, newOption)` → cambia selección
- `confirmDiners()` → cierra reservas y genera factura

#### 5.2.6 Aggregate: Squad

```
┌─────────────────────────────────────────────────────────────┐
│ SQUAD (Aggregate Root)                                      │
├─────────────────────────────────────────────────────────────┤
│ Identity: SquadId                                           │
│                                                             │
│ Value Objects:                                              │
│   - IdentifierColor (hex o nombre)                          │
│                                                             │
│ Entities:                                                   │
│   - MiembroCuadrilla[] (socios asignados con rol)           │
│                                                             │
│ Properties:                                                 │
│   - nombre: string (ej: "Tambores", "Trompetas")            │
│   - descripcion: string?                                    │
│   - responsable: MemberId (coordinador)                     │
│   - colorIdentificativo: string                             │
│   - capacidadMaxima: int?                                   │
│   - tipoActividad: string (procesion, desfile, etc.)        │
│   - activa: boolean                                         │
│                                                             │
│ Computed:                                                   │
│   - numeroMiembros: int (total activos)                     │
│                                                             │
│ Invariants:                                                 │
│   - Nombre único dentro del tenant                          │
│   - Responsable debe ser miembro de la cuadrilla            │
│   - NumeroMiembros <= capacidadMaxima (si definida)         │
└─────────────────────────────────────────────────────────────┘
```

**Comportamientos:**
- `createSquad(name, leader)` → inicializa cuadrilla
- `addMember(member, role)` → añade socio validando capacidad
- `removeMember(member, reason)` → da de baja del grupo
- `assignToEvent(event)` → asocia cuadrilla a actividad

#### 5.2.7 Aggregate: Match

```
┌─────────────────────────────────────────────────────────────┐
│ MATCH (Aggregate Root)                                      │
├─────────────────────────────────────────────────────────────┤
│ Identity: MatchId                                           │
│                                                             │
│ Value Objects:                                              │
│   - MatchResult (golesLocal, golesVisitante)                │
│   - OpponentData (nombre, escudo?)                          │
│   - Location (campo, direccion)                             │
│                                                             │
│ Entities:                                                   │
│   - Convocatoria[] (jugadores convocados)                   │
│   - EstadisticaJugador[] (goles, tarjetas, minutos)         │
│                                                             │
│ Properties:                                                 │
│   - eventoId: EventId (referencia al evento base)           │
│   - equipoRival: OpponentData                               │
│   - esLocal: boolean                                        │
│   - campo: Location                                         │
│   - categoria: string (senior, juvenil, infantil...)        │
│   - competicion: string (liga, copa, amistoso)              │
│   - resultado: MatchResult?                                 │
│   - estado: MatchStatus (convocado, jugado, suspendido)     │
│   - observaciones: string?                                  │
│                                                             │
│ Invariants:                                                 │
│   - Resultado solo definido si estado=jugado                │
│   - Jugadores convocados deben ser socios activos           │
└─────────────────────────────────────────────────────────────┘
```

**Comportamientos:**
- `createMatch(opponent, date, venue)` → programa encuentro
- `callPlayers(members[])` → establece lista de convocados
- `recordResult(homeGoals, awayGoals)` → cierra partido
- `recordStat(player, type, value)` → añade dato individual

### 5.3 Value Objects

| Value Object | Atributos | Validaciones |
|--------------|-----------|--------------|
| `EventPeriod` | fechaInicio: DateTime, fechaFin: DateTime | FechaFin >= FechaInicio |
| `Location` | direccion: string, coordenadas?: LatLng, sala?: string | Dirección no vacía |
| `RegistrationConfig` | openDate: Date, closeDate: Date, requierePago: boolean, precio?: Money | FechaCierre <= fechaInicio evento |
| `EventStatus` | enum | Borrador, Publicado, Inscripciones Abiertas, Inscripciones Cerradas, Realizado, Cancelado |
| `RegistrationStatus` | enum | Confirmada, ListaEspera, Cancelada, Asistencia Registrada |
| `CheckinMethod` | enum | QR, Manual, NFC |
| `MenuOption` | nombre: string, precio: Money | Nombre no vacío |
| `RestaurantData` | nombre: string, direccion: string, telefono: string | Todos obligatorios |
| `IdentifierColor` | valor: string | Color hex o nombre CSS válido |
| `MatchResult` | golesLocal: int, golesVisitante: int | >= 0 ambos |
| `OpponentData` | nombre: string, escudo?: URL | Nombre obligatorio |
| `MatchStatus` | enum | Convocado, Jugado, Suspendido, Aplazado |

### 5.4 Domain Events

| Evento | Trigger | Payload | Consumidores |
|--------|---------|---------|--------------|
| `EventCreated` | Creación evento | eventId, tipo, fecha | BC-Communication (publicar) |
| `EventPublished` | Apertura inscripciones | eventId | BC-Communication (notificar socios) |
| `EventCancelled` | Cancelación | eventId, motivo | BC-Communication (notificar inscritos), BC-Treasury (reembolsos) |
| `RegistrationCompleted` | Nueva inscripción | registrationId, eventId, memberId | BC-Treasury (generar cargo si precio), BC-Communication (confirmación) |
| `RegistrationCancelled` | Cancelación inscripción | registrationId, eventId | BC-Treasury (anular cargo) |
| `CapacityReached` | Aforo lleno | eventId | BC-Communication (activar lista espera) |
| `SlotReleased` | Baja de inscrito | eventId, posicionListaEspera | BC-Communication (notificar siguiente) |
| `EventFeedbackRequested` | Solicitud valoraciones post-evento | eventId, registeredMembers[], fechaSolicitud | BC-Communication (enviar formulario) |
| `RecurringIssueDetected` | Detección patrón de problemas | eventId, tipoProblema, frecuencia | BC-Communication (alertar organizadores) |

### 5.5 Trazabilidad RF

| RF | Elemento de Dominio |
|----|---------------------|
| N5RF01-02 | Event (Aggregate), TipoEvento |
| N5RF03-04 | Event con calendario, exportación iCal |
| N5RF05-09 | Registration (Entity), control aforo, lista espera |
| N5RF10-11 | RegistrationConfig, DatosInscripcion |
| N5RF12-16 | Asistencia (VO), check-in QR/manual |
| N5RF17-19 | Extensión: SocialDinner (específico peñas), Aggregate 5.2.5 |
| N5RF20-26 | Extensión: Procesion, Costaleros (específico cofradías) |
| N5RF27-30 | Extensión: Competicion (específico clubes), Aggregate 5.2.7 Match, Aggregate 5.2.6 Squad |
