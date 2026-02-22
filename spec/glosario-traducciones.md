# Glosario de Traducciones ES → EN (Nomenclatura de Código Fuente)

> **Objetivo:** Traducir todos los nombres técnicos (código fuente) al inglés, respetando:
> - Clases/Aggregates/Entities/VOs: **PascalCase**
> - Variables/funciones/propiedades: **camelCase**
> - Constantes/enums: **UPPER_CASE** (valores) o **PascalCase** (tipos)
> - Archivos/carpetas: **snake_case** o **kebab-case**

---

## 1. Bounded Contexts

| Actual (ES) | Propuesta (EN) |
|---|---|
| BC-Membresia | BC-Membership |
| BC-Tesoreria | BC-Treasury |
| BC-Eventos | BC-Events |
| BC-Comunicacion | BC-Communication |
| BC-Documentos | BC-Documents |
| BC-Identidad | BC-Identity |

---

## 2. Aggregates (Aggregate Roots)

| Actual (ES) | Propuesta (EN) | Contexto |
|---|---|---|
| Socio | Member | BC-Membership |
| TipoSocio | MemberType | BC-Membership |
| SolicitudAlta | RegistrationRequest | BC-Membership |
| Carnet | MemberCard | BC-Membership |
| Ejercicio | FiscalYear | BC-Membership |
| ListaEspera | WaitingList | BC-Membership |
| ExpedienteDisciplinario | DisciplinaryCase | BC-Membership |
| CuentaSocio | MemberAccount | BC-Treasury |
| PlanCuota | FeePlan | BC-Treasury |
| RemesaSepa | SepaRemittance | BC-Treasury |
| Movimiento | Transaction | BC-Treasury (contabilidad) |
| EnlacePago | PaymentLink | BC-Treasury |
| TurnoCaja | CashRegisterShift | BC-Treasury |
| CategoriaContable | AccountingCategory | BC-Treasury |
| EjercicioContable | AccountingYear | BC-Treasury |
| Evento | Event | BC-Events |
| Inscripcion | Registration | BC-Events |
| Cuadrilla | Squad | BC-Events (peñas) |
| ComidaSocial | SocialDinner | BC-Events (peñas) |
| Partido | Match | BC-Events (clubes) |
| Comunicacion | Communication | BC-Communication |
| Plantilla | Template | BC-Communication |
| Documento | Document | BC-Documents |
| Alerta | Alert | BC-Documents (cumplimiento) |
| Usuario | User | BC-Identity |
| Tenant | Tenant | BC-Identity (sin cambio) |
| Rol | Role | BC-Identity |

---

## 3. Entities (dentro de Aggregates)

| Actual (ES) | Propuesta (EN) | Dentro de |
|---|---|---|
| HistorialEstados | StatusHistory | Member |
| CamposPersonalizados | CustomFields | Member |
| Cargo | Charge | MemberAccount |
| Pago | Payment | MemberAccount |
| MandatoSepa | SepaMandate | MemberAccount |
| SuscripcionCuota | FeeSubscription | MemberAccount |
| AdeudoSepa | SepaDebit | SepaRemittance |
| TipoSocioPlanCuota | MemberTypeFeePlan | FeePlan |
| DocumentoPendiente | PendingDocument | RegistrationRequest |
| Aval | Endorsement | RegistrationRequest |
| InfraccionRegistrada | RecordedInfraction | DisciplinaryCase |

---

## 4. Value Objects

| Actual (ES) | Propuesta (EN) |
|---|---|
| SocioId | MemberId |
| NumeroSocio | MemberNumber |
| DatosPersonales | PersonalData |
| DatosContacto | ContactData |
| DocumentoIdentidad | IdentityDocument |
| DatosBancarios | BankDetails |
| EstadoSocio | MemberStatus |
| RangoEdad | AgeRange |
| ConfiguracionCuota | FeeConfiguration |
| CodigoQR | QRCode |
| PosicionEspera | WaitingPosition |
| FechaInscripcion | RegistrationDate |
| MotivoSalidaLista | ListExitReason |
| EstadoListaEspera | WaitingListStatus |
| TipoInfraccion | InfractionType |
| TipoSancion | SanctionType |
| EstadoExpediente | CaseStatus |
| Dinero | Money |
| MetodoPago | PaymentMethod |
| EstadoCargo | ChargeStatus |
| EstadoPago | PaymentStatus |
| EstadoMorosidad | DelinquencyStatus |
| SecuenciaSepa | SepaSequence |
| EstadoRemesa | RemittanceStatus |
| IdentificadorAcreedor | CreditorIdentifier |
| Periodicidad | Frequency |
| TipoPlan | PlanType |
| MotivoBajaSuscripcion | SubscriptionCancelReason |
| MesesCobro | BillingMonths |
| URLFirmada | SignedURL |
| EstadoEnlace | LinkStatus |
| EstadoTurno | ShiftStatus |
| CodigoCuenta | AccountCode |
| TipoCategoria | CategoryType |
| EstadoEjercicioContable | AccountingYearStatus |
| PeriodoContable | AccountingPeriod |
| PeriodoEvento | EventPeriod |
| Ubicacion | Location |
| ConfiguracionInscripcion | RegistrationConfig |
| EstadoEvento | EventStatus |
| EstadoInscripcion | RegistrationStatus |
| MetodoCheckin | CheckinMethod |
| OpcionMenu | MenuOption |
| DatosRestaurante | RestaurantData |
| ColorIdentificativo | IdentifierColor |
| ResultadoPartido | MatchResult |
| DatosRival | OpponentData |
| EstadoPartido | MatchStatus |
| ReferenciaMandato | MandateReference |
| ConceptoCargo | ChargeDescription |
| CategoriaContable | AccountingCategory |
| DatosSolicitante | ApplicantData |
| PeriodoEjercicio | FiscalYearPeriod |

---

## 5. Enums - Valores

### EstadoSocio → MemberStatus
| Actual (ES) | Propuesta (EN) |
|---|---|
| Activo | ACTIVE |
| PendientePago | PENDING_PAYMENT |
| Suspendido | SUSPENDED |
| BajaVoluntaria | VOLUNTARY_LEAVE |
| BajaImpago | NONPAYMENT_LEAVE |
| BajaDisciplinaria | DISCIPLINARY_LEAVE |
| Aspirante | APPLICANT |
| Fallecido | DECEASED |

### EstadoCargo → ChargeStatus
| Actual (ES) | Propuesta (EN) |
|---|---|
| Pendiente | PENDING |
| Pagado | PAID |
| PagadoParcial | PARTIALLY_PAID |
| Anulado | CANCELLED |

### EstadoPago → PaymentStatus
| Actual (ES) | Propuesta (EN) |
|---|---|
| Confirmado | CONFIRMED |
| Devuelto | RETURNED |
| Anulado | CANCELLED |

### EstadoMorosidad → DelinquencyStatus
| Actual (ES) | Propuesta (EN) |
|---|---|
| AlCorriente | UP_TO_DATE |
| MorosidadLeve | MINOR_DELINQUENCY |
| MorosidadGrave | MAJOR_DELINQUENCY |
| Suspendido | SUSPENDED |

### EstadoRemesa → RemittanceStatus
| Actual (ES) | Propuesta (EN) |
|---|---|
| Borrador | DRAFT |
| Generada | GENERATED |
| Enviada | SENT |
| Procesada | PROCESSED |
| ConDevoluciones | WITH_RETURNS |

### TipoPlan → PlanType (sin cambio, ya en inglés-compatible)
| Actual | Propuesta |
|---|---|
| UNICA | ONE_TIME |
| PERIODICA | RECURRING |

### MotivoBajaSuscripcion → SubscriptionCancelReason
| Actual (ES) | Propuesta (EN) |
|---|---|
| CAMBIO_PLAN | PLAN_CHANGE |
| BAJA_SOCIO | MEMBER_LEAVE |
| EXENCION | EXEMPTION |
| FIN_CUOTA_UNICA | ONE_TIME_COMPLETED |

### TipoInfraccion → InfractionType
| Actual (ES) | Propuesta (EN) |
|---|---|
| Leve | MINOR |
| Grave | SERIOUS |
| MuyGrave | VERY_SERIOUS |

### TipoSancion → SanctionType
| Actual (ES) | Propuesta (EN) |
|---|---|
| Amonestacion | WARNING |
| Suspension | SUSPENSION |
| Expulsion | EXPULSION |

### EstadoExpediente → CaseStatus
| Actual (ES) | Propuesta (EN) |
|---|---|
| Abierto | OPEN |
| EnRevision | UNDER_REVIEW |
| Cerrado | CLOSED |

### MotivoSalidaLista → ListExitReason
| Actual (ES) | Propuesta (EN) |
|---|---|
| Aprobado | APPROVED |
| Rechazado | REJECTED |
| Expirado | EXPIRED |
| Voluntario | VOLUNTARY |

### EstadoEvento → EventStatus
| Actual (ES) | Propuesta (EN) |
|---|---|
| Borrador | DRAFT |
| Publicado | PUBLISHED |
| Inscripciones Abiertas | REGISTRATION_OPEN |
| Inscripciones Cerradas | REGISTRATION_CLOSED |
| Realizado | COMPLETED |
| Cancelado | CANCELLED |

### EstadoInscripcion → RegistrationStatus
| Actual (ES) | Propuesta (EN) |
|---|---|
| Confirmada | CONFIRMED |
| ListaEspera | WAITLISTED |
| Cancelada | CANCELLED |
| Asistencia Registrada | ATTENDANCE_RECORDED |

### EstadoEjercicio → FiscalYearStatus
| Actual (ES) | Propuesta (EN) |
|---|---|
| preparacion | PREPARATION |
| activo | ACTIVE |
| cerrado | CLOSED |

### MetodoPago → PaymentMethod (valores enum)
| Actual (ES) | Propuesta (EN) |
|---|---|
| Efectivo | CASH |
| Transferencia | TRANSFER |
| Domiciliacion | DIRECT_DEBIT |
| Bizum | BIZUM |
| Tarjeta | CARD |

### EstadoPartido → MatchStatus
| Actual (ES) | Propuesta (EN) |
|---|---|
| Convocado | CALLED |
| Jugado | PLAYED |
| Suspendido | SUSPENDED |
| Aplazado | POSTPONED |

### EstadoCarnet → MemberCardStatus
| Actual (ES) | Propuesta (EN) |
|---|---|
| activo | ACTIVE |
| anulado | REVOKED |

### EstadoMandato → MandateStatus
| Actual (ES) | Propuesta (EN) |
|---|---|
| activo | ACTIVE |
| revocado | REVOKED |
| caducado | EXPIRED |

### Fases de Solicitud (Cofradías)
| Actual (ES) | Propuesta (EN) |
|---|---|
| SOLICITUD_RECIBIDA | REQUEST_RECEIVED |
| PENDIENTE_DOCUMENTACION | PENDING_DOCUMENTATION |
| DOCUMENTACION_COMPLETA | DOCUMENTATION_COMPLETE |
| PENDIENTE_PAGO | PENDING_PAYMENT |
| PAGO_CONFIRMADO | PAYMENT_CONFIRMED |
| EN_FORMACION | IN_TRAINING |
| PENDIENTE_APROBACION | PENDING_APPROVAL |
| ALTA_EFECTIVA | EFFECTIVE_REGISTRATION |
| ALTA_CONFIRMADA | REGISTRATION_CONFIRMED |
| DESISTIDA | WITHDRAWN |

### Roles predefinidos
| Actual (ES) | Propuesta (EN) |
|---|---|
| PRESIDENTE | PRESIDENT |
| SECRETARIO | SECRETARY |
| TESORERO | TREASURER |
| VOCAL | BOARD_MEMBER |
| SOCIO | MEMBER |

---

## 6. Propiedades / Campos (camelCase)

| Actual (ES) | Propuesta (EN) |
|---|---|
| estadoActual | currentStatus |
| tipoSocio / tipoSocioId | memberType / memberTypeId |
| fechaAlta | registrationDate |
| fechaBaja | leaveDate |
| fechaNacimiento | birthDate |
| nombre | name |
| apellidos | surnames |
| telefono | phone |
| direccion | address |
| derechoVoto | votingRight |
| elegibleCargos | eligibleForOffice |
| antiguedadMinimaVoto | minimumSeniorityForVoting |
| antiguedadMinimaCargos | minimumSeniorityForOffice |
| transicionAutomatica | automaticTransition |
| activo | active |
| codigo | code |
| descripcion | description |
| fechaSolicitud | requestDate |
| tipoSocioSolicitado | requestedMemberType |
| prioridad | priority |
| fechaEmision | issueDate |
| fechaValidez | validUntil |
| ejercicioId | fiscalYearId |
| fechaInicio | startDate |
| fechaFin | endDate |
| ejercicioAnterior | previousFiscalYear |
| posicion | position |
| fechaEntrada | entryDate |
| fechaSalida | exitDate |
| motivo | reason |
| fechaApertura | openDate |
| fechaCierre | closeDate |
| sancionAplicada | appliedSanction |
| diasSuspension | suspensionDays |
| motivoCierre | closeReason |
| resolvidoPor | resolvedBy |
| saldoPendiente | pendingBalance |
| estadoMorosidad | delinquencyStatus |
| importeBase | baseAmount |
| importeFinal | finalAmount |
| fechaVencimiento | dueDate |
| importePagado | paidAmount |
| esProrrateo | isProrated |
| esManual | isManual |
| suscripcionId | subscriptionId |
| periodoMes | billingMonth |
| fechaPago | paymentDate |
| fechaRegistro | recordDate |
| registradoPor | recordedBy |
| justificanteId | receiptDocumentId |
| fechaFirma | signatureDate |
| fechaUltimoAdeudo | lastDebitDate |
| documentoFirmado | signedDocument |
| mesesCobro | billingMonths |
| importeTotal | totalAmount |
| fechaCreacion | createdAt |
| fechaCargo | chargeDate |
| ficheroXml | xmlFile |
| importeEfectivo | effectiveAmount |
| descuento | discount |
| motivoBaja | cancelReason |
| motivoDevolucion | returnReason |
| fechaDevolucion | returnDate |
| fechaExpiracion | expirationDate |
| intentosAcceso | accessAttempts |
| urlPublica | publicUrl |
| importeInicial | initialBalance |
| importeFinal | finalBalance |
| descontarPeriodosBaja | deductLeavePeriods |
| mantenerAntiguedadRehabilitacion | keepSeniorityOnRehabilitation |
| fechaUltimaActualizacion | lastUpdatedAt |
| sociosArrastrados | carriedOverMembers |
| transicionesAplicadas | appliedTransitions |
| diasVencido | daysOverdue |
| camposModificados | modifiedFields |
| deudaTotal | totalDebt |
| diasEstancado | staleDays |
| padreSocioId | parentMemberId |
| recomendadoPor | referredBy |

---

## 7. Métodos / Funciones (camelCase)

| Actual (ES) | Propuesta (EN) |
|---|---|
| registrar(datos, tipo) | register(data, type) |
| cambiarEstado(nuevoEstado, motivo) | changeStatus(newStatus, reason) |
| cambiarTipo(nuevoTipo) | changeType(newType) |
| actualizarDatos(datos) | updateData(data) |
| calcularAntiguedad() | calculateSeniority() |
| verificarDerechoVoto() | verifyVotingRight() |
| darDeBaja(tipo, motivo) | deactivate(type, reason) |
| agregarALista(solicitud) | addToList(request) |
| procesarSiguiente() | processNext() |
| retirarDeLista(motivo) | removeFromList(reason) |
| recalcularPosiciones() | recalculatePositions() |
| abrirExpediente(socio, infraccion) | openCase(member, infraction) |
| añadirInfraccion(detalle) | addInfraction(detail) |
| aplicarSancion(tipo, dias?) | applySanction(type, days?) |
| archivar(motivo) | archive(reason) |
| generarEnlace(cargo, validezHoras) | generateLink(charge, validHours) |
| validarAcceso(token) | validateAccess(token) |
| marcarComoPagado(pago) | markAsPaid(payment) |
| expirar() | expire() |
| abrirTurno(encargado, importeInicial) | openShift(attendant, initialBalance) |
| registrarMovimiento(tipo, importe) | recordTransaction(type, amount) |
| cerrarTurno(importeFinal) | closeShift(finalBalance) |
| cuadrarTurno(ajuste, motivo) | reconcileShift(adjustment, reason) |
| crearCategoria(codigo, nombre, padre?) | createCategory(code, name, parent?) |
| marcarComoImputable() | markAsBookable() |
| desactivar() | deactivate() |
| abrirEjercicio(periodo, saldoInicial) | openFiscalYear(period, openingBalance) |
| cerrarEjercicio() | closeFiscalYear() |
| reaperturar(motivo) | reopen(reason) |
| agregarOpcionMenu(nombre, precio) | addMenuOption(name, price) |
| realizarReserva(socio, opcionMenu) | makeReservation(member, menuOption) |
| modificarReserva(reserva, nuevaOpcion) | updateReservation(reservation, newOption) |
| confirmarComensales() | confirmDiners() |
| crearCuadrilla(nombre, responsable) | createSquad(name, leader) |
| agregarMiembro(socio, rol) | addMember(member, role) |
| removerMiembro(socio, motivo) | removeMember(member, reason) |
| asignarAEvento(evento) | assignToEvent(event) |
| crearPartido(rival, fecha, campo) | createMatch(opponent, date, venue) |
| convocarJugadores(socios[]) | callPlayers(members[]) |
| registrarResultado(golesLocal, golesVisitante) | recordResult(homeGoals, awayGoals) |
| registrarEstadistica(jugador, tipo, valor) | recordStat(player, type, value) |
| generarAlerta(tipo, descripcion, criticidad) | generateAlert(type, description, severity) |
| asignarResponsable(usuario) | assignResponsible(user) |
| marcarComoResuelta(observaciones) | markAsResolved(notes) |
| escalar() | escalate() |

---

## 8. Domain Events

| Actual (ES) | Propuesta (EN) |
|---|---|
| SocioRegistrado | MemberRegistered |
| SocioDadoDeBaja | MemberDeactivated |
| EstadoSocioCambiado | MemberStatusChanged |
| TipoSocioCambiado | MemberTypeChanged |
| DatosSocioActualizados | MemberDataUpdated |
| CarnetValidado | MemberCardValidated |
| EjercicioAbierto | FiscalYearOpened |
| EjercicioCerrado | FiscalYearClosed |
| SolicitudAltaIniciada | RegistrationRequestStarted |
| SolicitudAltaAprobada | RegistrationRequestApproved |
| TipoSocioCreado | MemberTypeCreated |
| BajaPorImpago | NonpaymentLeave |
| CargoGenerado | ChargeGenerated |
| PagoRegistrado | PaymentRecorded |
| PagoDevuelto | PaymentReturned |
| MorosidadDetectada | DelinquencyDetected |
| PlanCuotaCreado | FeePlanCreated |
| PlanCuotaModificado | FeePlanModified |
| PlanCuotaVinculadoATipoSocio | FeePlanLinkedToMemberType |
| CargoPagado | ChargePaid |
| CargoCobrado | ChargeCollected |
| CargoMarcadoReintento | ChargeMarkedForRetry |
| ReciboGenerado | ReceiptGenerated |
| MandatoSepaRegistrado | SepaMandateRegistered |
| MandatoSepaRevocado | SepaMandateRevoked |
| RemesaSepaGenerada | SepaRemittanceGenerated |
| EnlacePagoGenerado | PaymentLinkGenerated |
| MorosidadRegularizada | DelinquencyRegularized |
| CertificadoDescubiertoGenerado | OverdraftCertificateGenerated |
| SuscripcionCreada | SubscriptionCreated |
| SuscripcionModificada | SubscriptionModified |
| SuscripcionCerrada | SubscriptionClosed |
| GeneracionMensualCompletada | MonthlyGenerationCompleted |
| DescuadreDetectado | DiscrepancyDetected |
| EventoCreado | EventCreated |
| EventoPublicado | EventPublished |
| EventoCancelado | EventCancelled |
| InscripcionRealizada | RegistrationCompleted |
| InscripcionCancelada | RegistrationCancelled |
| AforoCompletado | CapacityReached |
| PlazaLiberada | SlotReleased |
| ValoracionesEventoSolicitadas | EventFeedbackRequested |
| ProblemaRecurrenteDetectado | RecurringIssueDetected |
| ComunicacionEnviada | CommunicationSent |
| EmailRebotado | EmailBounced |
| NotificacionBienvenidaEnviada | WelcomeNotificationSent |
| RecordatorioPagoEnviado | PaymentReminderSent |
| AvisoMorosidadEnviado | DelinquencyNoticeSent |
| AvisoDomiciliacionEnviado | DirectDebitNoticeSent |
| ConfirmacionInscripcionEnviada | RegistrationConfirmationSent |
| InformeAsambleaGenerado | AssemblyReportGenerated |
| UsuarioCreado | UserCreated |
| UsuarioAutenticado | UserAuthenticated |
| AutenticacionFallida | AuthenticationFailed |
| UsuarioBloqueado | UserBlocked |
| TenantProvisionado | TenantProvisioned |
| TraspasoIniciado | HandoverStarted |
| TraspasoCompletado | HandoverCompleted |
| ExpedienteDisciplinarioAbierto | DisciplinaryCaseOpened |
| SocioRehabilitado | MemberReinstated |
| AspiranteRegistrado | ApplicantRegistered |
| VacanteDisponible | VacancyAvailable |
| PlazosVencido | DeadlineExpired |
| AntiguedadAlcanzada | SeniorityThresholdReached |
| EventoTimelineRegistrado | TimelineEventRecorded |
| ProcesoEstancado | ProcessStalled |
| CarnetGenerado | MemberCardGenerated |
| SocioInscritoEnCuadrilla | MemberAssignedToSquad |
| PagoOnlineRealizado | OnlinePaymentCompleted |
| DeudaSaldada | DebtSettled |
| MorosidadCritica | CriticalDelinquency |
| SocioActualizado | MemberUpdated |
| TurnoCajaAbierto | CashRegisterOpened |
| TurnoCajaCerrado | CashRegisterClosed |
| ExportacionSolicitada | ExportRequested |
| ExportacionFallida | ExportFailed |
| PlanAmpliado | PlanUpgraded |

### Eventos internos vs negocio (ya documentados)
| Interno (ES) | Negocio (EN) |
|---|---|
| TenantCreado | TenantProvisioned |
| RemesaGenerada | SepaRemittanceGenerated |
| RemesaProcesada | SepaRemittanceSent |
| MandatoCreado | SepaMandateRegistered |
| MandatoCaducado | (implícito) |
| SocioSuspendidoPorImpago | MemberStatusChanged |

---

## 9. Domain Services

| Actual (ES) | Propuesta (EN) |
|---|---|
| GeneradorCargos | ChargeGenerator |
| GeneradorCargoManual | ManualChargeGenerator |
| CalculadorProrrateo | ProrataCalculator |
| GeneradorRemesaSepa | SepaRemittanceGenerator |
| GestorMorosidad | DelinquencyManager |
| ConciliadorPagos | PaymentReconciler |
| GestorSuscripciones | SubscriptionManager |
| EstadisticasSocios | MemberStatistics |
| ValidadorTransicionEstado | StatusTransitionValidator |
| EvaluadorReglasTipoSocio | MemberTypeRulesEvaluator |

---

## 10. Application Services

| Actual (ES) | Propuesta (EN) |
|---|---|
| SocioService | MemberService |
| TipoSocioService | MemberTypeService |
| EstadisticasService | StatisticsService |
| EjercicioService | FiscalYearService |
| AltaSocioService | MemberRegistrationService |
| BajaSocioService | MemberDeactivationService |
| ListaEsperaService | WaitingListService |
| CarnetService | MemberCardService |
| TenantProvisioningService | TenantProvisioningService (sin cambio) |
| AuthenticationService | AuthenticationService (sin cambio) |
| TenantConfigService | TenantConfigService (sin cambio) |
| RoleManagementService | RoleManagementService (sin cambio) |
| TraspasoCargoService | HandoverService |

---

## 11. Tablas de Base de Datos (snake_case)

| Actual (ES) | Propuesta (EN) |
|---|---|
| socios | members |
| solicitudes_alta | registration_requests |
| solicitud_avales | request_endorsements |
| solicitud_documentos | request_documents |
| ejercicios | fiscal_years |
| carnets | member_cards |
| lista_espera | waiting_lists |
| aspirantes_espera | waiting_list_applicants |
| traspasos_cargo | handovers |
| historial_cargos | office_history |
| roles | roles (sin cambio) |
| role_permissions | role_permissions (sin cambio) |
| custom_fields | custom_fields (sin cambio) |
| tenants_registry | tenants_registry (sin cambio) |
| timeline_eventos | timeline_events |
| umbrales_antiguedad | seniority_thresholds |
| expedientes_disciplinarios | disciplinary_cases |
| workflow_morosidad | delinquency_workflow |
| outbox_events | outbox_events (sin cambio) |

---

## 12. Columnas de BD (snake_case)

| Actual (ES) | Propuesta (EN) |
|---|---|
| socio_id | member_id |
| numero_socio | member_number |
| estado_actual | current_status |
| fecha_alta | registration_date |
| datos_personales | personal_data |
| tipo_socio_id | member_type_id |
| fecha_nacimiento | birth_date |
| fecha_solicitud | request_date |
| fecha_ultima_actualizacion | last_updated_at |
| fecha_inicio_cargo | office_start_date |
| fecha_fin_cargo | office_end_date |
| fecha_rehabilitacion | reinstatement_date |
| ejercicio_id | fiscal_year_id |
| ejercicio_anterior_id | previous_fiscal_year_id |
| socios_al_inicio | members_at_start |
| socios_al_fin | members_at_end |
| memoria_id | report_id |
| is_system | is_system (sin cambio) |
| inmutable | immutable |
| antiguedad_cache | seniority_cache |
| reglas_config | rules_config |

---

## 13. Endpoints API

| Actual (ES) | Propuesta (EN) |
|---|---|
| /api/v1/socios | /api/v1/members |
| /api/v1/eventos | /api/v1/events |
| /lista-espera/consultar/:token | /waiting-list/check/:token |

---

## 14. Permisos (formato `modulo:recurso:accion`)

Formato de tres niveles: `modulo:recurso:accion`
- **Módulo**: alineado con Bounded Context (`membership`, `treasury`, `events`, `communication`, `documents`, `identity`)
- **Recurso**: entidad de dominio dentro del módulo (`members`, `charges`, `fees`, etc.)
- **Acción CRUD base**: `create`, `read`, `update`, `delete`
- **Acciones específicas**: `process`, `send`, `approve`, `export`, etc.
- **Wildcard**: `*` en cualquier nivel

### Permisos referenciados en la documentación

| Actual (ES) | Propuesta (EN) |
|---|---|
| `tesoreria.*.*` | `treasury:*:*` |
| `membresia.socio.read` | `membership:members:read` |
| `membresia.*.*` | `membership:*:*` |
| `comunicacion.*.*` | `communication:*:*` |
| `*.*.read` | `*:*:read` |
| `eventos.inscripcion.create` | `events:registrations:create` |
| `socios:write` | `membership:members:write` |
| `cuotas:write` | `treasury:fees:write` |
| `ver_socios` | `membership:members:read` |
| `ver_estadisticas` | `membership:statistics:read` |
| `crear_socios` | `membership:members:create` |

### Tabla de roles predefinidos

| Rol | Permisos |
|---|---|
| `admin` | `*:*:*` |
| `president` | `*:*:*` + aprobaciones críticas |
| `treasurer` | `treasury:*:*`, `membership:members:read` |
| `secretary` | `membership:*:*`, `communication:*:*` |
| `board_member` | `*:*:read`, `events:registrations:create` |
| `member` | Solo portal (datos propios) |

---

## 15. Scripts mencionados (sin cambio, son herramientas internas)

- `inventario_eventos.py` → sin cambio
- `detectar_duplicados_kb005.py` → sin cambio
- `eliminar_duplicados_kb005.py` → sin cambio

---

## Archivos afectados

| Archivo | Impacto |
|---|---|
| `003_requisitos-funcionales.md` | Bajo (SuscripcionCuota, PlanCuota) |
| `005_modelo-dominio.md` | **Muy alto** (todos los aggregates, entities, VOs, events, services) |
| `006_adrs.md` | Medio (domain events, endpoints, BCs) |
| `008_rnf-tecnicos.md` | Bajo (permisos, algunos config vars) |
| `009_user-stories.md` | Bajo (roles ya como códigos) |
| `010_casos-uso.md` | **Muy alto** (application services, events, tablas BD, código) |
| `004_rnf-base.md` | Ninguno |
| `007_stack.md` | Ninguno |
