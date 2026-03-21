# Associated

**Gestión para colectividades**

![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-1.58-45BA4B?style=for-the-badge&logo=playwright&logoColor=white)

---

## Tabla de contenidos

- [Qué es Associated](#qué-es-associated)
- [El problema](#el-problema)
- [Para quién es Associated](#para-quién-es-associated)
- [Lo que Associated no es](#lo-que-associated-no-es)
- [Stack tecnológico](#stack-tecnológico)
- [Arquitectura](#arquitectura)
- [Alcance del MVP](#alcance-del-mvp)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Especificación](#especificación)
- [Inicio rápido](#inicio-rápido)
- [Decisiones arquitectónicas](#decisiones-arquitectónicas)
- [Licencia](#licencia)

---

## Qué es Associated

> _"Cuando llegué a tesorero de la peña, me encontré con siete versiones diferentes del listado de socios."_

Esa frase, recogida en entrevistas reales con voluntarios de colectividades en Aragón, resume un problema que comparten más de 300.000 asociaciones, peñas, clubes y cofradías en España. La gestión diaria recae en personas que dedican su tiempo libre a la comunidad y que, a cambio, heredan carpetas de Excel sin documentar, grupos de WhatsApp como canal oficial y cuadernos de contabilidad que solo entiende quien los escribió.

Associated es el ERP diseñado para que gestionar tu colectividad sea una tarea asumible, no un sacrificio. Socios, cuotas, eventos, comunicación y documentación en un solo lugar, adaptado al lenguaje y las necesidades reales de cofradías, peñas, clubes y asociaciones españolas. Con un plan gratuito para que ninguna entidad se quede fuera.

> [!NOTE]
> Este proyecto se desarrolla como Trabajo de Fin de Máster en Desarrollo de Software Asistido por Inteligencia Artificial, validado mediante entrevistas reales con tesoreros, secretarios y presidentes de colectividades en Aragón. No es un ejercicio académico aislado: Associated está concebido como producto real que continuará su desarrollo tras la entrega.

---

## El problema

El coste más grave de la situación actual no es operativo, es humano: **el freno al relevo generacional**. Nadie quiere asumir la tesorería o la secretaría porque "es un lío tremendo" y el anterior responsable "se fue sin explicar nada". Cada vez que una junta directiva no encuentra relevo, una comunidad pierde capacidad de funcionar.

El 75% de las colectividades españolas gestiona su operativa con Excel o papel. El tesorero hereda una hoja de cálculo con siete versiones y ninguna es la buena. El secretario mantiene tres listados de socios que no coinciden entre sí. El presidente no puede responder cuántos socios activos tiene sin hacer cuentas a mano.

No existe ninguna herramienta que combine estas tres cosas a la vez:

| Carencia                     | Realidad actual                                                                                                                           |
| :--------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| **Conocimiento del dominio** | Un "hermano" no es un "administrador", una "cuota" no es una "suscripción", una "papeleta de sitio" no aparece en ningún ERP corporativo. |
| **Precio accesible**         | Modelo freemium, porque el presupuesto no debería ser una barrera para organizarse.                                                       |
| **Plataforma integral**      | Todo lo que hoy requiere Excel + WhatsApp + email + carpetas compartidas + gestión mental, en un solo lugar.                              |

---

## Para quién es Associated

<details>
<summary><strong>Por tipo de colectividad</strong></summary>

**Asociación cultural** — Socios, actividades, tesorería e informes para subvenciones en una plataforma pensada para asociaciones con mucha vocación y poco presupuesto.

**Peña festera** — Socios, cobros, comidas populares y turnos de barra en un solo sitio. Para que la junta dedique su energía a las fiestas, no a perseguir recibos.

**Club deportivo** — Socios, licencias, cuotas y calendario deportivo integrados. Control real de tu club sin necesitar un administrativo a jornada completa.

**Cofradía** — Gestiona hermanos, cuotas, papeletas de sitio y cuadrillas con una herramienta que entiende cómo funciona tu hermandad, sin adaptar tu tradición al software.

</details>

<details>
<summary><strong>Por rol en la junta directiva</strong></summary>

**Tesorero** — Las cuotas se cobran solas. Las remesas SEPA se generan en tres clics. La morosidad se gestiona con un workflow automático. Y cuando llegue la Asamblea, el informe económico está listo.

**Secretario** — Una sola fuente de verdad para todos los socios. Altas, bajas, histórico, carnets y actas en un lugar que no depende de que tú recuerdes en qué carpeta guardaste el archivo.

**Presidente** — Un dashboard que te dice en 30 segundos cómo está tu entidad. Y cuando entregues el cargo al siguiente, toda la información seguirá ahí.

**Socio** — Tu carnet en el móvil, tus cuotas al día, los eventos de tu colectividad a un toque. Sin llamar a nadie para preguntar si estás al corriente de pago.

</details>

---

## Lo que Associated no es

|                                       |                                                                      |
| :------------------------------------ | :------------------------------------------------------------------- |
| No es un ERP corporativo.             | No gestiona nóminas, inventarios ni cadenas de suministro.           |
| No es una red social.                 | No tiene muro, likes ni seguidores.                                  |
| No es crowdfunding.                   | Los cobros son cuotas de socios, no campañas de recaudación.         |
| No es un gestor contable profesional. | No sustituye a un asesor fiscal ni genera declaraciones tributarias. |

---

## Stack tecnológico

| Capa             | Tecnología              | Versión |
| :--------------- | :---------------------- | :-----: |
| Lenguaje         | TypeScript              |   5.9   |
| Backend          | NestJS                  |   11    |
| Frontend         | React                   |   19    |
| UI Kit           | Mantine                 |    8    |
| Build Tool       | Vite                    |    7    |
| Base de datos    | PostgreSQL              |   18    |
| ORM              | Prisma                  |    7    |
| Testing unitario | Vitest                  |    4    |
| Testing E2E      | Playwright              |  1.58   |
| Contenedores     | Docker + Docker Compose |    —    |
| CI/CD            | GitHub Actions          |    —    |
| Observabilidad   | Sentry                  |   10    |

---

## Arquitectura

Monolito modular (ADR-001) organizado en 6 Bounded Contexts según Domain-Driven Design. Cada tenant dispone de una base de datos aislada (ADR-002). La comunicación entre contextos se realiza mediante Domain Events (ADR-008) y el patrón CQRS (ADR-004), aplicando Clean Architecture en cada módulo (ADR-009).

```mermaid
graph TB
    subgraph Associated
        direction TB

        ID["Identity<br/><em>Generic</em>"]
        ME["Membership<br/><em>Core</em>"]
        TR["Treasury<br/><em>Core</em>"]
        EV["Events<br/><em>Core</em>"]
        CO["Communication<br/><em>Supporting</em>"]
        DO["Documents<br/><em>Supporting</em>"]

        ID -- ACL --> ME
        ME -- Pub/Sub --> TR
        ME -- Pub/Sub --> EV
        ME -- Pub/Sub --> CO
        TR -- Pub/Sub --> CO
        EV -- Pub/Sub --> CO
        CO -.-> DO
    end

    style ID fill:#27343E,stroke:#1A2329,color:#fff
    style ME fill:#5B7682,stroke:#3D5E6C,color:#fff
    style TR fill:#5B7682,stroke:#3D5E6C,color:#fff
    style EV fill:#5B7682,stroke:#3D5E6C,color:#fff
    style CO fill:#7A939E,stroke:#708C99,color:#fff
    style DO fill:#7A939E,stroke:#708C99,color:#fff
```

| Bounded Context | Tipo       | Responsabilidad                                 |
| :-------------- | :--------- | :---------------------------------------------- |
| Identity        | Generic    | Autenticación, autorización, gestión de tenants |
| Membership      | Core       | Socios, tipos, estados, antigüedad, histórico   |
| Treasury        | Core       | Cuotas, cobros, remesas SEPA, contabilidad      |
| Events          | Core       | Actividades, inscripciones, asistencia          |
| Communication   | Supporting | Notificaciones, comunicación masiva             |
| Documents       | Supporting | Repositorio documental, actas                   |

---

## Alcance del MVP

El MVP cubre **19 de 76 casos de uso** (25%), distribuidos en 3 fases funcionales y 1 fase de infraestructura. El foco está en los contextos Identity, Membership y Treasury: los cimientos que permiten operar una colectividad desde el primer día.

| Fase | Objetivo                              | UCs |
| :--: | :------------------------------------ | :-: |
|  0   | Scaffold e infraestructura            |  —  |
|  1   | Cimientos y operativa diaria mínima   | 12  |
|  2   | Gestión económica avanzada y SEPA     |  5  |
|  3   | Dashboard, analítica y administración |  2  |

```mermaid
graph LR
    subgraph MVP["Dentro del MVP"]
        direction TB
        A["Identity"]
        B["Membership"]
        C["Treasury"]
        D["Transversal<br/><em>parcial</em>"]
    end

    subgraph POST["Fuera del MVP"]
        direction TB
        E["Events"]
        F["Communication"]
        G["Documents"]
    end

    MVP ~~~ POST

    style A fill:#5B7682,stroke:#3D5E6C,color:#fff
    style B fill:#5B7682,stroke:#3D5E6C,color:#fff
    style C fill:#5B7682,stroke:#3D5E6C,color:#fff
    style D fill:#5B7682,stroke:#3D5E6C,color:#fff
    style E fill:#8CA1AA,stroke:#7A939E,color:#fff
    style F fill:#8CA1AA,stroke:#7A939E,color:#fff
    style G fill:#8CA1AA,stroke:#7A939E,color:#fff
```

> [!IMPORTANT]
> La cadena de dependencias del dominio justifica el alcance: sin socios no hay cuotas, sin cuotas no hay tesorería, sin tesorería no hay gestión real. Los contextos fuera del MVP (Events, Communication, Documents) se construirán sobre estos cimientos.

---

## Estructura del proyecto

```
Associated/
├── api/                    # Backend — NestJS
│   └── src/{bc}/           # Un módulo por Bounded Context
├── web/                    # Frontend — React + Vite
│   └── src/features/       # Módulos por funcionalidad
├── e2e/                    # Tests E2E — Playwright
├── spec/                   # Especificación completa del proyecto
├── doc/                    # Documentación complementaria
├── docker-compose.yml      # Entorno de desarrollo
└── package.json            # Workspaces: api + web
```

---

## Especificación

La especificación de Associated es uno de sus elementos diferenciadores. No por extensión, sino por **trazabilidad**: cada requisito de negocio se puede seguir hasta su caso de uso, su historia de usuario y su decisión arquitectónica.

| Dimensión                        |   Cifra |
| :------------------------------- | ------: |
| Requisitos funcionales           |     221 |
| Requisitos no funcionales        |      66 |
| User Stories (MoSCoW)            |     202 |
| Casos de uso                     |      76 |
| Decisiones arquitectónicas (ADR) |      12 |
| Bounded Contexts                 |       6 |
| Líneas de especificación         | ~32.600 |
| Referencias cruzadas             |  ~1.800 |

```mermaid
graph TD
    RF["RF<br/><em>Qué necesita el negocio</em>"] --> RNF["RNF<br/><em>Restricciones de calidad</em>"]
    RNF --> RNFT["RNFT<br/><em>Concreción técnica</em>"]
    RNFT --> ADR["ADR<br/><em>Decisiones arquitectónicas</em>"]
    RF --> BC["BC<br/><em>Modelo de dominio</em>"]
    BC --> US["US<br/><em>Historias de usuario</em>"]
    US --> UC["UC<br/><em>Casos de uso</em>"]

    style RF fill:#5B7682,stroke:#3D5E6C,color:#fff
    style RNF fill:#3D5E6C,stroke:#27343E,color:#fff
    style RNFT fill:#3D5E6C,stroke:#27343E,color:#fff
    style ADR fill:#27343E,stroke:#1A2329,color:#fff
    style BC fill:#5B7682,stroke:#3D5E6C,color:#fff
    style US fill:#7A939E,stroke:#708C99,color:#fff
    style UC fill:#7A939E,stroke:#708C99,color:#fff
```

---

## Inicio rápido

Para instrucciones de instalación y configuración del entorno de desarrollo, consultar [SETUP.md](SETUP.md).

---

## Decisiones arquitectónicas

| ADR     | Decisión                                           |
| :------ | :------------------------------------------------- |
| ADR-001 | Monolito Modular                                   |
| ADR-002 | Multi-tenant con base de datos separada por tenant |
| ADR-003 | Un módulo NestJS por Bounded Context               |
| ADR-004 | CQRS con @nestjs/cqrs                              |
| ADR-005 | PostgreSQL con Prisma ORM                          |
| ADR-006 | Autenticación JWT + Passport                       |
| ADR-007 | Autorización RBAC con Guards                       |
| ADR-008 | Domain Events para comunicación inter-BC           |
| ADR-009 | Clean Architecture por módulo                      |
| ADR-010 | API RESTful                                        |
| ADR-011 | MinIO (dev) / S3 (prod) para ficheros              |
| ADR-012 | Vitest + Playwright para testing                   |

---

## Licencia

Este proyecto es un Trabajo de Fin de Máster. Todos los derechos reservados.
