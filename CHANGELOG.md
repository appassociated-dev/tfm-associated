# Changelog

Todos los cambios notables en este proyecto seran documentados en este archivo.

El formato esta basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

### 20260310-001-pvidal-CLAUDE

- **Fecha de sesion:** 10 de marzo de 2026
- **Hora de inicio:** 13:58
- **Hora de ultimos trabajos:** 14:04
- **Documento de sesion:** [doc/agents-sessions/20260310-001-pvidal-CLAUDE.md](doc/agents-sessions/20260310-001-pvidal-CLAUDE.md)

#### Added

- Implementada UC-006: Gestion de ficha de socio (Backend) completa en BC-Membership
- 6 Value Objects de dominio: PersonalData, ContactData, IdentityDocument (validacion DNI/NIE mod-23), BankDetails (validacion IBAN mod-97), MemberNumber, CustomFields
- Servicio de cifrado AES-256-GCM para IBAN con IV aleatorio (RNF-006)
- 4 endpoints REST para gestion de socios: POST/GET/GET:id/PUT en `/api/v1/members`
- 4 handlers CQRS: CreateMember, UpdateMember, GetMember, ListMembers
- Domain Events: MemberRegisteredEvent y MemberDataUpdatedEvent
- Campos personalizados (custom_fields JSONB) por tipo de colectividad: cofradia, club deportivo, pena, asociacion cultural
- 184 tests nuevos (163 unitarios + 21 integracion)

#### Changed

- Member Aggregate extendido con factory `register()`, metodos de actualizacion y calculo de antiguedad
- MemberPrismaMapper convertido de estatico a inyectable para integrar cifrado de IBAN
- PrismaMemberRepository extendido con 6 metodos nuevos (findByEmail, existsByIdentityDocument, getNextMemberNumber, etc.)
- Schema Prisma del tenant extendido con 15 campos nuevos en modelo Member

#### Fixed

- Corregidos mocks incompletos de MemberRepository en 4 archivos de test de Task 5
- Corregido mock de ErrorReporter en domain-exception.filter.spec.ts
- Corregido import faltante de beforeEach en permissions.guard.spec.ts

#### Removed

[Sin cambios]

---
