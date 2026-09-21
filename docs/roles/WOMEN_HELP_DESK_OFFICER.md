# Role Specification: Women Help Desk Officer (WHDO)

**Cadre**: Field Response & Women Safety Help Desk Directorate  
**Platform**: Pramaan Digital Evidence & Chain-of-Custody Ledger  
**Standard Demo Persona**: Sub-Inspector Ananya Swaminathan (`TN-WHD-1044`)  
**Department**: Women Help Desk, T. Nagar Police Station  
**Primary Surface**: Mobile Field Surface (`/(mobile)/home`) & Responsive Web Portal  

---

## 1. Role Overview & Statutory Mandate

The **Women Help Desk Officer (WHDO)** serves as the primary frontline emergency responder and on-scene evidence capture authority for incidents involving women, children, and vulnerable complainants under the **Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023** and special statutes (POCSO, DV Act, Dowry Prohibition).

The WHDO is equipped with an **offline-first, tamper-evident mobile capture surface** designed for immediate spot evidence collection, spot witness statement recording (Sec. 180 BNSS), seizure memo generation, and digital signature notarization—operating reliably even in zero-bandwidth environments.

---

## 2. Authentication & Credential Profile

| Attribute | Specification |
| :--- | :--- |
| **Official Email** | `helpdesk@example.gov` |
| **Cadre Badge ID** | `TN-WHD-1044` |
| **Statutory Password** | `DemoPass123!` |
| **Multi-Factor Auth (MFA)** | TOTP SHA-1 (Base32 secret: `JBSWY3DPEHPK3PXP`, Demo bypass: `123456`) |
| **Rapid Evaluation Access** | Available on login page via `PROVISION TOKENS →` (automatically routes to `/(mobile)/home`) |
| **Jurisdiction Scope** | Assigned Police Station / Field Precinct (Default: `Chennai South`) |

---

## 3. Accessible Surfaces & Mobile Navigation Architecture

The WHDO is optimized for field mobility with a responsive offline-capable interface:

```
Pramaan Mobile Field Surface (WHDO Cadre)
├── Field Home               (/(mobile)/home)
├── 3-Step Ingestion Pipeline
│   ├── 1. Frame Capture      (/(mobile)/new-record/capture)
│   ├── 2. Metadata Review    (/(mobile)/new-record/review)
│   └── 3. Digital Signature  (/(mobile)/new-record/sign)
├── Offline Sync Center      (/(mobile)/sync)
├── Active Precinct Cases    (/(mobile)/cases)
├── Officer Field Profile    (/(mobile)/profile)
└── Switch to Desktop View   (/(web)/dashboard)
```

---

## 4. Comprehensive Feature & Action Catalog

### 4.1 Field Home Dashboard (`/(mobile)/home`)
- **Officer Identity Banner**:
  - Displays officer name, cadre badge ID (`TN-WHD-1044`), and jurisdiction (`Chennai South`).
  - Active connectivity pulse: `ONLINE` (green dot) or `OFFLINE` (amber dot).
- **Primary Operational Call-to-Action**:
  - `[RECORD] CAPTURE EVIDENCE →`: Launches the full-screen 3-step field acquisition pipeline.
  - Subtitle guidance: *Photo • Witness statement • Seizure memo*.
- **Live Device Telemetry Cards**:
  - `DEVICE STATUS`: Real-time network monitor (`ONLINE` / `OFFLINE`).
  - `QUEUE COUNTER`: Count of unanchored records held in local SQLite device storage.
  - `SYNC ALERT TRIGGER`: Direct button (`SYNC N →`) displayed when unsynced field records are pending.
- **Recent Field Intake Register**:
  - Summarizes last recorded on-scene exhibits, linked FIR identifiers, and synchronization timestamps.

---

### 4.2 Guided 3-Step Field Ingestion Pipeline

#### Step 1: Optical & Sensor Capture (`/(mobile)/new-record/capture`)
- **Simulated & Native Camera Viewfinder**:
  - Framing corner brackets and reticle crosshair (`⊕`) for alignment.
  - On-screen operational guide: `ALIGN EXHIBIT IN FRAME`.
- **Integrated Hardware Sensors**:
  - **GPS Geolocation Lock**: Automatically binds live latitude/longitude (e.g. `GPS: 13.0418°N 80.2341°E`) into the exhibit header.
  - **Timestamp Seal**: ISO-8601 UTC timestamp locked on shutter release.
- **Evidence Type Selectors**:
  - `[PHOTO] PHOTO EXHIBIT`: Physical crime scene, damaged property, recovered electronic device, or spot injuries.
  - `[STATEMENT] WITNESS STATEMENT`: Spot witness/victim deposition under Section 180 BNSS.
  - `[SEIZURE] SEIZURE MEMO`: On-scene recovery record with seizure numbering and inventory tracking.
- **Shutter Trigger**: Instant tactile capture with animated processing state (`PROCESSING...`).

#### Step 2: On-Scene Metadata Scrutiny (`/(mobile)/new-record/review`)
- **High-Fidelity Preview**: Visual display of the captured exhibit.
- **Automated Metadata Extraction**:
  - Timestamp, GPS coordinates, camera sensor specifications, and initial cryptographic digest preview.
- **Field Data Entry**:
  - `CASE RECORD LINK`: Select existing registered case or tag as *New Spot Intake*.
  - `DEPONENT / WITNESS IDENTITY`: Full name, age, address, and relation to case.
  - `INCIDENT SUMMARY`: Immediate spot notes recorded verbatim at the scene.
  - `PRELIMINARY SECTIONS DETECTED`: Automatic suggestions for applicable protection orders or BNS statutes.

#### Step 3: Non-Repudiation Digital Signature (`/(mobile)/new-record/sign`)
- **Touch / Stylus Signature Pad**:
  - Captures vector signature of the deponent, reporting officer, or seizure witness.
- **Cryptographic Hash Pre-Computation**:
  - Computes raw `SHA-256` digest locally on device before network transmission.
- **Statutory Non-Repudiation Notice**:
  - Displays legal certification under **Section 63 / 65B of Bharatiya Sakshya Adhiniyam, 2023**.
- **Ingestion Execution**:
  - If **ONLINE**: Directly transmits payload to `/sync/record` or `/documents/upload` for immediate ledger block anchoring.
  - If **OFFLINE**: Encrypts and writes record to device SQLite queue with a cryptographically unique `idempotencyKey`.

---

### 4.3 Offline Sync Engine (`/(mobile)/sync`)
Designed specifically for remote scenes or network-congested environments:

- **Local SQLite Persistence**:
  - Zero data loss guarantee: records survive application closure, power cycles, and crashes.
- **Idempotent Queue Management**:
  - Every pending record carries a UUIDv4 `idempotencyKey`.
  - Multiple sync attempts cannot result in duplicate records or split ledger transactions.
- **Batch Synchronization (`SYNC ALL TO LEDGER`)**:
  - Iterates through queue, uploading binary files to MinIO storage and committing metadata to PostgreSQL.
  - Generates immutable Ledger Block references (`blockHash`, `txId`) upon server acknowledgment.
  - Clears local queue upon cryptographic verification from the server.

---

### 4.4 Precinct Case Scrutiny (`/(mobile)/cases`)
- Mobile-optimized card layout of precinct cases.
- View assigned cases, check investigation status, and review historical spot depositions.

---

## 5. Server-Side RBAC & Security Restrictions

| Operation | HTTP Route | Access Status | Security Constraint |
| :--- | :--- | :--- | :--- |
| **Field Ingestion Batch** | `POST /sync/batch` | **PERMITTED** | Allowed for `WOMEN_HELP_DESK_OFFICER` |
| **Individual Record Sync** | `POST /sync/record` | **PERMITTED** | Validates `idempotencyKey` |
| **Document Upload** | `POST /documents/upload` | **PERMITTED** | Bound to assigned jurisdiction |
| **View Assigned Cases** | `GET /cases` | **PERMITTED** | Filtered by precinct / station |
| **Formal Court Filing** | `POST /workflow/:caseId/file` | **RESTRICTED** | Charge sheet filing is reserved for IO |
| **Tamper Verification** | `GET /documents/:id/verify` | **PERMITTED** | Open for field authenticity checks |
