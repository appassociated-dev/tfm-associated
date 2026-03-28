# Modelo de Datos - Esquema Relacional

**Proyecto:** Associated - ERP Ligero para Colectividades Españolas
**Versión:** 1.0
**Fecha:** Marzo 2026
**Inputs:** KB-005 (Modelo de Dominio), KB-006 (ADRs), KB-007 (Stack Tecnológico)
**Estado:** Borrador
**Total Entidades:** 40

---

## Índice

1. [Convenciones del Esquema](#1-convenciones-del-esquema)
2. [BC-Identity](#2-bc-identity)
   - [ENT-001: tenants](#ent-001-tenants)
   - [ENT-002: users](#ent-002-users)
   - [ENT-003: tenant_memberships](#ent-003-tenant_memberships)
   - [ENT-004: roles](#ent-004-roles)
   - [ENT-005: refresh_tokens](#ent-005-refresh_tokens)
3. [Transversal](#3-transversal)
   - [ENT-006: outbox_events (main)](#ent-006-outbox_events-main)
4. [BC-Membership](#4-bc-membership)
   - [ENT-007: member_types](#ent-007-member_types)
   - [ENT-008: fiscal_years](#ent-008-fiscal_years)
   - [ENT-009: members](#ent-009-members)
   - [ENT-010: status_history](#ent-010-status_history)
5. [BC-Treasury](#5-bc-treasury)
   - [ENT-011: fee_plans](#ent-011-fee_plans)
   - [ENT-012: member_type_fee_plans](#ent-012-member_type_fee_plans)
   - [ENT-013: member_accounts](#ent-013-member_accounts)
   - [ENT-014: fee_subscriptions](#ent-014-fee_subscriptions)
   - [ENT-015: charges](#ent-015-charges)
   - [ENT-016: payments](#ent-016-payments)
6. [Transversal (Tenant)](#6-transversal-tenant)
   - [ENT-017: outbox_events (tenant)](#ent-017-outbox_events-tenant)
7. [BC-Treasury - Pendiente Fase 2](#7-bc-treasury--pendiente-fase-2)
   - [ENT-018: sepa_mandates](#ent-018-sepa_mandates)
   - [ENT-019: sepa_remittances](#ent-019-sepa_remittances)
   - [ENT-020: sepa_debits](#ent-020-sepa_debits)
8. [Entidades Placeholder (Fuera del MVP)](#8-entidades-placeholder-fuera-del-mvp)
   - [ENT-021: member_cards](#ent-021-member_cards)
   - [ENT-022: waiting_list](#ent-022-waiting_list)
   - [ENT-023: disciplinary_cases](#ent-023-disciplinary_cases)
   - [ENT-024: registration_requests](#ent-024-registration_requests)
   - [ENT-025: payment_links](#ent-025-payment_links)
   - [ENT-026: cash_register_shifts](#ent-026-cash_register_shifts)
   - [ENT-027: transactions](#ent-027-transactions)
   - [ENT-028: accounting_categories](#ent-028-accounting_categories)
   - [ENT-029: accounting_years](#ent-029-accounting_years)
   - [ENT-030: events](#ent-030-events)
   - [ENT-031: event_types](#ent-031-event_types)
   - [ENT-032: social_dinners](#ent-032-social_dinners)
   - [ENT-033: squads](#ent-033-squads)
   - [ENT-034: matches](#ent-034-matches)
   - [ENT-035: communications](#ent-035-communications)
   - [ENT-036: templates](#ent-036-templates)
   - [ENT-037: announcements](#ent-037-announcements)
   - [ENT-038: documents](#ent-038-documents)
   - [ENT-039: document_categories](#ent-039-document_categories)
   - [ENT-040: meeting_minutes](#ent-040-meeting_minutes)
9. [Trazabilidad](#9-trazabilidad)

---

## Navegación

Cada entidad se encuentra en `ent/ent-{nnn}.md`.
Ejemplo: `references/ent/ent-001.md` para ENT-001.
