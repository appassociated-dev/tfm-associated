# Inventario de Endpoints

**Proyecto:** Associated - ERP Ligero para Colectividades Españolas
**Versión:** 1.0
**Fecha:** Marzo 2026
**Inputs:** KB-010 (Casos de Uso), KB-012 (Modelo de Datos), KB-006 (ADRs)
**Total Endpoints:** 123

---

## Índice

1. [Convenciones](#1-convenciones)
2. [BC-Identity](#2-bc-identity)
3. [BC-Membership](#3-bc-membership)
4. [BC-Treasury](#4-bc-treasury)
5. [BC-Events](#5-bc-events)
6. [BC-Communication](#6-bc-communication)
7. [BC-Documents](#7-bc-documents)
8. [Transversal](#8-transversal)
9. [Trazabilidad](#9-trazabilidad)

---

## 9. Trazabilidad

### EP → Caso de Uso

| EP     | Endpoint                                                                       | UC                    | BC               |
| ------ | ------------------------------------------------------------------------------ | --------------------- | ---------------- |
| EP-001 | GET /api/v1/health                                                             | N/A (infraestructura) | BC-Identity      |
| EP-002 | POST /api/v1/tenants                                                           | UC-001                | BC-Identity      |
| EP-003 | POST /api/v1/auth/login                                                        | UC-002                | BC-Identity      |
| EP-004 | POST /api/v1/auth/refresh                                                      | UC-002                | BC-Identity      |
| EP-005 | POST /api/v1/auth/logout                                                       | UC-002                | BC-Identity      |
| EP-006 | POST /api/v1/auth/switch-tenant                                                | UC-002                | BC-Identity      |
| EP-007 | GET /api/v1/auth/me                                                            | UC-002                | BC-Identity      |
| EP-008 | POST /api/v1/member-types                                                      | UC-008                | BC-Membership    |
| EP-009 | GET /api/v1/member-types                                                       | UC-008                | BC-Membership    |
| EP-010 | GET /api/v1/member-types/templates                                             | UC-008                | BC-Membership    |
| EP-011 | POST /api/v1/member-types/import-template                                      | UC-008                | BC-Membership    |
| EP-012 | GET /api/v1/member-types/:id                                                   | UC-008                | BC-Membership    |
| EP-013 | PUT /api/v1/member-types/:id                                                   | UC-008                | BC-Membership    |
| EP-014 | PATCH /api/v1/member-types/:id/deactivate                                      | UC-008                | BC-Membership    |
| EP-015 | POST /api/v1/fiscal-years                                                      | UC-010                | BC-Membership    |
| EP-016 | GET /api/v1/fiscal-years                                                       | UC-010                | BC-Membership    |
| EP-017 | GET /api/v1/fiscal-years/active                                                | UC-010                | BC-Membership    |
| EP-018 | GET /api/v1/fiscal-years/compare                                               | UC-010                | BC-Membership    |
| EP-019 | GET /api/v1/fiscal-years/:id                                                   | UC-010                | BC-Membership    |
| EP-020 | POST /api/v1/fiscal-years/:id/close                                            | UC-010                | BC-Membership    |
| EP-021 | POST /api/v1/members                                                           | UC-006                | BC-Membership    |
| EP-022 | GET /api/v1/members                                                            | UC-006                | BC-Membership    |
| EP-023 | GET /api/v1/members/:id                                                        | UC-006                | BC-Membership    |
| EP-024 | PUT /api/v1/members/:id                                                        | UC-006                | BC-Membership    |
| EP-025 | GET /api/v1/members/preconditions                                              | UC-011                | BC-Membership    |
| EP-026 | POST /api/v1/members/simple-registration                                       | UC-011                | BC-Membership    |
| EP-027 | GET /api/v1/members/check-dni/:documentType/:documentNumber                    | UC-011                | BC-Membership    |
| EP-028 | GET /api/v1/members/check-email/:email                                         | UC-011                | BC-Membership    |
| EP-029 | POST /api/v1/members/:id/status                                                | UC-007                | BC-Membership    |
| EP-030 | GET /api/v1/members/:id/status-history                                         | UC-007                | BC-Membership    |
| EP-031 | GET /api/v1/members/:id/available-transitions                                  | UC-007                | BC-Membership    |
| EP-032 | POST /api/v1/members/delinquency-check                                         | UC-007                | BC-Membership    |
| EP-033 | GET /api/v1/members/:id/leave-summary                                          | UC-013                | BC-Membership    |
| EP-034 | POST /api/v1/members/:id/voluntary-leave                                       | UC-013                | BC-Membership    |
| EP-035 | POST /api/v1/members/:id/nonpayment-leave                                      | UC-013                | BC-Membership    |
| EP-036 | GET /api/v1/members/:id/reinstatement-summary                                  | UC-013                | BC-Membership    |
| EP-037 | POST /api/v1/members/:id/reinstate                                             | UC-013                | BC-Membership    |
| EP-038 | POST /api/v1/treasury/fee-plans                                                | UC-017                | BC-Treasury      |
| EP-039 | GET /api/v1/treasury/fee-plans                                                 | UC-017                | BC-Treasury      |
| EP-040 | GET /api/v1/treasury/fee-plans/templates                                       | UC-017                | BC-Treasury      |
| EP-041 | POST /api/v1/treasury/fee-plans/import-template                                | UC-017                | BC-Treasury      |
| EP-042 | GET /api/v1/treasury/fee-plans/:id                                             | UC-017                | BC-Treasury      |
| EP-043 | PUT /api/v1/treasury/fee-plans/:id                                             | UC-017                | BC-Treasury      |
| EP-044 | PATCH /api/v1/treasury/fee-plans/:id/deactivate                                | UC-017                | BC-Treasury      |
| EP-045 | PATCH /api/v1/treasury/fee-plans/:id/activate                                  | UC-017                | BC-Treasury      |
| EP-046 | POST /api/v1/treasury/fee-plans/:id/link-member-types                          | UC-017                | BC-Treasury      |
| EP-047 | POST /api/v1/treasury/member-accounts/:accountId/subscriptions                 | UC-018                | BC-Treasury      |
| EP-048 | GET /api/v1/treasury/member-accounts/:accountId/subscriptions                  | UC-018                | BC-Treasury      |
| EP-049 | GET /api/v1/treasury/member-accounts/:accountId/subscriptions/active           | UC-018                | BC-Treasury      |
| EP-050 | POST /api/v1/treasury/member-accounts/:accountId/subscriptions/:id/change-plan | UC-018                | BC-Treasury      |
| EP-051 | PATCH /api/v1/treasury/member-accounts/:accountId/subscriptions/:id/discount   | UC-018                | BC-Treasury      |
| EP-052 | POST /api/v1/treasury/member-accounts/:accountId/subscriptions/:id/close       | UC-018                | BC-Treasury      |
| EP-053 | POST /api/v1/treasury/charges/generate-monthly                                 | UC-019                | BC-Treasury      |
| EP-054 | GET /api/v1/treasury/charges/generation-log                                    | UC-019                | BC-Treasury      |
| EP-055 | GET /api/v1/treasury/member-accounts/:accountId/charges                        | UC-019                | BC-Treasury      |
| EP-056 | POST /api/v1/treasury/member-accounts/:accountId/charges/generate-subscription | UC-019                | BC-Treasury      |
| EP-057 | GET /api/v1/treasury/payments/:id/receipt                                      | UC-021                | BC-Treasury      |
| EP-058 | GET /api/v1/treasury/search-members                                            | UC-021                | BC-Treasury      |
| EP-059 | POST /api/v1/treasury/member-accounts/:accountId/payments                      | UC-021                | BC-Treasury      |
| EP-060 | POST /api/v1/treasury/member-accounts/:accountId/payments/multi                | UC-021                | BC-Treasury      |
| EP-061 | GET /api/v1/treasury/member-accounts/:accountId/payments                       | UC-021                | BC-Treasury      |
| EP-062 | GET /api/v1/treasury/member-accounts/:accountId/pending-charges                | UC-021                | BC-Treasury      |
| EP-063 | GET /api/v1/treasury/member-accounts/:accountId/balance                        | UC-021                | BC-Treasury      |
| EP-064 | GET /api/v1/roles                                                              | UC-004                | BC-Identity      |
| EP-065 | POST /api/v1/roles                                                             | UC-004                | BC-Identity      |
| EP-066 | GET /api/v1/roles/:id                                                          | UC-004                | BC-Identity      |
| EP-067 | PATCH /api/v1/roles/:id                                                        | UC-004                | BC-Identity      |
| EP-068 | DELETE /api/v1/roles/:id                                                       | UC-004                | BC-Identity      |
| EP-069 | POST /api/v1/roles/:id/clone                                                   | UC-004                | BC-Identity      |
| EP-070 | POST /api/v1/users/:id/role                                                    | UC-004                | BC-Identity      |
| EP-071 | POST /api/v1/treasury/member-accounts/:accountId/charges/manual                | UC-020                | BC-Treasury      |
| EP-072 | POST /api/v1/treasury/charges/manual/bulk                                      | UC-020                | BC-Treasury      |
| EP-073 | GET /api/v1/treasury/charges/manual/bulk/:jobId                                | UC-020                | BC-Treasury      |
| EP-074 | GET /api/v1/treasury/sepa/config                                               | UC-023                | BC-Treasury      |
| EP-075 | PUT /api/v1/treasury/sepa/config                                               | UC-023                | BC-Treasury      |
| EP-076 | POST /api/v1/treasury/member-accounts/:accountId/sepa-mandate                  | UC-023                | BC-Treasury      |
| EP-077 | GET /api/v1/treasury/member-accounts/:accountId/sepa-mandate                   | UC-023                | BC-Treasury      |
| EP-078 | DELETE /api/v1/treasury/member-accounts/:accountId/sepa-mandate/:mandateId     | UC-023                | BC-Treasury      |
| EP-079 | POST /api/v1/treasury/sepa-remittances/preview                                 | UC-023                | BC-Treasury      |
| EP-080 | POST /api/v1/treasury/sepa-remittances                                         | UC-023                | BC-Treasury      |
| EP-081 | GET /api/v1/treasury/sepa-remittances                                          | UC-023                | BC-Treasury      |
| EP-082 | GET /api/v1/treasury/sepa-remittances/:id                                      | UC-023                | BC-Treasury      |
| EP-083 | GET /api/v1/treasury/sepa-remittances/:id/download                             | UC-023                | BC-Treasury      |
| EP-084 | PATCH /api/v1/treasury/sepa-remittances/:id/mark-sent                          | UC-023                | BC-Treasury      |
| EP-085 | POST /api/v1/treasury/sepa-remittances/:id/returns                             | UC-024                | BC-Treasury      |
| EP-086 | POST /api/v1/treasury/sepa-remittances/:id/returns/:returnId/schedule-retry    | UC-024                | BC-Treasury      |
| EP-087 | GET /api/v1/treasury/sepa-remittances/:id/returns/report                       | UC-024                | BC-Treasury      |
| EP-088 | Placeholder - UC-028 (Registro y Configuración de Eventos)                     | UC-028                | BC-Events        |
| EP-089 | Placeholder - UC-029 (Calendario y Sincronización)                             | UC-029                | BC-Events        |
| EP-090 | Placeholder - UC-030 (Inscripciones Online)                                    | UC-030                | BC-Events        |
| EP-091 | Placeholder - UC-031 (Control de Aforo y Listas de Espera)                     | UC-031                | BC-Events        |
| EP-092 | Placeholder - UC-032 (Check-in y Control de Asistencia)                        | UC-032                | BC-Events        |
| EP-093 | Placeholder - UC-033 (Eventos Específicos: Comidas Populares)                  | UC-033                | BC-Events        |
| EP-094 | Placeholder - UC-034 (Eventos Específicos: Procesiones de Cofradías)           | UC-034                | BC-Events        |
| EP-095 | Placeholder - UC-035 (Eventos Específicos: Cuadrillas de Costaleros)           | UC-035                | BC-Events        |
| EP-096 | Placeholder - UC-036 (Eventos Específicos: Cultos de Cofradías)                | UC-036                | BC-Events        |
| EP-097 | Placeholder - UC-037 (Eventos Específicos: Competiciones Deportivas)           | UC-037                | BC-Events        |
| EP-098 | Placeholder - UC-038 (Valoraciones y Feedback de Eventos)                      | UC-038                | BC-Events        |
| EP-099 | Placeholder - UC-039 (Envío de Comunicaciones por Email)                       | UC-039                | BC-Communication |
| EP-100 | Placeholder - UC-040 (Envío de SMS para Urgencias)                             | UC-040                | BC-Communication |
| EP-101 | Placeholder - UC-041 (Notificaciones Push vía PWA)                             | UC-041                | BC-Communication |
| EP-102 | Placeholder - UC-042 (Gestión de Plantillas de Comunicación)                   | UC-042                | BC-Communication |
| EP-103 | Placeholder - UC-043 (Segmentación de Destinatarios)                           | UC-043                | BC-Communication |
| EP-104 | Placeholder - UC-044 (Programación de Envíos)                                  | UC-044                | BC-Communication |
| EP-105 | Placeholder - UC-045 (Histórico y Tracking de Comunicaciones)                  | UC-045                | BC-Communication |
| EP-106 | Placeholder - UC-046 (Tablón de Anuncios Interno)                              | UC-046                | BC-Communication |
| EP-107 | Placeholder - UC-047 (Comunicaciones Automáticas vía Event Handlers)           | UC-047                | BC-Communication |
| EP-108 | Placeholder - UC-048 (Gestión de Libro de Actas Digital)                       | UC-048                | BC-Documents     |
| EP-109 | Placeholder - UC-049 (Registro de Asistentes y Cálculo de Quórum)              | UC-049                | BC-Documents     |
| EP-110 | Placeholder - UC-050 (Archivo Histórico y Consulta de Actas)                   | UC-050                | BC-Documents     |
| EP-111 | Placeholder - UC-051 (Repositorio Centralizado de Documentos)                  | UC-051                | BC-Documents     |
| EP-112 | Placeholder - UC-052 (Subida y Previsualización de Documentos)                 | UC-052                | BC-Documents     |
| EP-113 | Placeholder - UC-053 (Búsqueda y Filtrado de Documentos)                       | UC-053                | BC-Documents     |
| EP-114 | Placeholder - UC-054 (Control de Permisos y Límites de Almacenamiento)         | UC-054                | BC-Documents     |
| EP-115 | Placeholder - UC-055 (Control de Versiones y OCR Avanzado)                     | UC-055                | BC-Documents     |
| EP-116 | POST /api/v1/imports/members                                                   | UC-056                | Transversal      |
| EP-117 | POST /api/v1/imports/members/:jobId/validate                                   | UC-056                | Transversal      |
| EP-118 | POST /api/v1/imports/members/:jobId/execute                                    | UC-056                | Transversal      |
| EP-119 | GET /api/v1/imports/members/:jobId/status                                      | UC-056                | Transversal      |
| EP-120 | GET /api/v1/dashboard/kpis                                                     | UC-064                | Transversal      |
| EP-121 | GET /api/v1/dashboard/analytics/member-evolution                               | UC-065                | Transversal      |
| EP-122 | GET /api/v1/dashboard/analytics/revenue-evolution                              | UC-065                | Transversal      |
| EP-123 | GET /api/v1/dashboard/analytics/export                                         | UC-065                | Transversal      |

### EP → Entidad (ENT)

| EP     | Endpoint                                                                       | ENT Principales                    | BC            |
| ------ | ------------------------------------------------------------------------------ | ---------------------------------- | ------------- |
| EP-002 | POST /api/v1/tenants                                                           | ENT-001, ENT-002                   | BC-Identity   |
| EP-003 | POST /api/v1/auth/login                                                        | ENT-002, ENT-003                   | BC-Identity   |
| EP-004 | POST /api/v1/auth/refresh                                                      | ENT-002                            | BC-Identity   |
| EP-005 | POST /api/v1/auth/logout                                                       | ENT-002                            | BC-Identity   |
| EP-006 | POST /api/v1/auth/switch-tenant                                                | ENT-001, ENT-002, ENT-003          | BC-Identity   |
| EP-007 | GET /api/v1/auth/me                                                            | ENT-002, ENT-003                   | BC-Identity   |
| EP-008 | POST /api/v1/member-types                                                      | ENT-007                            | BC-Membership |
| EP-009 | GET /api/v1/member-types                                                       | ENT-007                            | BC-Membership |
| EP-010 | GET /api/v1/member-types/templates                                             | ENT-007                            | BC-Membership |
| EP-011 | POST /api/v1/member-types/import-template                                      | ENT-007                            | BC-Membership |
| EP-012 | GET /api/v1/member-types/:id                                                   | ENT-007                            | BC-Membership |
| EP-013 | PUT /api/v1/member-types/:id                                                   | ENT-007                            | BC-Membership |
| EP-014 | PATCH /api/v1/member-types/:id/deactivate                                      | ENT-007                            | BC-Membership |
| EP-015 | POST /api/v1/fiscal-years                                                      | ENT-008                            | BC-Membership |
| EP-016 | GET /api/v1/fiscal-years                                                       | ENT-008                            | BC-Membership |
| EP-017 | GET /api/v1/fiscal-years/active                                                | ENT-008                            | BC-Membership |
| EP-018 | GET /api/v1/fiscal-years/compare                                               | ENT-008                            | BC-Membership |
| EP-019 | GET /api/v1/fiscal-years/:id                                                   | ENT-008                            | BC-Membership |
| EP-020 | POST /api/v1/fiscal-years/:id/close                                            | ENT-008                            | BC-Membership |
| EP-021 | POST /api/v1/members                                                           | ENT-009, ENT-007, ENT-008          | BC-Membership |
| EP-022 | GET /api/v1/members                                                            | ENT-009, ENT-007                   | BC-Membership |
| EP-023 | GET /api/v1/members/:id                                                        | ENT-009, ENT-007                   | BC-Membership |
| EP-024 | PUT /api/v1/members/:id                                                        | ENT-009                            | BC-Membership |
| EP-025 | GET /api/v1/members/preconditions                                              | ENT-007, ENT-008                   | BC-Membership |
| EP-026 | POST /api/v1/members/simple-registration                                       | ENT-009, ENT-007, ENT-008          | BC-Membership |
| EP-027 | GET /api/v1/members/check-dni/:documentType/:documentNumber                    | ENT-009                            | BC-Membership |
| EP-028 | GET /api/v1/members/check-email/:email                                         | ENT-009                            | BC-Membership |
| EP-029 | POST /api/v1/members/:id/status                                                | ENT-009, ENT-010                   | BC-Membership |
| EP-030 | GET /api/v1/members/:id/status-history                                         | ENT-009, ENT-010                   | BC-Membership |
| EP-031 | GET /api/v1/members/:id/available-transitions                                  | ENT-009                            | BC-Membership |
| EP-032 | POST /api/v1/members/delinquency-check                                         | ENT-009, ENT-010                   | BC-Membership |
| EP-033 | GET /api/v1/members/:id/leave-summary                                          | ENT-009, ENT-010                   | BC-Membership |
| EP-034 | POST /api/v1/members/:id/voluntary-leave                                       | ENT-009, ENT-010                   | BC-Membership |
| EP-035 | POST /api/v1/members/:id/nonpayment-leave                                      | ENT-009, ENT-010                   | BC-Membership |
| EP-036 | GET /api/v1/members/:id/reinstatement-summary                                  | ENT-009, ENT-010                   | BC-Membership |
| EP-037 | POST /api/v1/members/:id/reinstate                                             | ENT-009, ENT-010                   | BC-Membership |
| EP-038 | POST /api/v1/treasury/fee-plans                                                | ENT-011                            | BC-Treasury   |
| EP-039 | GET /api/v1/treasury/fee-plans                                                 | ENT-011                            | BC-Treasury   |
| EP-040 | GET /api/v1/treasury/fee-plans/templates                                       | ENT-011                            | BC-Treasury   |
| EP-041 | POST /api/v1/treasury/fee-plans/import-template                                | ENT-011                            | BC-Treasury   |
| EP-042 | GET /api/v1/treasury/fee-plans/:id                                             | ENT-011                            | BC-Treasury   |
| EP-043 | PUT /api/v1/treasury/fee-plans/:id                                             | ENT-011                            | BC-Treasury   |
| EP-044 | PATCH /api/v1/treasury/fee-plans/:id/deactivate                                | ENT-011                            | BC-Treasury   |
| EP-045 | PATCH /api/v1/treasury/fee-plans/:id/activate                                  | ENT-011                            | BC-Treasury   |
| EP-046 | POST /api/v1/treasury/fee-plans/:id/link-member-types                          | ENT-011                            | BC-Treasury   |
| EP-047 | POST /api/v1/treasury/member-accounts/:accountId/subscriptions                 | ENT-013, ENT-014                   | BC-Treasury   |
| EP-048 | GET /api/v1/treasury/member-accounts/:accountId/subscriptions                  | ENT-013, ENT-014                   | BC-Treasury   |
| EP-049 | GET /api/v1/treasury/member-accounts/:accountId/subscriptions/active           | ENT-013, ENT-014                   | BC-Treasury   |
| EP-050 | POST /api/v1/treasury/member-accounts/:accountId/subscriptions/:id/change-plan | ENT-013, ENT-014                   | BC-Treasury   |
| EP-051 | PATCH /api/v1/treasury/member-accounts/:accountId/subscriptions/:id/discount   | ENT-013, ENT-014                   | BC-Treasury   |
| EP-052 | POST /api/v1/treasury/member-accounts/:accountId/subscriptions/:id/close       | ENT-013, ENT-014                   | BC-Treasury   |
| EP-053 | POST /api/v1/treasury/charges/generate-monthly                                 | ENT-013, ENT-014, ENT-015          | BC-Treasury   |
| EP-054 | GET /api/v1/treasury/charges/generation-log                                    | ENT-015                            | BC-Treasury   |
| EP-055 | GET /api/v1/treasury/member-accounts/:accountId/charges                        | ENT-013, ENT-015                   | BC-Treasury   |
| EP-056 | POST /api/v1/treasury/member-accounts/:accountId/charges/generate-subscription | ENT-013, ENT-014, ENT-015          | BC-Treasury   |
| EP-057 | GET /api/v1/treasury/payments/:id/receipt                                      | ENT-016                            | BC-Treasury   |
| EP-058 | GET /api/v1/treasury/search-members                                            | ENT-009, ENT-013                   | BC-Treasury   |
| EP-059 | POST /api/v1/treasury/member-accounts/:accountId/payments                      | ENT-013, ENT-015, ENT-016          | BC-Treasury   |
| EP-060 | POST /api/v1/treasury/member-accounts/:accountId/payments/multi                | ENT-013, ENT-015, ENT-016          | BC-Treasury   |
| EP-061 | GET /api/v1/treasury/member-accounts/:accountId/payments                       | ENT-013, ENT-016                   | BC-Treasury   |
| EP-062 | GET /api/v1/treasury/member-accounts/:accountId/pending-charges                | ENT-013, ENT-015                   | BC-Treasury   |
| EP-063 | GET /api/v1/treasury/member-accounts/:accountId/balance                        | ENT-013, ENT-015, ENT-016          | BC-Treasury   |
| EP-064 | GET /api/v1/roles                                                              | ENT-004                            | BC-Identity   |
| EP-065 | POST /api/v1/roles                                                             | ENT-004                            | BC-Identity   |
| EP-066 | GET /api/v1/roles/:id                                                          | ENT-004                            | BC-Identity   |
| EP-067 | PATCH /api/v1/roles/:id                                                        | ENT-004                            | BC-Identity   |
| EP-068 | DELETE /api/v1/roles/:id                                                       | ENT-004, ENT-003                   | BC-Identity   |
| EP-069 | POST /api/v1/roles/:id/clone                                                   | ENT-004                            | BC-Identity   |
| EP-070 | POST /api/v1/users/:id/role                                                    | ENT-002, ENT-003, ENT-004          | BC-Identity   |
| EP-071 | POST /api/v1/treasury/member-accounts/:accountId/charges/manual                | ENT-013, ENT-015                   | BC-Treasury   |
| EP-072 | POST /api/v1/treasury/charges/manual/bulk                                      | ENT-009, ENT-013, ENT-015          | BC-Treasury   |
| EP-073 | GET /api/v1/treasury/charges/manual/bulk/:jobId                                | ENT-015                            | BC-Treasury   |
| EP-074 | GET /api/v1/treasury/sepa/config                                               | ENT-019                            | BC-Treasury   |
| EP-075 | PUT /api/v1/treasury/sepa/config                                               | ENT-019                            | BC-Treasury   |
| EP-076 | POST /api/v1/treasury/member-accounts/:accountId/sepa-mandate                  | ENT-013, ENT-018                   | BC-Treasury   |
| EP-077 | GET /api/v1/treasury/member-accounts/:accountId/sepa-mandate                   | ENT-013, ENT-018                   | BC-Treasury   |
| EP-078 | DELETE /api/v1/treasury/member-accounts/:accountId/sepa-mandate/:mandateId     | ENT-013, ENT-018                   | BC-Treasury   |
| EP-079 | POST /api/v1/treasury/sepa-remittances/preview                                 | ENT-013, ENT-015, ENT-018, ENT-019 | BC-Treasury   |
| EP-080 | POST /api/v1/treasury/sepa-remittances                                         | ENT-013, ENT-015, ENT-018, ENT-019 | BC-Treasury   |
| EP-081 | GET /api/v1/treasury/sepa-remittances                                          | ENT-019                            | BC-Treasury   |
| EP-082 | GET /api/v1/treasury/sepa-remittances/:id                                      | ENT-019                            | BC-Treasury   |
| EP-083 | GET /api/v1/treasury/sepa-remittances/:id/download                             | ENT-019                            | BC-Treasury   |
| EP-084 | PATCH /api/v1/treasury/sepa-remittances/:id/mark-sent                          | ENT-019                            | BC-Treasury   |
| EP-085 | POST /api/v1/treasury/sepa-remittances/:id/returns                             | ENT-013, ENT-015, ENT-019          | BC-Treasury   |
| EP-086 | POST /api/v1/treasury/sepa-remittances/:id/returns/:returnId/schedule-retry    | ENT-015, ENT-019                   | BC-Treasury   |
| EP-087 | GET /api/v1/treasury/sepa-remittances/:id/returns/report                       | ENT-019                            | BC-Treasury   |
| EP-116 | POST /api/v1/imports/members                                                   | ENT-009                            | Transversal   |
| EP-117 | POST /api/v1/imports/members/:jobId/validate                                   | ENT-009                            | Transversal   |
| EP-118 | POST /api/v1/imports/members/:jobId/execute                                    | ENT-009                            | Transversal   |
| EP-119 | GET /api/v1/imports/members/:jobId/status                                      | ENT-009                            | Transversal   |
| EP-120 | GET /api/v1/dashboard/kpis                                                     | ENT-009, ENT-013, ENT-015, ENT-016 | Transversal   |
| EP-121 | GET /api/v1/dashboard/analytics/member-evolution                               | ENT-009                            | Transversal   |
| EP-122 | GET /api/v1/dashboard/analytics/revenue-evolution                              | ENT-015, ENT-016                   | Transversal   |
| EP-123 | GET /api/v1/dashboard/analytics/export                                         | ENT-009, ENT-015, ENT-016          | Transversal   |

### Resumen por Bounded Context

| BC               | Implementados | Pendientes Fase 2 | Pendientes Fase 3 | Placeholders | Total   |
| ---------------- | ------------- | ----------------- | ----------------- | ------------ | ------- |
| BC-Identity      | 7             | 7                 | 0                 | 0            | 14      |
| BC-Membership    | 30            | 0                 | 0                 | 0            | 30      |
| BC-Treasury      | 26            | 17                | 0                 | 0            | 43      |
| BC-Events        | 0             | 0                 | 0                 | 11           | 11      |
| BC-Communication | 0             | 0                 | 0                 | 9            | 9       |
| BC-Documents     | 0             | 0                 | 0                 | 8            | 8       |
| Transversal      | 0             | 4                 | 4                 | 0            | 8       |
| **Total**        | **63**        | **28**            | **4**             | **28**       | **123** |

> Nota sobre BC-Identity: EP-001 (health check) se contabiliza como Implementado aunque su UC es N/A (es un endpoint de infraestructura).

### Resumen por Fase MVP

| Fase         | Endpoints | Estado        |
| ------------ | --------- | ------------- |
| Fase 1       | 63        | Implementados |
| Fase 2       | 28        | Pendientes    |
| Fase 3       | 4         | Pendientes    |
| Fuera de MVP | 28        | Placeholders  |
| **Total**    | **123**   |               |

---

## Navegación

Cada endpoint se encuentra en `ep/ep-{nnn}.md`.
Ejemplo: `references/ep/ep-001.md` para EP-001.
