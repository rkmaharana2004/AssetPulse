# AssetPulse — Equipment Maintenance & Stock Tracker

[![Java](https://img.shields.io/badge/Java-21%20LTS-orange.svg)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.5-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green.svg)](https://www.mongodb.com/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.x-38bdf8.svg)](https://tailwindcss.com/)

An industrial ERP-grade equipment maintenance operations platform designed to track factory machinery health, manage spare-part stock levels, orchestrate preventative & breakdown maintenance tickets, and aggregate downtime metrics with automated inventory deductions.

---

## Architecture & Directory Layout

```text
AssetPulse/
├── README.md
├── docker-compose.yml              # Local MongoDB 7.0 container setup
├── backend/                        # Spring Boot 3.3.5 (Java 21) REST API
│   ├── pom.xml
│   └── src/
│       ├── main/java/com/rkmaharana/assetpulse/
│       │   ├── AssetPulseApplication.java
│       │   ├── config/             # CorsConfig, SecurityConfig
│       │   ├── security/           # JwtService, JwtAuthenticationFilter
│       │   ├── model/              # User, Asset, SparePart, MaintenanceTicket, PartUsage
│       │   ├── dto/                # Request/Response DTOs & Validation
│       │   ├── repository/         # Spring Data MongoDB Repositories
│       │   ├── service/            # AssetService, SparePartService, MaintenanceService, Seeder
│       │   ├── controller/         # Auth, Asset, SparePart, Maintenance REST Controllers
│       │   └── exception/          # GlobalExceptionHandler, InsufficientStockException
│       ├── main/resources/
│       │   └── application.yml
│       └── test/java/com/rkmaharana/assetpulse/service/
│           └── MaintenanceServiceTest.java
└── frontend/                       # React 18 + TypeScript + Vite + Tailwind CSS
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    └── src/
        ├── api/                    # apiClient.ts (JWT interceptor)
        ├── types/                  # asset.types.ts
        ├── context/                # AuthContext.tsx
        ├── components/             # Layout.tsx, LowStockAlert.tsx, PriorityBadge.tsx
        └── pages/                  # LoginPage, OverviewPage, AssetsPage, SparePartsPage, TicketsPage
```

---

## Core Domain Rules

1. **Atomic Spare-Part Stock Deduction:**
   When closing a maintenance ticket with a list of consumed `PartUsage` items, `MaintenanceService` validates that *every* requested spare part has `stockQuantity >= quantityUsed`. If any part has insufficient stock, it aborts immediately and throws `InsufficientStockException` (HTTP `409 Conflict`), ensuring zero partial mutations across the database.
2. **Automatic Asset Status Synchronization:**
   - Opening a `BREAKDOWN` ticket automatically transitions the linked equipment's status from `OPERATIONAL` to `UNDER_MAINTENANCE`.
   - Closing the ticket restores the asset status to `OPERATIONAL`, sets `lastServicedDate = LocalDate.now()`, and recalculates `nextServiceDueDate = lastServicedDate + serviceIntervalDays`.
3. **MongoDB Downtime Aggregation Pipeline:**
   Executes a native MongoDB pipeline via `MongoTemplate` grouping closed maintenance tickets by `assetId`:
   - Computes total downtime minutes and hours.
   - Computes breakdown frequency count.
   - Evaluates total spare parts cost via `$reduce` and `$multiply` over `partsUsed`.
4. **Low-Stock Threshold Detection:**
   Exposes `/api/v1/parts/low-stock` using MongoDB `$expr: { $lte: [ '$stockQuantity', '$reorderLevel' ] }` to display urgent warning banners on the dashboard.

---

## Seeded Demo Accounts

On initial boot, `DatabaseSeeder` automatically initializes three system accounts with pre-hashed BCrypt passwords:

| Username | Password | Role | Permissions |
| :--- | :--- | :--- | :--- |
| `admin` | `admin123` | `ADMIN` | Full administrative access (create assets, add parts, restock, close tickets) |
| `engineer` | `eng123` | `ENGINEER` | Reliability engineer (register assets, restock parts, open & close tickets) |
| `viewer` | `view123` | `VIEWER` | Plant supervisor (read-only dashboard, asset fleet, and ticket monitoring) |

*The login screen includes 1-click credential switcher buttons for instant role testing.*

---

## REST API Reference

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user & issue signed JWT token |
| `GET` | `/api/v1/auth/me` | Authenticated | Retrieve current session claims and role |
| `GET` | `/api/v1/assets` | Authenticated | List equipment (filter by `department`, `status`) |
| `POST` | `/api/v1/assets` | `ADMIN`, `ENGINEER` | Register new equipment with `@Valid` DTO validation |
| `GET` | `/api/v1/assets/{id}` | Authenticated | Retrieve single equipment specifications |
| `GET` | `/api/v1/parts` | Authenticated | List all catalog spare parts |
| `GET` | `/api/v1/parts/low-stock` | Authenticated | Query parts where `stockQuantity <= reorderLevel` |
| `POST` | `/api/v1/parts` | `ADMIN` | Add new spare part SKU to catalog |
| `PATCH` | `/api/v1/parts/{id}/restock` | `ADMIN`, `ENGINEER` | Increment spare-part stock quantity |
| `GET` | `/api/v1/tickets` | Authenticated | Filter tickets by `status`, `type`, or `assetId` |
| `POST` | `/api/v1/tickets` | Authenticated | Open preventative or breakdown maintenance ticket |
| `PATCH` | `/api/v1/tickets/{id}/close` | `ENGINEER`, `ADMIN` | Close ticket, deduct spare parts, update asset |
| `GET` | `/api/v1/tickets/analytics/downtime` | Authenticated | MongoDB aggregation of total downtime & cost per asset |

---

## Getting Started

### 1. Prerequisites
- **Java 21 LTS**
- **Apache Maven 3.9+**
- **Node.js 20+ & npm**
- **Docker & Docker Compose** (for MongoDB)

### 2. Start MongoDB
```bash
docker compose up -d
```
MongoDB will start on port `27017` with database `assetpulse`.

### 3. Build & Run Backend
```bash
cd backend
mvn clean test        # Run JUnit 5 + Mockito unit tests
mvn spring-boot:run   # Start Spring Boot on port 8080
```

### 4. Build & Run Frontend
```bash
cd frontend
npm install
npm run dev           # Start Vite dev server on http://localhost:5173
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Automated Tests

Run the backend unit test suite:
```bash
cd backend
mvn test
```

Test coverage includes:
- Verification of atomic stock deduction and quantity decrementing.
- Verification of rollback behavior (`InsufficientStockException` on deficit with zero stock alteration).
- Automatic asset status transition from `OPERATIONAL` to `UNDER_MAINTENANCE` on breakdown ticket creation.
- Restoration to `OPERATIONAL` and automatic recalculation of `nextServiceDueDate` on ticket closure.
- Exception handling for duplicate ticket closure and invalid part references.
