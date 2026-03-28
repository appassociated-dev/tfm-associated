# Glosario de Traducciones ES → EN (Nomenclatura de Código Fuente)

> **Objetivo:** Traducir todos los nombres técnicos (código fuente) al inglés, respetando:
>
> - Clases/Aggregates/Entities/VOs: **PascalCase**
> - Variables/funciones/propiedades: **camelCase**
> - Constantes/enums: **UPPER_CASE** (valores) o **PascalCase** (tipos)
> - Archivos/carpetas: **snake_case** o **kebab-case**

---

## 1. Bounded Contexts

| Actual (ES)     | Propuesta (EN)   |
| --------------- | ---------------- |
| BC-Membresia    | BC-Membership    |
| BC-Tesoreria    | BC-Treasury      |
| BC-Eventos      | BC-Events        |
| BC-Comunicacion | BC-Communication |
| BC-Documentos   | BC-Documents     |
| BC-Identidad    | BC-Identity      |

---

## 2. Aggregates (Aggregate Roots)

| Actual (ES)             | Propuesta (EN)      | Contexto                                                |
| ----------------------- | ------------------- | ------------------------------------------------------- |
| Acta                    | MeetingMinutes      | BC-Documents                                            |
| Anuncio                 | Announcement        | BC-Communication                                        |
| Colectividad            | Collectivity        | BC-Identity (concepto de negocio para Tenant — ENT-001) |
| Socio                   | Member              | BC-Membership                                           |
| TipoSocio               | MemberType          | BC-Membership                                           |
| SolicitudAlta           | RegistrationRequest | BC-Membership                                           |
| Carnet                  | MemberCard          | BC-Membership                                           |
| Ejercicio               | FiscalYear          | BC-Membership                                           |
| ListaEspera             | WaitingList         | BC-Membership                                           |
| ExpedienteDisciplinario | DisciplinaryCase    | BC-Membership                                           |
| CuentaSocio             | MemberAccount       | BC-Treasury                                             |
| PlanCuota               | FeePlan             | BC-Treasury                                             |
| RemesaSepa              | SepaRemittance      | BC-Treasury                                             |
| Movimiento              | Transaction         | BC-Treasury (contabilidad)                              |
| EnlacePago              | PaymentLink         | BC-Treasury                                             |
| TurnoCaja               | CashRegisterShift   | BC-Treasury                                             |
| CategoriaContable       | AccountingCategory  | BC-Treasury                                             |
| EjercicioContable       | AccountingYear      | BC-Treasury                                             |
| Evento                  | Event               | BC-Events                                               |
| Inscripcion             | Registration        | BC-Events                                               |
| Cuadrilla               | Squad               | BC-Events (peñas)                                       |
| ComidaSocial            | SocialDinner        | BC-Events (peñas)                                       |
| Partido                 | Match               | BC-Events (clubes)                                      |
| Comunicacion            | Communication       | BC-Communication                                        |
| Plantilla               | Template            | BC-Communication                                        |
| Documento               | Document            | BC-Documents                                            |
| Alerta                  | Alert               | BC-Documents (cumplimiento)                             |
| Usuario                 | User                | BC-Identity                                             |
| Tenant                  | Tenant              | BC-Identity (sin cambio)                                |
| Rol                     | Role                | BC-Identity                                             |

---

## 3. Entities (dentro de Aggregates)

| Actual (ES)          | Propuesta (EN)     | Dentro de                        |
| -------------------- | ------------------ | -------------------------------- |
| PapeletaSitio        | SeatTicket         | MemberCard (extensión cofradías) |
| HistorialEstados     | StatusHistory      | Member                           |
| CamposPersonalizados | CustomFields       | Member                           |
| Cargo                | Charge             | MemberAccount                    |
| Pago                 | Payment            | MemberAccount                    |
| MandatoSepa          | SepaMandate        | MemberAccount                    |
| SuscripcionCuota     | FeeSubscription    | MemberAccount                    |
| AdeudoSepa           | SepaDebit          | SepaRemittance                   |
| TipoSocioPlanCuota   | MemberTypeFeePlan  | FeePlan                          |
| DocumentoPendiente   | PendingDocument    | RegistrationRequest              |
| Aval                 | Endorsement        | RegistrationRequest              |
| InfraccionRegistrada | RecordedInfraction | DisciplinaryCase                 |

---

## 4. Value Objects

| Actual (ES)              | Propuesta (EN)           |
| ------------------------ | ------------------------ |
| SocioId                  | MemberId                 |
| NumeroSocio              | MemberNumber             |
| DatosPersonales          | PersonalData             |
| DatosContacto            | ContactData              |
| DocumentoIdentidad       | IdentityDocument         |
| DatosBancarios           | BankDetails              |
| EstadoSocio              | MemberStatus             |
| RangoEdad                | AgeRange                 |
| ConfiguracionCuota       | FeeConfiguration         |
| CodigoQR                 | QRCode                   |
| PosicionEspera           | WaitingPosition          |
| FechaInscripcion         | RegistrationDate         |
| MotivoSalidaLista        | ListExitReason           |
| EstadoListaEspera        | WaitingListStatus        |
| TipoInfraccion           | InfractionType           |
| TipoSancion              | SanctionType             |
| EstadoExpediente         | CaseStatus               |
| Dinero                   | Money                    |
| MetodoPago               | PaymentMethod            |
| EstadoCargo              | ChargeStatus             |
| EstadoPago               | PaymentStatus            |
| EstadoMorosidad          | DelinquencyStatus        |
| SecuenciaSepa            | SepaSequence             |
| EstadoRemesa             | RemittanceStatus         |
| IdentificadorAcreedor    | CreditorIdentifier       |
| Periodicidad             | Frequency                |
| TipoPlan                 | PlanType                 |
| MotivoBajaSuscripcion    | SubscriptionCancelReason |
| MesesCobro               | BillingMonths            |
| URLFirmada               | SignedURL                |
| EstadoEnlace             | LinkStatus               |
| EstadoTurno              | ShiftStatus              |
| CodigoCuenta             | AccountCode              |
| TipoCategoria            | CategoryType             |
| EstadoEjercicioContable  | AccountingYearStatus     |
| PeriodoContable          | AccountingPeriod         |
| PeriodoEvento            | EventPeriod              |
| Ubicacion                | Location                 |
| ConfiguracionInscripcion | RegistrationConfig       |
| EstadoEvento             | EventStatus              |
| EstadoInscripcion        | RegistrationStatus       |
| MetodoCheckin            | CheckinMethod            |
| OpcionMenu               | MenuOption               |
| DatosRestaurante         | RestaurantData           |
| ColorIdentificativo      | IdentifierColor          |
| ResultadoPartido         | MatchResult              |
| DatosRival               | OpponentData             |
| EstadoPartido            | MatchStatus              |
| ReferenciaMandato        | MandateReference         |
| ConceptoCargo            | ChargeDescription        |
| CategoriaContable        | AccountingCategory       |
| DatosSolicitante         | ApplicantData            |
| PeriodoEjercicio         | FiscalYearPeriod         |

---

## 5. Enums - Valores

### EstadoSocio → MemberStatus

| Actual (ES)       | Propuesta (EN)     |
| ----------------- | ------------------ |
| Activo            | ACTIVE             |
| PendientePago     | PENDING_PAYMENT    |
| Suspendido        | SUSPENDED          |
| BajaVoluntaria    | VOLUNTARY_LEAVE    |
| BajaImpago        | NONPAYMENT_LEAVE   |
| BajaDisciplinaria | DISCIPLINARY_LEAVE |
| Aspirante         | APPLICANT          |
| Fallecido         | DECEASED           |

### EstadoCargo → ChargeStatus

| Actual (ES)   | Propuesta (EN) |
| ------------- | -------------- |
| Pendiente     | PENDING        |
| Pagado        | PAID           |
| PagadoParcial | PARTIALLY_PAID |
| Anulado       | CANCELLED      |

### EstadoPago → PaymentStatus

| Actual (ES) | Propuesta (EN) |
| ----------- | -------------- |
| Confirmado  | CONFIRMED      |
| Devuelto    | RETURNED       |
| Anulado     | CANCELLED      |

### EstadoMorosidad → DelinquencyStatus

| Actual (ES)    | Propuesta (EN)    |
| -------------- | ----------------- |
| AlCorriente    | UP_TO_DATE        |
| MorosidadLeve  | MINOR_DELINQUENCY |
| MorosidadGrave | MAJOR_DELINQUENCY |
| Suspendido     | SUSPENDED         |

### EstadoRemesa → RemittanceStatus

| Actual (ES)     | Propuesta (EN) |
| --------------- | -------------- |
| Borrador        | DRAFT          |
| Generada        | GENERATED      |
| Enviada         | SENT           |
| Procesada       | PROCESSED      |
| ConDevoluciones | WITH_RETURNS   |

### TipoColectividad → CollectivityType

| Actual (ES)        | Propuesta (EN)      |
| ------------------ | ------------------- |
| Peña               | PENA                |
| Cofradía           | COFRADIA            |
| ClubDeportivo      | CLUB_DEPORTIVO      |
| AsociacionCultural | ASOCIACION_CULTURAL |

### EstadoTurno → ShiftStatus

| Actual (ES) | Propuesta (EN) |
| ----------- | -------------- |
| Abierto     | OPEN           |
| Cerrado     | CLOSED         |
| Cuadrado    | RECONCILED     |

### TipoPlan → PlanType (sin cambio, ya en inglés-compatible)

| Actual    | Propuesta |
| --------- | --------- |
| UNICA     | ONE_TIME  |
| PERIODICA | RECURRING |

> **Nota:** `Derrama` (SpecialAssessment) es un concepto de negocio — un plan `ONE_TIME` de cobro extraordinario aprobado en asamblea (N4RF01). No es un valor de enum separado; se modela como `FeePlan` con `planType: ONE_TIME`.

### MotivoBajaSuscripcion → SubscriptionCancelReason

| Actual (ES)     | Propuesta (EN)     |
| --------------- | ------------------ |
| CAMBIO_PLAN     | PLAN_CHANGE        |
| BAJA_SOCIO      | MEMBER_LEAVE       |
| EXENCION        | EXEMPTION          |
| FIN_CUOTA_UNICA | ONE_TIME_COMPLETED |

### TipoInfraccion → InfractionType

| Actual (ES) | Propuesta (EN) |
| ----------- | -------------- |
| Leve        | MINOR          |
| Grave       | SERIOUS        |
| MuyGrave    | VERY_SERIOUS   |

### TipoSancion → SanctionType

| Actual (ES)  | Propuesta (EN) |
| ------------ | -------------- |
| Amonestacion | WARNING        |
| Suspension   | SUSPENSION     |
| Expulsion    | EXPULSION      |

### EstadoExpediente → CaseStatus

| Actual (ES) | Propuesta (EN) |
| ----------- | -------------- |
| Abierto     | OPEN           |
| EnRevision  | UNDER_REVIEW   |
| Cerrado     | CLOSED         |

### MotivoSalidaLista → ListExitReason

| Actual (ES) | Propuesta (EN) |
| ----------- | -------------- |
| Aprobado    | APPROVED       |
| Rechazado   | REJECTED       |
| Expirado    | EXPIRED        |
| Voluntario  | VOLUNTARY      |

### EstadoEvento → EventStatus

| Actual (ES)            | Propuesta (EN)      |
| ---------------------- | ------------------- |
| Borrador               | DRAFT               |
| Publicado              | PUBLISHED           |
| Inscripciones Abiertas | REGISTRATION_OPEN   |
| Inscripciones Cerradas | REGISTRATION_CLOSED |
| Realizado              | COMPLETED           |
| Cancelado              | CANCELLED           |

### EstadoInscripcion → RegistrationStatus

| Actual (ES)           | Propuesta (EN)      |
| --------------------- | ------------------- |
| Confirmada            | CONFIRMED           |
| ListaEspera           | WAITLISTED          |
| Cancelada             | CANCELLED           |
| Asistencia Registrada | ATTENDANCE_RECORDED |

### EstadoEjercicio → FiscalYearStatus

| Actual (ES) | Propuesta (EN) |
| ----------- | -------------- |
| preparacion | PREPARATION    |
| activo      | ACTIVE         |
| cerrado     | CLOSED         |

### MetodoPago → PaymentMethod (valores enum)

| Actual (ES)   | Propuesta (EN) |
| ------------- | -------------- |
| Efectivo      | CASH           |
| Transferencia | TRANSFER       |
| Domiciliacion | DIRECT_DEBIT   |
| Bizum         | BIZUM          |
| Tarjeta       | CARD           |

### EstadoPartido → MatchStatus

| Actual (ES) | Propuesta (EN) |
| ----------- | -------------- |
| Convocado   | CALLED         |
| Jugado      | PLAYED         |
| Suspendido  | SUSPENDED      |
| Aplazado    | POSTPONED      |

### EstadoCarnet → MemberCardStatus

| Actual (ES) | Propuesta (EN) |
| ----------- | -------------- |
| activo      | ACTIVE         |
| anulado     | REVOKED        |

### EstadoMandato → MandateStatus

| Actual (ES) | Propuesta (EN) |
| ----------- | -------------- |
| activo      | ACTIVE         |
| revocado    | REVOKED        |
| caducado    | EXPIRED        |

### Fases de Solicitud (Cofradías)

| Actual (ES)             | Propuesta (EN)         |
| ----------------------- | ---------------------- |
| SOLICITUD_RECIBIDA      | REQUEST_RECEIVED       |
| PENDIENTE_DOCUMENTACION | PENDING_DOCUMENTATION  |
| DOCUMENTACION_COMPLETA  | DOCUMENTATION_COMPLETE |
| PENDIENTE_PAGO          | PENDING_PAYMENT        |
| PAGO_CONFIRMADO         | PAYMENT_CONFIRMED      |
| EN_FORMACION            | IN_TRAINING            |
| PENDIENTE_APROBACION    | PENDING_APPROVAL       |
| ALTA_EFECTIVA           | EFFECTIVE_REGISTRATION |
| ALTA_CONFIRMADA         | REGISTRATION_CONFIRMED |
| DESISTIDA               | WITHDRAWN              |

### Roles predefinidos

| Actual (ES)   | Propuesta (EN) | Nota                                               |
| ------------- | -------------- | -------------------------------------------------- |
| PRESIDENTE    | PRESIDENT      |                                                    |
| HERMANO_MAYOR | PRESIDENT      | Alias en cofradías — mismo rol en sistema (N2RF04) |
| SECRETARIO    | SECRETARY      |                                                    |
| TESORERO      | TREASURER      |                                                    |
| VOCAL         | BOARD_MEMBER   |                                                    |
| SOCIO         | MEMBER         |                                                    |

---

## 6. Propiedades / Campos (camelCase)

| Actual (ES)                      | Propuesta (EN)                |
| -------------------------------- | ----------------------------- |
| estadoActual                     | currentStatus                 |
| tipoSocio / tipoSocioId          | memberType / memberTypeId     |
| fechaAlta                        | registrationDate              |
| fechaBaja                        | leaveDate                     |
| fechaNacimiento                  | birthDate                     |
| nombre                           | name                          |
| apellidos                        | surnames                      |
| telefono                         | phone                         |
| direccion                        | address                       |
| derechoVoto                      | votingRight                   |
| elegibleCargos                   | eligibleForOffice             |
| antiguedadMinimaVoto             | minimumSeniorityForVoting     |
| antiguedadMinimaCargos           | minimumSeniorityForOffice     |
| transicionAutomatica             | automaticTransition           |
| activo                           | active                        |
| codigo                           | code                          |
| descripcion                      | description                   |
| fechaSolicitud                   | requestDate                   |
| tipoSocioSolicitado              | requestedMemberType           |
| prioridad                        | priority                      |
| fechaEmision                     | issueDate                     |
| fechaValidez                     | validUntil                    |
| ejercicioId                      | fiscalYearId                  |
| fechaInicio                      | startDate                     |
| fechaFin                         | endDate                       |
| ejercicioAnterior                | previousFiscalYear            |
| posicion                         | position                      |
| fechaEntrada                     | entryDate                     |
| fechaSalida                      | exitDate                      |
| motivo                           | reason                        |
| fechaApertura                    | openDate                      |
| fechaCierre                      | closeDate                     |
| sancionAplicada                  | appliedSanction               |
| diasSuspension                   | suspensionDays                |
| motivoCierre                     | closeReason                   |
| resolvidoPor                     | resolvedBy                    |
| saldoPendiente                   | pendingBalance                |
| estadoMorosidad                  | delinquencyStatus             |
| importeBase                      | baseAmount                    |
| importeFinal                     | finalAmount                   |
| fechaVencimiento                 | dueDate                       |
| importePagado                    | paidAmount                    |
| esProrrateo                      | isProrated                    |
| esManual                         | isManual                      |
| suscripcionId                    | subscriptionId                |
| periodoMes                       | billingMonth                  |
| fechaPago                        | paymentDate                   |
| fechaRegistro                    | recordDate                    |
| registradoPor                    | recordedBy                    |
| justificanteId                   | receiptDocumentId             |
| fechaFirma                       | signatureDate                 |
| fechaUltimoAdeudo                | lastDebitDate                 |
| documentoFirmado                 | signedDocument                |
| mesesCobro                       | billingMonths                 |
| importeTotal                     | totalAmount                   |
| fechaCreacion                    | createdAt                     |
| fechaCargo                       | chargeDate                    |
| ficheroXml                       | xmlFile                       |
| importeEfectivo                  | effectiveAmount               |
| descuento                        | discount                      |
| motivoBaja                       | cancelReason                  |
| motivoDevolucion                 | returnReason                  |
| fechaDevolucion                  | returnDate                    |
| fechaExpiracion                  | expirationDate                |
| intentosAcceso                   | accessAttempts                |
| urlPublica                       | publicUrl                     |
| importeInicial                   | initialBalance                |
| importeFinal                     | finalBalance                  |
| descontarPeriodosBaja            | deductLeavePeriods            |
| mantenerAntiguedadRehabilitacion | keepSeniorityOnRehabilitation |
| fechaUltimaActualizacion         | lastUpdatedAt                 |
| sociosArrastrados                | carriedOverMembers            |
| transicionesAplicadas            | appliedTransitions            |
| diasVencido                      | daysOverdue                   |
| camposModificados                | modifiedFields                |
| deudaTotal                       | totalDebt                     |
| diasEstancado                    | staleDays                     |
| padreSocioId                     | parentMemberId                |
| recomendadoPor                   | referredBy                    |

---

## 7. Métodos / Funciones (camelCase)

| Actual (ES)                                    | Propuesta (EN)                             |
| ---------------------------------------------- | ------------------------------------------ |
| registrar(datos, tipo)                         | register(data, type)                       |
| cambiarEstado(nuevoEstado, motivo)             | changeStatus(newStatus, reason)            |
| cambiarTipo(nuevoTipo)                         | changeType(newType)                        |
| actualizarDatos(datos)                         | updateData(data)                           |
| calcularAntiguedad()                           | calculateSeniority()                       |
| verificarDerechoVoto()                         | verifyVotingRight()                        |
| darDeBaja(tipo, motivo)                        | deactivate(type, reason)                   |
| agregarALista(solicitud)                       | addToList(request)                         |
| procesarSiguiente()                            | processNext()                              |
| retirarDeLista(motivo)                         | removeFromList(reason)                     |
| recalcularPosiciones()                         | recalculatePositions()                     |
| abrirExpediente(socio, infraccion)             | openCase(member, infraction)               |
| añadirInfraccion(detalle)                      | addInfraction(detail)                      |
| aplicarSancion(tipo, dias?)                    | applySanction(type, days?)                 |
| archivar(motivo)                               | archive(reason)                            |
| generarEnlace(cargo, validezHoras)             | generateLink(charge, validHours)           |
| validarAcceso(token)                           | validateAccess(token)                      |
| marcarComoPagado(pago)                         | markAsPaid(payment)                        |
| expirar()                                      | expire()                                   |
| abrirTurno(encargado, importeInicial)          | openShift(attendant, initialBalance)       |
| registrarMovimiento(tipo, importe)             | recordTransaction(type, amount)            |
| cerrarTurno(importeFinal)                      | closeShift(finalBalance)                   |
| cuadrarTurno(ajuste, motivo)                   | reconcileShift(adjustment, reason)         |
| crearCategoria(codigo, nombre, padre?)         | createCategory(code, name, parent?)        |
| marcarComoImputable()                          | markAsBookable()                           |
| desactivar()                                   | deactivate()                               |
| abrirEjercicio(periodo, saldoInicial)          | openFiscalYear(period, openingBalance)     |
| cerrarEjercicio()                              | closeFiscalYear()                          |
| reaperturar(motivo)                            | reopen(reason)                             |
| agregarOpcionMenu(nombre, precio)              | addMenuOption(name, price)                 |
| realizarReserva(socio, opcionMenu)             | makeReservation(member, menuOption)        |
| modificarReserva(reserva, nuevaOpcion)         | updateReservation(reservation, newOption)  |
| confirmarComensales()                          | confirmDiners()                            |
| crearCuadrilla(nombre, responsable)            | createSquad(name, leader)                  |
| agregarMiembro(socio, rol)                     | addMember(member, role)                    |
| removerMiembro(socio, motivo)                  | removeMember(member, reason)               |
| asignarAEvento(evento)                         | assignToEvent(event)                       |
| crearPartido(rival, fecha, campo)              | createMatch(opponent, date, venue)         |
| convocarJugadores(socios[])                    | callPlayers(members[])                     |
| registrarResultado(golesLocal, golesVisitante) | recordResult(homeGoals, awayGoals)         |
| registrarEstadistica(jugador, tipo, valor)     | recordStat(player, type, value)            |
| generarAlerta(tipo, descripcion, criticidad)   | generateAlert(type, description, severity) |
| asignarResponsable(usuario)                    | assignResponsible(user)                    |
| marcarComoResuelta(observaciones)              | markAsResolved(notes)                      |
| escalar()                                      | escalate()                                 |

---

## 8. Domain Events

| Actual (ES)                    | Propuesta (EN)                |
| ------------------------------ | ----------------------------- |
| SocioRegistrado                | MemberRegistered              |
| SocioDadoDeBaja                | MemberDeactivated             |
| EstadoSocioCambiado            | MemberStatusChanged           |
| TipoSocioCambiado              | MemberTypeChanged             |
| DatosSocioActualizados         | MemberDataUpdated             |
| CarnetValidado                 | MemberCardValidated           |
| EjercicioAbierto               | FiscalYearOpened              |
| EjercicioCerrado               | FiscalYearClosed              |
| SolicitudAltaIniciada          | RegistrationRequestStarted    |
| SolicitudAltaAprobada          | RegistrationRequestApproved   |
| TipoSocioCreado                | MemberTypeCreated             |
| BajaPorImpago                  | NonpaymentLeave               |
| CargoGenerado                  | ChargeGenerated               |
| PagoRegistrado                 | PaymentRecorded               |
| PagoDevuelto                   | PaymentReturned               |
| MorosidadDetectada             | DelinquencyDetected           |
| PlanCuotaCreado                | FeePlanCreated                |
| PlanCuotaModificado            | FeePlanModified               |
| PlanCuotaVinculadoATipoSocio   | FeePlanLinkedToMemberType     |
| CargoPagado                    | ChargePaid                    |
| CargoCobrado                   | ChargeCollected               |
| CargoMarcadoReintento          | ChargeMarkedForRetry          |
| ReciboGenerado                 | ReceiptGenerated              |
| MandatoSepaRegistrado          | SepaMandateRegistered         |
| MandatoSepaRevocado            | SepaMandateRevoked            |
| RemesaSepaGenerada             | SepaRemittanceGenerated       |
| EnlacePagoGenerado             | PaymentLinkGenerated          |
| MorosidadRegularizada          | DelinquencyRegularized        |
| CertificadoDescubiertoGenerado | OverdraftCertificateGenerated |
| SuscripcionCreada              | SubscriptionCreated           |
| SuscripcionModificada          | SubscriptionModified          |
| SuscripcionCerrada             | SubscriptionClosed            |
| GeneracionMensualCompletada    | MonthlyGenerationCompleted    |
| DescuadreDetectado             | DiscrepancyDetected           |
| EventoCreado                   | EventCreated                  |
| EventoPublicado                | EventPublished                |
| EventoCancelado                | EventCancelled                |
| InscripcionRealizada           | RegistrationCompleted         |
| InscripcionCancelada           | RegistrationCancelled         |
| AforoCompletado                | CapacityReached               |
| PlazaLiberada                  | SlotReleased                  |
| ValoracionesEventoSolicitadas  | EventFeedbackRequested        |
| ProblemaRecurrenteDetectado    | RecurringIssueDetected        |
| ComunicacionEnviada            | CommunicationSent             |
| EmailRebotado                  | EmailBounced                  |
| NotificacionBienvenidaEnviada  | WelcomeNotificationSent       |
| RecordatorioPagoEnviado        | PaymentReminderSent           |
| AvisoMorosidadEnviado          | DelinquencyNoticeSent         |
| AvisoDomiciliacionEnviado      | DirectDebitNoticeSent         |
| ConfirmacionInscripcionEnviada | RegistrationConfirmationSent  |
| InformeAsambleaGenerado        | AssemblyReportGenerated       |
| UsuarioCreado                  | UserCreated                   |
| UsuarioAutenticado             | UserAuthenticated             |
| AutenticacionFallida           | AuthenticationFailed          |
| UsuarioBloqueado               | UserBlocked                   |
| TenantProvisionado             | TenantProvisioned             |
| TraspasoIniciado               | HandoverStarted               |
| TraspasoCompletado             | HandoverCompleted             |
| ExpedienteDisciplinarioAbierto | DisciplinaryCaseOpened        |
| SocioRehabilitado              | MemberReinstated              |
| AspiranteRegistrado            | ApplicantRegistered           |
| VacanteDisponible              | VacancyAvailable              |
| PlazosVencido                  | DeadlineExpired               |
| AntiguedadAlcanzada            | SeniorityThresholdReached     |
| EventoTimelineRegistrado       | TimelineEventRecorded         |
| ProcesoEstancado               | ProcessStalled                |
| CarnetGenerado                 | MemberCardGenerated           |
| SocioInscritoEnCuadrilla       | MemberAssignedToSquad         |
| PagoOnlineRealizado            | OnlinePaymentCompleted        |
| DeudaSaldada                   | DebtSettled                   |
| MorosidadCritica               | CriticalDelinquency           |
| SocioActualizado               | MemberUpdated                 |
| TurnoCajaAbierto               | CashRegisterOpened            |
| TurnoCajaCerrado               | CashRegisterClosed            |
| ExportacionSolicitada          | ExportRequested               |
| ExportacionFallida             | ExportFailed                  |
| PlanAmpliado                   | PlanUpgraded                  |

### Eventos internos vs negocio (ya documentados)

| Interno (ES)             | Negocio (EN)            |
| ------------------------ | ----------------------- |
| TenantCreado             | TenantProvisioned       |
| RemesaGenerada           | SepaRemittanceGenerated |
| RemesaProcesada          | SepaRemittanceSent      |
| MandatoCreado            | SepaMandateRegistered   |
| MandatoCaducado          | (implícito)             |
| SocioSuspendidoPorImpago | MemberStatusChanged     |

---

## 9. Domain Services

| Actual (ES)               | Propuesta (EN)            |
| ------------------------- | ------------------------- |
| GeneradorCargos           | ChargeGenerator           |
| GeneradorCargoManual      | ManualChargeGenerator     |
| CalculadorProrrateo       | ProrataCalculator         |
| GeneradorRemesaSepa       | SepaRemittanceGenerator   |
| GestorMorosidad           | DelinquencyManager        |
| ConciliadorPagos          | PaymentReconciler         |
| GestorSuscripciones       | SubscriptionManager       |
| EstadisticasSocios        | MemberStatistics          |
| ValidadorTransicionEstado | StatusTransitionValidator |
| EvaluadorReglasTipoSocio  | MemberTypeRulesEvaluator  |

---

## 10. Application Services

| Actual (ES)               | Propuesta (EN)                         |
| ------------------------- | -------------------------------------- |
| SocioService              | MemberService                          |
| TipoSocioService          | MemberTypeService                      |
| EstadisticasService       | StatisticsService                      |
| EjercicioService          | FiscalYearService                      |
| AltaSocioService          | MemberRegistrationService              |
| BajaSocioService          | MemberDeactivationService              |
| ListaEsperaService        | WaitingListService                     |
| CarnetService             | MemberCardService                      |
| TenantProvisioningService | TenantProvisioningService (sin cambio) |
| AuthenticationService     | AuthenticationService (sin cambio)     |
| TenantConfigService       | TenantConfigService (sin cambio)       |
| RoleManagementService     | RoleManagementService (sin cambio)     |
| TraspasoCargoService      | HandoverService                        |

---

## 11. Tablas de Base de Datos (snake_case)

| Actual (ES)                | Propuesta (EN)                |
| -------------------------- | ----------------------------- |
| socios                     | members                       |
| solicitudes_alta           | registration_requests         |
| solicitud_avales           | request_endorsements          |
| solicitud_documentos       | request_documents             |
| ejercicios                 | fiscal_years                  |
| carnets                    | member_cards                  |
| lista_espera               | waiting_lists                 |
| aspirantes_espera          | waiting_list_applicants       |
| traspasos_cargo            | handovers                     |
| historial_cargos           | office_history                |
| roles                      | roles (sin cambio)            |
| role_permissions           | role_permissions (sin cambio) |
| custom_fields              | custom_fields (sin cambio)    |
| tenants_registry           | tenants_registry (sin cambio) |
| timeline_eventos           | timeline_events               |
| umbrales_antiguedad        | seniority_thresholds          |
| expedientes_disciplinarios | disciplinary_cases            |
| workflow_morosidad         | delinquency_workflow          |
| outbox_events              | outbox_events (sin cambio)    |
| usuarios                   | users                         |
| membresias_tenant          | tenant_memberships            |
| tokens_refresco            | refresh_tokens                |
| tipos_socio                | member_types                  |
| historial_estados          | status_history                |
| planes_cuota               | fee_plans                     |
| tipos_socio_planes_cuota   | member_type_fee_plans         |
| cuentas_socios             | member_accounts               |
| suscripciones_cuota        | fee_subscriptions             |
| cargos                     | charges                       |
| pagos                      | payments                      |
| mandatos_sepa              | sepa_mandates                 |
| remesas_sepa               | sepa_remittances              |
| adeudos_sepa               | sepa_debits                   |
| enlaces_pago               | payment_links                 |
| turnos_caja                | cash_register_shifts          |
| movimientos                | transactions                  |
| categorias_contables       | accounting_categories         |
| ejercicios_contables       | accounting_years              |
| eventos                    | events                        |
| tipos_evento               | event_types                   |
| comidas_sociales           | social_dinners                |
| cuadrillas                 | squads                        |
| partidos                   | matches                       |
| comunicaciones             | communications                |
| plantillas                 | templates                     |
| anuncios                   | announcements                 |
| documentos                 | documents                     |
| categorias_documentos      | document_categories           |
| actas_reuniones            | meeting_minutes               |

---

## 12. Columnas de BD (snake_case)

| Actual (ES)                 | Propuesta (EN)                                                |
| --------------------------- | ------------------------------------------------------------- |
| socio_id                    | member_id                                                     |
| numero_socio                | member_number                                                 |
| estado_actual               | current_status                                                |
| fecha_alta                  | registration_date                                             |
| datos_personales            | personal_data                                                 |
| tipo_socio_id               | member_type_id                                                |
| fecha_nacimiento            | birth_date                                                    |
| fecha_solicitud             | request_date                                                  |
| fecha_ultima_actualizacion  | last_updated_at                                               |
| fecha_inicio_cargo          | office_start_date                                             |
| fecha_fin_cargo             | office_end_date                                               |
| fecha_rehabilitacion        | reinstatement_date                                            |
| ejercicio_id                | fiscal_year_id                                                |
| ejercicio_anterior_id       | previous_fiscal_year_id                                       |
| socios_al_inicio            | members_at_start                                              |
| socios_al_fin               | members_at_end                                                |
| memoria_id                  | report_id                                                     |
| is_system                   | is_system (sin cambio)                                        |
| inmutable                   | immutable                                                     |
| antiguedad_cache            | seniority_cache                                               |
| reglas_config               | rules_config                                                  |
| version                     | version (bloqueo optimista - `Int @default(0)`)               |
| iban_encrypted              | iban_encrypted (IBAN cifrado en reposo - sufijo `_encrypted`) |
| iban_debtor_encrypted       | iban_debtor_encrypted (IBAN del deudor SEPA cifrado)          |
| database_password_encrypted | database_password_encrypted (contraseña BD cifrada)           |
| tenant_id                   | tenant_id (FK al tenant; NULL para datos globales)            |
| password_hash               | password_hash (hash argon2 de la contraseña)                  |
| token_hash                  | token_hash (hash del refresh token)                           |
| failed_attempts             | failed_attempts (intentos fallidos de login)                  |
| blocked_until               | blocked_until (bloqueo temporal de cuenta)                    |
| processed_at                | processed_at (timestamp de procesado del outbox)              |
| retry_count                 | retry_count (reintentos de publicación de evento)             |
| next_retry_at               | next_retry_at (próximo reintento del outbox)                  |
| last_error                  | last_error (último error del outbox)                          |
| changed_by                  | changed_by (usuario que realizó el cambio de estado)          |
| changed_at                  | changed_at (timestamp del cambio de estado)                   |
| effective_amount            | effective_amount (importe efectivo tras descuentos)           |
| type_discount               | type_discount (descuento por tipo de socio)                   |
| personal_discount           | personal_discount (descuento personal)                        |
| billing_month               | billing_month (mes de facturación 1-12)                       |
| billing_year                | billing_year (año de facturación)                             |
| mandate_reference           | mandate_reference (referencia única del mandato SEPA)         |
| creditor_identifier         | creditor_identifier (identificador acreedor SEPA)             |
| xml_file_path               | xml_file_path (ruta al fichero XML ISO 20022 pain.008)        |
| updated_at                  | updated_at (última modificación - `@updatedAt` en Prisma)     |

---

## 13. Endpoints API

Todos los endpoints usan prefijo `/api` (configurado en `main.ts`) y versionado explícito `/api/v1/`. Los recursos compuestos usan **kebab-case**.

| Ruta                                                                        | Descripción                                       |
| --------------------------------------------------------------------------- | ------------------------------------------------- |
| `/api/v1/health`                                                            | Health check de infraestructura (public)          |
| `/api/v1/tenants`                                                           | Provisión de tenant (SuperadminGuard + X-Api-Key) |
| `/api/v1/auth/login`                                                        | Autenticación multi-tenant                        |
| `/api/v1/auth/refresh`                                                      | Renovación de access token                        |
| `/api/v1/auth/logout`                                                       | Cierre de sesión / revocación de token            |
| `/api/v1/auth/switch-tenant`                                                | Cambio de tenant activo                           |
| `/api/v1/auth/me`                                                           | Perfil del usuario autenticado                    |
| `/api/v1/roles`                                                             | Gestión de roles (CRUD + clonar)                  |
| `/api/v1/users/:id/role`                                                    | Asignación de rol a usuario                       |
| `/api/v1/member-types`                                                      | CRUD tipos de socio                               |
| `/api/v1/member-types/templates`                                            | Plantillas de tipos por colectividad              |
| `/api/v1/member-types/import-template`                                      | Importar plantillas de tipos                      |
| `/api/v1/fiscal-years`                                                      | CRUD ejercicios fiscales                          |
| `/api/v1/fiscal-years/active`                                               | Ejercicio fiscal activo                           |
| `/api/v1/fiscal-years/compare`                                              | Comparativa entre ejercicios                      |
| `/api/v1/fiscal-years/:id/close`                                            | Cierre de ejercicio fiscal                        |
| `/api/v1/members`                                                           | CRUD socios                                       |
| `/api/v1/members/preconditions`                                             | Verificación de precondiciones de alta            |
| `/api/v1/members/simple-registration`                                       | Alta simplificada de socio                        |
| `/api/v1/members/check-dni/:documentType/:documentNumber`                   | Verificación de DNI/NIE existente                 |
| `/api/v1/members/check-email/:email`                                        | Verificación de email existente                   |
| `/api/v1/members/:id/status`                                                | Cambio de estado de socio                         |
| `/api/v1/members/:id/status-history`                                        | Historial de estados del socio                    |
| `/api/v1/members/:id/available-transitions`                                 | Transiciones de estado disponibles                |
| `/api/v1/members/delinquency-check`                                         | Proceso de detección de morosidad                 |
| `/api/v1/members/:id/leave-summary`                                         | Resumen previo a la baja de socio                 |
| `/api/v1/members/:id/voluntary-leave`                                       | Baja voluntaria de socio                          |
| `/api/v1/members/:id/nonpayment-leave`                                      | Baja por impago                                   |
| `/api/v1/members/:id/reinstatement-summary`                                 | Resumen previo a rehabilitación                   |
| `/api/v1/members/:id/reinstate`                                             | Rehabilitación de socio dado de baja              |
| `/api/v1/treasury/fee-plans`                                                | CRUD planes de cuota                              |
| `/api/v1/treasury/fee-plans/templates`                                      | Plantillas de planes por colectividad             |
| `/api/v1/treasury/fee-plans/import-template`                                | Importar plantillas de planes                     |
| `/api/v1/treasury/fee-plans/:id/deactivate`                                 | Desactivar plan de cuota                          |
| `/api/v1/treasury/fee-plans/:id/activate`                                   | Activar plan de cuota                             |
| `/api/v1/treasury/fee-plans/:id/link-member-types`                          | Vincular plan a tipos de socio                    |
| `/api/v1/treasury/member-accounts/:accountId/subscriptions`                 | Suscripciones de la cuenta de socio               |
| `/api/v1/treasury/member-accounts/:accountId/subscriptions/:id/change-plan` | Cambio de plan de suscripción                     |
| `/api/v1/treasury/member-accounts/:accountId/subscriptions/:id/discount`    | Actualizar descuento de suscripción               |
| `/api/v1/treasury/member-accounts/:accountId/subscriptions/:id/close`       | Cerrar suscripción                                |
| `/api/v1/treasury/charges/generate-monthly`                                 | Generación masiva de cargos mensuales             |
| `/api/v1/treasury/charges/generation-log`                                   | Log de generaciones de cargos                     |
| `/api/v1/treasury/member-accounts/:accountId/charges`                       | Cargos de la cuenta de socio                      |
| `/api/v1/treasury/member-accounts/:accountId/charges/generate-subscription` | Generar cargo de suscripción                      |
| `/api/v1/treasury/member-accounts/:accountId/charges/manual`                | Cargo manual individual                           |
| `/api/v1/treasury/charges/manual/bulk`                                      | Cargo manual masivo                               |
| `/api/v1/treasury/member-accounts/:accountId/payments`                      | Pagos de la cuenta de socio                       |
| `/api/v1/treasury/member-accounts/:accountId/payments/multi`                | Pago múltiple de cargos                           |
| `/api/v1/treasury/payments/:id/receipt`                                     | Descarga de recibo en PDF                         |
| `/api/v1/treasury/member-accounts/:accountId/pending-charges`               | Cargos pendientes de la cuenta                    |
| `/api/v1/treasury/member-accounts/:accountId/balance`                       | Saldo de la cuenta de socio                       |
| `/api/v1/treasury/search-members`                                           | Búsqueda de socios por tesorería                  |
| `/api/v1/treasury/sepa/config`                                              | Configuración SEPA del tenant                     |
| `/api/v1/treasury/member-accounts/:accountId/sepa-mandate`                  | Mandato SEPA del socio                            |
| `/api/v1/treasury/sepa-remittances`                                         | CRUD remesas SEPA                                 |
| `/api/v1/treasury/sepa-remittances/preview`                                 | Vista previa de remesa SEPA                       |
| `/api/v1/treasury/sepa-remittances/:id/download`                            | Descarga del fichero XML pain.008                 |
| `/api/v1/treasury/sepa-remittances/:id/mark-sent`                           | Marcar remesa como enviada al banco               |
| `/api/v1/treasury/sepa-remittances/:id/returns`                             | Registro de devoluciones SEPA                     |
| `/api/v1/treasury/sepa-remittances/:id/returns/report`                      | Informe de devoluciones de remesa                 |
| `/api/v1/imports/members`                                                   | Importación masiva de socios (upload)             |
| `/api/v1/imports/members/:jobId/validate`                                   | Validación del mapeo de columnas                  |
| `/api/v1/imports/members/:jobId/execute`                                    | Ejecutar importación validada                     |
| `/api/v1/imports/members/:jobId/status`                                     | Estado del job de importación                     |
| `/api/v1/dashboard/kpis`                                                    | KPIs del dashboard principal                      |
| `/api/v1/dashboard/analytics/member-evolution`                              | Evolución temporal de socios                      |
| `/api/v1/dashboard/analytics/revenue-evolution`                             | Evolución temporal de recaudación                 |
| `/api/v1/dashboard/analytics/export`                                        | Exportación del dashboard a PDF                   |
| `/api/docs`                                                                 | Swagger UI (documentación interactiva)            |

---

## 14. Permisos (formato `modulo:recurso:accion`)

Formato de tres niveles: `modulo:recurso:accion`

- **Módulo**: alineado con Bounded Context (`membership`, `treasury`, `events`, `communication`, `documents`, `identity`)
- **Recurso**: entidad de dominio dentro del módulo (`members`, `charges`, `fees`, etc.)
- **Acción CRUD base**: `create`, `read`, `update`, `delete`
- **Acciones específicas**: `process`, `send`, `approve`, `export`, etc.
- **Wildcard**: `*` en cualquier nivel

### Permisos referenciados en la documentación

| Actual (ES)                  | Propuesta (EN)                |
| ---------------------------- | ----------------------------- |
| `tesoreria.*.*`              | `treasury:*:*`                |
| `membresia.socio.read`       | `membership:members:read`     |
| `membresia.*.*`              | `membership:*:*`              |
| `comunicacion.*.*`           | `communication:*:*`           |
| `*.*.read`                   | `*:*:read`                    |
| `eventos.inscripcion.create` | `events:registrations:create` |
| `socios:write`               | `membership:members:write`    |
| `cuotas:write`               | `treasury:fees:write`         |
| `ver_socios`                 | `membership:members:read`     |
| `ver_estadisticas`           | `membership:statistics:read`  |
| `crear_socios`               | `membership:members:create`   |

### Permisos definidos en spec/013 (inventario de endpoints)

| Permiso                            | Descripción                                                   |
| ---------------------------------- | ------------------------------------------------------------- |
| `membership:member-types:create`   | Crear tipos de socio                                          |
| `membership:member-types:read`     | Consultar tipos de socio                                      |
| `membership:member-types:update`   | Editar / desactivar tipos de socio                            |
| `membership:fiscal-years:create`   | Crear ejercicios fiscales                                     |
| `membership:fiscal-years:read`     | Consultar ejercicios fiscales                                 |
| `membership:fiscal-years:close`    | Cerrar un ejercicio fiscal                                    |
| `membership:members:create`        | Crear socios                                                  |
| `membership:members:read`          | Consultar socios y su historial                               |
| `membership:members:update`        | Editar datos de un socio                                      |
| `membership:members:update-status` | Cambiar el estado de un socio                                 |
| `membership:members:deactivate`    | Dar de baja a un socio                                        |
| `membership:members:reinstate`     | Rehabilitar a un socio dado de baja                           |
| `treasury:fee-plans:create`        | Crear planes de cuota                                         |
| `treasury:fee-plans:read`          | Consultar planes de cuota                                     |
| `treasury:fee-plans:update`        | Editar / activar / desactivar planes de cuota                 |
| `treasury:subscriptions:create`    | Crear suscripciones de cuota                                  |
| `treasury:subscriptions:read`      | Consultar suscripciones                                       |
| `treasury:subscriptions:update`    | Modificar / cerrar suscripciones                              |
| `treasury:charges:create`          | Generar cargos (mensuales, manuales, masivos)                 |
| `treasury:charges:read`            | Consultar cargos                                              |
| `treasury:payments:create`         | Registrar pagos                                               |
| `treasury:payments:read`           | Consultar pagos y recibos                                     |
| `treasury:sepa:read`               | Consultar configuración y remesas SEPA                        |
| `treasury:sepa:create`             | Crear mandatos y remesas SEPA                                 |
| `treasury:sepa:update`             | Modificar mandatos / marcar remesas / registrar devoluciones  |
| `identity:roles:read`              | Consultar roles del tenant                                    |
| `identity:roles:manage`            | Crear / editar / eliminar / clonar roles y asignar a usuarios |
| `analytics:read`                   | Acceder a analytics y exportaciones del dashboard             |
| `dashboard:read`                   | Acceder a KPIs del dashboard                                  |
| `socios:import`                    | Importar socios desde archivo Excel/CSV                       |

### Tabla de roles predefinidos

| Rol            | Permisos                                  |
| -------------- | ----------------------------------------- |
| `admin`        | `*:*:*`                                   |
| `president`    | `*:*:*` + aprobaciones críticas           |
| `treasurer`    | `treasury:*:*`, `membership:members:read` |
| `secretary`    | `membership:*:*`, `communication:*:*`     |
| `board_member` | `*:*:read`, `events:registrations:create` |
| `member`       | Solo portal (datos propios)               |

---

## 15. Scripts mencionados (sin cambio, son herramientas internas)

- `inventario_eventos.py` → sin cambio
- `detectar_duplicados_kb005.py` → sin cambio
- `eliminar_duplicados_kb005.py` → sin cambio

---

## 16. Conceptos del Modelo de Datos (spec/012)

### 16.1 Arquitectura de bases de datos

| Concepto (ES)           | Término (EN)           | Descripción                                                                |
| ----------------------- | ---------------------- | -------------------------------------------------------------------------- |
| Base de datos principal | DB-Main                | BD global del sistema: tenants, usuarios, roles (ENT-001 a ENT-006)        |
| Base de datos de tenant | DB-Tenant              | BD aislada por colectividad con los datos de negocio (ENT-007 en adelante) |
| Separación multi-tenant | Multi-tenant isolation | Aislamiento de datos por BD separada según ADR-002                         |

### 16.2 Convenciones Prisma y PostgreSQL

| Concepto (ES)              | Término / Anotación             | Descripción                                                                                                               |
| -------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Clave primaria UUID        | `@default(uuid())` + `@db.Uuid` | PK de tipo UUID en todas las entidades                                                                                    |
| Timestamp con zona horaria | `DateTime @db.Timestamptz()`    | Mapeo a `TIMESTAMPTZ` en PostgreSQL para todos los campos de fecha-hora                                                   |
| Fecha sin hora             | `DateTime @db.Date`             | Mapeo a `DATE` en PostgreSQL para campos de solo fecha                                                                    |
| Dinero en céntimos         | `Int` (centavos)                | Los importes se almacenan como enteros en céntimos para evitar errores de coma flotante                                   |
| Enums como string          | `String` (validado en dominio)  | Los enums se almacenan como `String`, validados a nivel de dominio (no enums formales de Prisma)                          |
| Actualización automática   | `@updatedAt`                    | Campo `updated_at` actualizado automáticamente por Prisma en cada modificación                                            |
| Sufijo de cifrado          | `_encrypted`                    | Columnas que almacenan datos sensibles cifrados en reposo (ej: `iban_encrypted`, `database_password_encrypted`) - RNF-006 |

### 16.3 Patrones de diseño del modelo

| Concepto (ES)        | Término (EN)       | Descripción                                                                                                         |
| -------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Bloqueo optimista    | Optimistic locking | Campo `version Int @default(0)` en aggregates con control de concurrencia (ej: `members`)                           |
| Tabla solo inserción | INSERT-only table  | Tabla de auditoría que nunca se actualiza ni elimina (ej: `status_history`)                                         |
| Entidad esqueleto    | Placeholder entity | Entidad definida en spec/012 pero sin implementación detallada hasta que entre en scope (ENT-021 a ENT-040)         |
| Patrón Outbox        | Outbox pattern     | Tabla `outbox_events` en ambas bases de datos para garantizar entrega at-least-once de eventos de dominio (ADR-008) |
| FK sin declarar      | Undeclared FK      | FK intencional sin declaración formal en Prisma para evitar dependencias cross-BC a nivel de esquema                |

---

## 17. Conceptos de la API (spec/013)

### 17.1 Autenticación y autorización

| Concepto (ES)         | Término / Código                        | Descripción                                                                                                     |
| --------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Decorador público     | `@Public()`                             | Exime un endpoint de autenticación JWT; sin él, todos los endpoints requieren JWT válido                        |
| Middleware de tenant  | `TenantMiddleware`                      | Extrae el `tenantId` del JWT y lo inyecta en `req.tenantId`; no requiere header `X-Tenant-Id`                   |
| Decorador de permisos | `@RequirePermissions('recurso:accion')` | Declara el permiso necesario para acceder a un endpoint (ADR-007)                                               |
| Guard de permisos     | `PermissionsGuard`                      | Valida que el usuario tenga el permiso declarado con `@RequirePermissions`                                      |
| Guard de superadmin   | `SuperadminGuard`                       | Guard para operaciones de bootstrap (provisión de tenant) que requieren API Key estático vía header `X-Api-Key` |
| Cabecera de API Key   | `X-Api-Key`                             | Header HTTP para operaciones de superadmin (no accesibles con JWT de usuario normal)                            |
| Guard de JWT global   | `JwtAuthGuard`                          | Guard global aplicado a todos los endpoints; se omite con `@Public()`                                           |

### 17.2 Convenciones de respuesta

| Concepto (ES)               | Término (EN)            | Descripción                                                                                                     |
| --------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| Paginación                  | Pagination              | Query params `?page=1&limit=20`; respuesta con objeto `meta` que incluye `total`, `page`, `limit`, `totalPages` |
| Objeto meta                 | `meta` response object  | Objeto de metadatos de paginación incluido en respuestas de colecciones paginadas                               |
| Respuesta de error estándar | Standard error response | Esquema `{statusCode, message[], error}` de NestJS para todos los errores                                       |
| Documentación interactiva   | Swagger UI              | Disponible en `GET /api/docs` (generado con `@nestjs/swagger`)                                                  |

### 17.3 Convenciones de rutas

| Convención                       | Descripción                                                                       |
| -------------------------------- | --------------------------------------------------------------------------------- |
| Kebab-case en recursos           | Recursos compuestos en kebab-case: `/member-types`, `/fee-plans`, `/fiscal-years` |
| IDs como UUID v4                 | Parámetros de ruta (`:id`, `:accountId`, `:memberId`) son UUID v4                 |
| `Content-Type: application/json` | Content-Type por defecto en todas las peticiones con body                         |

---

## Archivos afectados

| Archivo                          | Impacto                                                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `003_requisitos-funcionales.md`  | Bajo (SuscripcionCuota, PlanCuota)                                                                          |
| `005_modelo-dominio.md`          | **Muy alto** (todos los aggregates, entities, VOs, events, services)                                        |
| `006_adrs.md`                    | Medio (domain events, endpoints, BCs)                                                                       |
| `008_rnf-tecnicos.md`            | Bajo (permisos, algunos config vars)                                                                        |
| `009_user-stories.md`            | Bajo (roles ya como códigos)                                                                                |
| `010_casos-uso.md`               | **Muy alto** (application services, events, tablas BD, código)                                              |
| `004_rnf-base.md`                | Ninguno                                                                                                     |
| `007_stack.md`                   | Ninguno                                                                                                     |
| `012_modelo-de-datos.md`         | **Muy alto** (define esquema relacional completo - 40 entidades, convenciones Prisma)                       |
| `013_inventario-de-endpoints.md` | **Muy alto** (define contratos API completos - 123 endpoints, permisos RBAC, convenciones de autenticación) |
