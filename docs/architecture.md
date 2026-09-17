# Arquitectura del Sistema - Plataforma de Promociones Disagro 2026

## 1. Visión General de la Arquitectura

La plataforma está diseñada como un **Monorepo modular** utilizando **pnpm workspaces**, separando claramente las responsabilidades del equipo de Frontend y del equipo de Backend, vinculados por una capa común de contratos tipados (`@ptdisagro/contracts`).

```mermaid
graph TD
    Client["🌐 Navegador Web / Cliente (Desktop / Móvil)"]
    
    subgraph Frontend["Frontend - Next.js 14 (App Router)"]
        PublicFeria["Portal Feria Disagro (/feria)"]
        Backoffice["Panel Administrativo (/ , /registros)"]
        ApiClient["Cliente API Tipado (api.ts)"]
    end

    subgraph Contracts["Paquete Compartido (@ptdisagro/contracts)"]
        ZodSchemas["Esquemas Zod & DTOs"]
        PureDiscounts["Motor Puro de Descuentos"]
        Enums["Enumeraciones & Tipos"]
    end

    subgraph Backend["Backend - NestJS 10 + Fastify Adapter"]
        FastifyLayer["Fastify Engine (Helmet, CORS, Cookies)"]
        GlobalPipes["ValidationPipe + HttpExceptionFilter"]
        
        subgraph Modules["Módulos de Negocio"]
            AuthMod["Auth & Sessions Module"]
            EventsMod["Events Module"]
            CatalogMod["Catalog Module"]
            RegMod["Registrations Module"]
            DiscMod["Discounts Module"]
            AdminMod["Admin & Reports Module"]
            HealthMod["Health / Readiness Module"]
            AuditMod["Audit Module"]
        end
        
        PrismaService["Prisma ORM Client"]
    end

    subgraph Database["Almacenamiento Relacional"]
        Postgres[("PostgreSQL 16 Engine")]
    end

    Client -->|HTTP / HTTPS| PublicFeria
    Client -->|HTTP / HTTPS| Backoffice
    PublicFeria --> ApiClient
    Backoffice --> ApiClient
    ApiClient -->|REST API /api/v1| FastifyLayer

    PublicFeria -.-> Contracts
    Backoffice -.-> Contracts
    Backend -.-> Contracts

    FastifyLayer --> GlobalPipes
    GlobalPipes --> Modules
    Modules --> PrismaService
    PrismaService --> Postgres
```

---

## 2. Diagrama Entidad-Relación (Base de Datos)

```mermaid
erDiagram
    User ||--o{ Session : "inicia"
    User ||--o{ AuditLog : "realiza"
    Event ||--o{ Registration : "contiene"
    Customer ||--o{ Registration : "confirma"
    Registration ||--|{ RegistrationItem : "desglosa"
    CatalogItem ||--o{ RegistrationItem : "referenciado en"

    User {
        string id PK
        string name
        string email UK
        string passwordHash
        enum role
        datetime createdAt
    }

    Session {
        string id PK
        string userId FK
        string tokenHash UK
        datetime expiresAt
        datetime revokedAt
        string ipAddress
        string userAgent
    }

    Event {
        string id PK
        string name
        string description
        string location
        datetime startDate
        datetime endDate
        datetime registrationDeadline
        enum status
    }

    Customer {
        string id PK
        string fullName
        string email
        string phone
        string company
        string jobTitle
        string attendanceDate
        enum preferredContactMethod
    }

    CatalogItem {
        string id PK
        enum type
        string name
        string description
        decimal price
        int priceCents
        string category
        boolean active
    }

    Registration {
        string id PK
        string eventId FK
        string customerId FK
        string confirmationCode UK
        string idempotencyKey UK
        enum status
        decimal serviceSubtotal
        decimal productSubtotal
        int serviceDiscountPercentage
        int productDiscountPercentage
        decimal serviceDiscountAmount
        decimal productDiscountAmount
        decimal totalDiscountAmount
        decimal estimatedTotal
        datetime confirmedAt
    }

    RegistrationItem {
        string id PK
        string registrationId FK
        string catalogItemId FK
        enum itemType
        int quantity
        string nameSnapshot
        decimal unitPriceSnapshot
        decimal lineTotal
    }

    AuditLog {
        string id PK
        string userId FK
        string action
        string entity
        string entityId
        json metadata
        string ipAddress
        datetime createdAt
    }
```

---

## 3. Secuencia de Confirmación y Prevención de Manipulación

El siguiente diagrama ilustra el flujo de cálculo seguro sin confiar en los precios enviados por el navegador:

```mermaid
sequenceDiagram
    autonumber
    
    actor Cliente as 👤 Participante (Browser)
    participant Web as 💻 Frontend (Next.js)
    participant API as ⚙️ Backend API (NestJS + Fastify)
    participant Disc as 🧮 Motor de Descuentos (Pure)
    participant DB as 🗄️ PostgreSQL (Prisma)

    Cliente->>Web: Selecciona Servicios y Productos en el formulario
    Web->>API: POST /api/v1/registrations/preview { items: [{ id, quantity }] }
    API->>DB: SELECT * FROM catalog_items WHERE id IN (...) AND active = true
    DB-->>API: Retorna ítems oficiales y priceCents
    API->>Disc: calculatePromotionalTotals(dbItems)
    Disc-->>API: Desglose financiero (Subtotales, Descuentos %, Ahorro, Total)
    API-->>Web: 200 OK con Desglose en vivo
    Web-->>Cliente: Muestra descuentos en vivo (ej. Servicios: 5%, Productos: 5%)

    Cliente->>Web: Clic en "CONFIRMAR ASISTENCIA"
    Web->>API: POST /api/v1/registrations { eventId, customer, items, idempotencyKey }
    
    critical Transacción Atómica
        API->>DB: Verificar Evento activo y fecha límite vigente
        API->>DB: Verificar Idempotencia previa
        API->>DB: Obtener precios oficiales vigentes de BD
        API->>Disc: Recalcular totales con precios del servidor
        API->>DB: Upsert / Registrar Cliente en BD
        API->>DB: Generar código DISAGRO-2026-XXXXXX
        API->>DB: Insertar Registration con totales calculados
        API->>DB: Insertar RegistrationItems (Snapshots de nombre y precio)
    end

    API-->>Web: 201 Created con Comprobante y Código Único
    Web-->>Cliente: Muestra Voucher con confetti y opción de descarga/impresión
```

---

## 4. Estándares de Seguridad Aplicados

1. **Helmet**: Protección activa de headers HTTP (`X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`).
2. **CORS Dinámico**: Restricción de orígenes cruzados con soporte de credenciales seguras.
3. **Cookies HttpOnly**: La sesión administrativa `disagro_session` no puede ser leída ni manipulada mediante scripts de JavaScript en el cliente, mitigando ataques XSS.
4. **Hashes Criptográficos**: Los tokens de sesión se almacenan hasheados con SHA-256 en la base de datos; las contraseñas se almacenan procesadas con `bcrypt` (10 rounds).
5. **Idempotencia Transaccional**: Si una conexión de red inestable provoca el reenvío de una petición idéntica, el servidor detecta la clave de idempotencia y devuelve la confirmación ya existente sin duplicar reservas ni clientes.
6. **Manejo Centralizado de Excepciones**: Respuestas JSON uniformes (`statusCode`, `code`, `message`, `errors`, `requestId`) sin filtrar stack traces ni credenciales internas.
