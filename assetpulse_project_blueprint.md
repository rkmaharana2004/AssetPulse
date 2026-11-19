# AssetPulse — Equipment Maintenance & Stock Tracker

An ERP-style asset operations platform built with **Java 8+, Spring Boot, Spring MVC, Spring Security (JWT), MongoDB**, and a **React + TypeScript** frontend. Tracks industrial/lab equipment health, spare-part stock levels, preventative & breakdown maintenance tickets, and equipment downtime metrics.

---

## 1. Repository & Monorepo Structure

```text
AssetPulse/
├── README.md
├── docker-compose.yml              # Local MongoDB container setup
├── backend/                        # Spring Boot REST API
│   ├── pom.xml
│   └── src/
│       ├── main/java/com/rkmaharana/assetpulse/
│       │   ├── AssetPulseApplication.java
│       │   ├── config/
│       │   │   ├── CorsConfig.java
│       │   │   └── SecurityConfig.java
│       │   ├── security/
│       │   │   ├── JwtService.java
│       │   │   └── JwtAuthenticationFilter.java
│       │   ├── model/
│       │   │   ├── User.java
│       │   │   ├── Asset.java
│       │   │   ├── SparePart.java
│       │   │   ├── MaintenanceTicket.java
│       │   │   └── PartUsage.java
│       │   ├── dto/
│       │   │   ├── AssetRequest.java
│       │   │   ├── SparePartRequest.java
│       │   │   ├── TicketCreateRequest.java
│       │   │   ├── TicketCloseRequest.java
│       │   │   ├── DowntimeSummaryDTO.java
│       │   │   └── ApiErrorResponse.java
│       │   ├── repository/
│       │   │   ├── UserRepository.java
│       │   │   ├── AssetRepository.java
│       │   │   ├── SparePartRepository.java
│       │   │   └── MaintenanceTicketRepository.java
│       │   ├── service/
│       │   │   ├── AssetService.java
│       │   │   ├── SparePartService.java
│       │   │   └── MaintenanceService.java
│       │   ├── controller/
│       │   │   ├── AuthController.java
│       │   │   ├── AssetController.java
│       │   │   ├── SparePartController.java
│       │   │   └── MaintenanceController.java
│       │   └── exception/
│       │       ├── GlobalExceptionHandler.java
│       │       ├── InsufficientStockException.java
│       │       └── ResourceNotFoundException.java
│       ├── main/resources/
│       │   └── application.yml
│       └── test/java/com/rkmaharana/assetpulse/
│           └── service/
│               └── MaintenanceServiceTest.java
└── frontend/                       # React + TypeScript (Vite)
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── api/
        │   └── apiClient.ts
        ├── types/
        │   └── asset.types.ts
        ├── context/
        │   └── AuthContext.tsx
        ├── components/
        │   ├── Layout.tsx
        │   ├── LowStockAlert.tsx
        │   └── PriorityBadge.tsx
        └── pages/
            ├── LoginPage.tsx
            ├── OverviewPage.tsx
            ├── AssetsPage.tsx
            ├── SparePartsPage.tsx
            └── TicketsPage.tsx
```

---

## 2. Core Domain Rules (Interview Highlights)

1. **Atomic Spare-Part Stock Deduction:** When closing a maintenance ticket with a list of consumed `PartUsage` items, `MaintenanceService` validates that every requested spare part has `stockQuantity >= quantityUsed`. If insufficient, it throws `InsufficientStockException` (HTTP `409 Conflict`) before deducting inventory.
2. **Automatic Asset Status Synchronization:**
   - Opening a `BREAKDOWN` ticket automatically transitions the linked asset's status from `OPERATIONAL` to `UNDER_MAINTENANCE`.
   - Closing the ticket restores the asset status to `OPERATIONAL` and updates `lastServicedDate`.
3. **Downtime Aggregation Pipeline:** Uses `MongoTemplate` / `@Aggregation` to group closed maintenance tickets by `assetId` and calculate total downtime hours, breakdown frequency, and spare-part cost per asset.
4. **Low-Stock Threshold Detection:** Exposes a dedicated endpoint (`/api/v1/parts/low-stock`) using Java 8 Streams / MongoDB `$expr` comparison (`stockQuantity <= reorderLevel`) to highlight parts needing restock on the React dashboard.

---

## 3. MongoDB Document Schemas

### `assets` Collection
```json
{
  "_id": "673f20b1a1b2c3d4e5000001",
  "assetCode": "CNC-MILL-02",
  "name": "5-Axis CNC Milling Machine",
  "department": "Precision Machining",
  "manufacturer": "Haas Automation",
  "status": "OPERATIONAL",
  "serviceIntervalDays": 90,
  "lastServicedDate": "2026-10-10",
  "nextServiceDueDate": "2027-01-08",
  "createdAt": "2026-08-01T09:00:00Z"
}
```

### `spare_parts` Collection
```json
{
  "_id": "673f20b1a1b2c3d4e5000020",
  "partNumber": "BRG-7208-AC",
  "name": "Angular Contact Spindle Bearing",
  "stockQuantity": 14,
  "reorderLevel": 5,
  "unitCost": 3450.00,
  "locationBin": "RACK-B2"
}
```

### `maintenance_tickets` Collection
```json
{
  "_id": "673f20b1a1b2c3d4e5000055",
  "ticketCode": "MNT-2026-031",
  "assetId": "673f20b1a1b2c3d4e5000001",
  "assetCode": "CNC-MILL-02",
  "type": "BREAKDOWN",
  "priority": "HIGH",
  "status": "CLOSED",
  "issueDescription": "Spindle vibration exceeding threshold during high-RPM pass",
  "resolutionNotes": "Replaced front spindle bearing assembly and re-aligned",
  "downtimeMinutes": 185,
  "partsUsed": [
    {
      "partId": "673f20b1a1b2c3d4e5000020",
      "partNumber": "BRG-7208-AC",
      "quantityUsed": 2,
      "unitCostAtTime": 3450.00
    }
  ],
  "openedBy": "eng_rupesh",
  "openedAt": "2026-11-18T14:00:00Z",
  "closedAt": "2026-11-18T17:05:00Z"
}
```

---

## 4. REST API Endpoints

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user & issue JWT token |
| `GET` | `/api/v1/assets` | Authenticated | List assets with optional `status` or `department` filter |
| `POST` | `/api/v1/assets` | `ADMIN`, `ENGINEER` | Register new equipment with `@Valid` DTO validation |
| `GET` | `/api/v1/parts` | Authenticated | List spare-part inventory |
| `GET` | `/api/v1/parts/low-stock` | Authenticated | Return parts where `stockQuantity <= reorderLevel` |
| `POST` | `/api/v1/parts` | `ADMIN` | Add new spare part to catalog |
| `PATCH` | `/api/v1/parts/{id}/restock` | `ADMIN`, `ENGINEER` | Increment spare-part stock quantity |
| `GET` | `/api/v1/tickets` | Authenticated | Filter tickets by `status`, `type`, or `assetId` |
| `POST` | `/api/v1/tickets` | Authenticated | Open preventative/breakdown maintenance ticket |
| `PATCH` | `/api/v1/tickets/{id}/close` | `ENGINEER`, `ADMIN` | Close ticket, record downtime, and deduct spare parts |
| `GET` | `/api/v1/tickets/analytics/downtime` | Authenticated | MongoDB aggregation of total downtime & cost per asset |

---

## 5. Step-by-Step Build Checklist

1. **Initialize Backend & MongoDB:** Set up Spring Boot with `spring-boot-starter-data-mongodb`, `spring-boot-starter-validation`, `spring-boot-starter-security`, and `spring-boot-starter-web`. Add compound/unique indexes on `assetCode` and `partNumber`.
2. **DTO Validation & Error Handling:** Annotate request DTOs with `@NotBlank`, `@Min`, and `@Positive`, and handle `MethodArgumentNotValidException` and `InsufficientStockException` cleanly in `GlobalExceptionHandler`.
3. **Service & Aggregation Logic:** Implement `MaintenanceService` (ticket lifecycle + stock deduction) and `MongoTemplate` aggregation for `DowntimeSummaryDTO`.
4. **Unit Testing:** Write JUnit 5 + Mockito tests in `MaintenanceServiceTest` verifying stock deduction, `InsufficientStockException` rollback behavior, and asset status transitions.
5. **React + TypeScript Dashboard:** Build the Vite + React + TypeScript client with pages for **Overview** (downtime summary cards + low-stock banner), **Assets**, **Spare Parts** (with quick restock modal), and **Maintenance Tickets** (open & close workflow).