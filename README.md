# Pramaan (प्रमाण)
### Secure Digital Document, Evidence & Chain-of-Custody Management Platform
**Women Safety Division • National Crime Records Body (NCRB Prototype)**

---

> [!IMPORTANT]
> **GOVERNMENT INTEGRATION & CRYPTOGRAPHIC DISCLAIMER**
> Pramaan is a functional prototype and MVP demonstrating cryptographic document integrity, simulated permissioned blockchain ledger anchoring, strict server-side RBAC, offline-first mobile field data capture, and charge-sheet workflow enforcement. Real government registries (CCTNS, ICJS, e-Courts), external AI models, and production blockchain networks (e.g. Hyperledger Fabric) are simulated via clean, production-ready abstraction layers with synthetic datasets.

---

## Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │       Pramaan Frontend Surfaces        │
                      │  Expo Web / React Native Mobile Client │
                      │  Port: 8081                            │
                      └──────────────────┬─────────────────────┘
                                         │
                                         ▼  REST / JWT + TOTP MFA
                      ┌────────────────────────────────────────┐
                      │       Fastify TypeScript API Server    │
                      │  Port: 4000 (Swagger: /docs)           │
                      │                                        │
                      │  ├── Auth & RBAC Middleware            │
                      │  ├── Authoritative SHA-256 Hasher      │
                      │  ├── Permissioned Ledger Service       │
                      │  ├── DocumentAIService (OCR Engine)    │
                      │  ├── Universal Audit Logger            │
                      │  └── Charge-Sheet Workflow Engine      │
                      └───────┬────────────────────────┬───────┘
                              │                        │
                              ▼                        ▼
               ┌────────────────────────┐    ┌────────────────────────┐
               │    PostgreSQL (Prisma) │    │      MinIO Object      │
               │    Case Metadata, Logs │    │    S3-Compatible Store │
               │    Port: 5432          │    │    Ports: 9000 / 9001  │
               └────────────────────────┘    └────────────────────────┘
```

---

## Core Security & Architecture Principles

1. **Raw Documents Stay Off-Chain**: The database and ledger store only cryptographic hashes (`SHA-256`), object keys, and immutable metadata. Raw binary files reside exclusively in MinIO S3 object storage.
2. **Server-Side Authoritative Hashing**: The frontend never determines the integrity hash; the backend calculates authoritative SHA-256 on byte streams.
3. **Permissioned Ledger Abstraction**: Cryptographically chained blocks maintain tamper-evident event histories (`previousHash`, `blockHash`, `payloadHash`, `txId`).
4. **Server-Side Workflow Hard Gates**: Premature filing of incomplete charge sheets is blocked by backend HTTP 409 Conflict validation.
5. **Universal Audit Logging (`logAction`)**: Cross-cutting audit service tracks all authentication, case views, uploads, verifications, and judicial actions.
6. **Offline-First Mobile Ingestion**: Local SQLite queue with unique `idempotencyKey` prevents duplicate submissions when reconnecting.

---

## Quick Start with Docker (Recommended)

### Prerequisites
- Docker Engine 24+
- Docker Compose v2+
- Node.js 20+ and npm 10+

### 1. Launch Complete Environment
Clone the repository and run:
```bash
docker compose up --build
```
This automatically boots:
- `pramaan_postgres`: PostgreSQL 16 database with healthcheck
- `pramaan_minio`: MinIO S3 storage with initialized `evidence`, `documents`, and `exports` buckets
- `pramaan_api`: Fastify API server with Prisma migrations, automated seeding, and health probes
- `pramaan_frontend`: Expo Web client on port 8081

### 2. Access the Application
- **Web / Mobile Interface**: [http://localhost:8081](http://localhost:8081)
- **API Server**: [http://localhost:4000](http://localhost:4000)
- **Interactive OpenAPI Documentation**: [http://localhost:4000/docs](http://localhost:4000/docs)
- **MinIO Object Store Console**: [http://localhost:9001](http://localhost:9001) (`minioadmin` / `minioadmin`)

### 3. Stop Environment
```bash
docker compose down
```

### 4. Reset Demo Data
```bash
docker compose down -v && docker compose up --build
```

---

## Demo Accounts & Role Presets

All seeded demo accounts use the standard password: `DemoPass123!` and TOTP bypass code `123456` (or live TOTP from secret `JBSWY3DPEHPK3PXP`).

| Role | Demo Email | Badge Number | Permissions |
| :--- | :--- | :--- | :--- |
| **Investigation Officer (IO)** | `io@example.gov` | `TN-IO-4892` | Assigned case management, evidence upload, OCR confirmation, charge sheet filing |
| **Women Help Desk Officer (WHDO)** | `helpdesk@example.gov` | `TN-WHD-1044` | Field camera capture, offline SQLite queueing, spot statement deposition |
| **Public Prosecutor** | `prosecutor@example.gov` | `TN-PP-0381` | Filed case scrutiny, charge-sheet prerequisite validation, evidence verification |
| **Hon. Magistrate / Judge** | `judge@example.gov` | `TN-JUD-0012` | Read-only judicial scrutiny, tamper verification seal (mutation blocked) |
| **NCRB Statistical Analyst** | `analyst@example.gov` | `NCRB-STAT-992` | De-identified aggregate dashboards; individual cases require elevated access |

---

## Live Demonstration Scenarios

### Demo 1 — Evidence Ingestion & OCR Extraction
1. Log in as **Investigation Officer** (`io@example.gov`).
2. Open Case `TN-2026-001245`.
3. Ingest an evidence document. Notice automated SHA-256 calculation, MinIO storage, and OCR extraction of statutory sections (e.g. `BNS 64`, `BNS 70`).

### Demo 2 — Cryptographic Tamper Verification
1. Navigate to any document and click **Verify Integrity (Ledger)**.
2. View the **Digital Integrity Seal** confirming that the active object hash matches the immutable ledger block proof.
3. Click **Simulate Tampered Document**. Observe immediate real-time transition to **INTEGRITY MISMATCH DETECTED (ALERT RUST)**.

### Demo 3 — Server-Enforced Charge Sheet Workflow
1. Navigate to **Charge Sheet Workflow** for Case `TN-2026-001245`.
2. Notice the missing requirement: `Supervisory ACP Endorsement`.
3. Click **Attempt Filing**. The backend immediately rejects the request with **HTTP 409 Conflict (Workflow Incomplete)**.
4. Click **Apply Digital Endorsement** to satisfy the prerequisite. The status unlocks to **READY TO FILE**.
5. Submit the charge sheet: Case transitions to `FILED` with an immutable ledger transaction anchor.

### Demo 4 — Offline-First Mobile Capture & Sync
1. Open the **Field App** ([http://localhost:8081/(mobile)/home](http://localhost:8081/(mobile)/home)).
2. Toggle network mode to **OFFLINE**.
3. Complete the 3-step capture flow: **Camera Viewfinder** → **OCR Review** → **Digital Signature**.
4. Observe that the record is persisted in the local SQLite queue (`QUEUED`).
5. Reconnect network mode to **ONLINE** and click **Sync All**. The record seamlessly uploads and anchors with zero duplicates.

### Demo 5 — NCRB Analytics & Privacy Preservation
1. Switch active role to **NCRB Analyst** (`analyst@example.gov`).
2. Open **NCRB Analytics**: Review national conviction rates, state-by-state breakdowns, and monthly disposal trends.
3. Attempt to inspect individual case files: Observe access block requiring a statutory **Elevated Access Request**.

---

## Local Host Development Commands

If running outside Docker:
```bash
# Install all dependencies across monorepo
npm install

# Run backend Fastify API
npm run dev:api

# Run Expo / React Native web client
npm run dev:web

# Run automated tests
npm test

# Run strict TypeScript check across all packages
npm run typecheck

# Database migrations & seed
npm run db:migrate
npm run db:seed
```

---

## Monorepo Directory Structure

```
pramaan/
├── apps/
│   └── mobile-web/             # Expo React Native multi-surface app (Web + Mobile)
│       ├── app/                # Expo Router file-based routes
│       ├── services/           # Typed API client, SQLite offline queue, secure storage
│       └── stores/             # Zustand stores for auth & sync
│
├── api/                        # Fastify TypeScript backend service
│   ├── prisma/                 # PostgreSQL schema and comprehensive synthetic seed
│   ├── src/
│   │   ├── modules/            # Auth, Cases, Documents, Custody, Workflow, Audit, Search, Analytics, Access, Sync
│   │   ├── plugins/            # JWT authentication, RBAC guards
│   │   └── services/           # MinIO S3 storage, Ledger, DocumentAIService, Audit, Malware scanner
│   └── tests/                  # Automated Vitest test suites
│
├── packages/
│   ├── shared-types/           # Shared Zod schemas, TypeScript types & DTOs
│   └── ui/                     # Design system tokens and digital register UI components
│
├── docker-compose.yml          # Development container orchestration
├── docker-compose.prod.yml     # Production-style configuration
└── README.md
```
