# Role Specification: Investigation Officer (IO)

**Cadre**: Investigation & Enforcement Directorate  
**Platform**: Pramaan Digital Evidence & Chain-of-Custody Ledger  
**Standard Demo Persona**: Inspector Rajesh Varma (`TN-IO-4892`)  
**Department**: Women Safety Division, Crime Branch  
**Primary Surface**: Web Portal & Mobile Responsive Desktop View  

---

## 1. Role Overview & Statutory Mandate

The **Investigation Officer (IO)** is the principal operational investigator responsible for the initiation, evidentiary compilation, statutory compliance, and court submission of criminal cases under the **Bharatiya Nyaya Sanhita (BNS), 2023** and **Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023**.

The IO possesses end-to-end operational authority to register new FIR records, ingest and classify digital and physical exhibits, execute on-scene forensic verifications, manage the tamper-evident chain of custody, fulfill mandatory pre-filing workflow prerequisites, and formally file charge sheets with the court.

---

## 2. Authentication & Credential Profile

| Attribute | Specification |
| :--- | :--- |
| **Official Email** | `io@example.gov` |
| **Cadre Badge ID** | `TN-IO-4892` |
| **Statutory Password** | `DemoPass123!` |
| **Multi-Factor Auth (MFA)** | Time-Based One-Time Password (TOTP) SHA-1 (Base32 secret: `JBSWY3DPEHPK3PXP`, Demo bypass: `123456`) |
| **Rapid Evaluation Access** | Available on login page via `PROVISION TOKENS →` (issued cryptographically signed JWT with role `INVESTIGATION_OFFICER`) |
| **Jurisdiction Scope** | Assigned Police Station / District (Default: `Chennai Central`) |

---

## 3. Accessible Surfaces & Navigation Matrix

The Investigation Officer has access to the full operational registry suite:

```
Pramaan Navigation (IO Cadre)
├── [DASH]  Dashboard             (/(web)/dashboard)
├── [CASES] Case Register         (/(web)/cases)
│   ├── Case Dossier & Exhibits   (/(web)/cases/:id)
│   └── Workflow & Charge Sheet   (/(web)/workflows/:caseId/charge-sheet)
├── [SEARCH] Intelligence Search   (/(web)/search)
├── [AUDIT] Global Audit Trail    (/(web)/audit)
├── [STATS] NCRB Analytics        (/(web)/analytics)
├── [ACCESS] Access Clearances    (/(web)/access-requests)
└── [PROFILE] Officer Profile     (/(web)/profile)
```

---

## 4. Comprehensive Feature & Action Catalog

### 4.1 Dashboard (`/(web)/dashboard`)
- **Cadre Status Tag**: Displays `INVESTIGATION OFFICER` in the official header banner.
- **Live Key Telemetry Metrics**:
  - `ACTIVE CASES`: Total count of active investigations under officer's jurisdiction.
  - `EVIDENCE ANCHORED`: Total documents and physical exhibits anchored to the SHA-256 ledger.
  - `CHARGE SHEET RATE`: Percentage of cases successfully filed within statutory time limits (Sec. 193 BNSS).
  - `TAMPER ALERTS`: Real-time cryptographic integrity mismatches flagged across all custody records.
- **Quick Action Triggers**:
  - `[Register New Case]`: Launches immediate case registration modal.
  - `[Search Evidence]`: Navigates to full-text RAG-grounded intelligence search.
  - `[Workflows]`: Direct jump to charge-sheet readiness checklists.
- **Recent Cases Ledger**:
  - Quick-access register rows showing case number, title, jurisdiction, status variant, document count (`DOCS`), custody transfers (`CHAIN`), and filing date.

---

### 4.2 Case Registration & Management (`/(web)/cases`)
The IO is the only cadre authorized to initiate and formally register cases into the ledger:

- **Filter & Search Bar**: Real-time filtering by case registration number (`TN-2026-XXXX`), title, or station.
- **Case Ingestion Mode 1: Document Upload (FIR Auto-Ingest)**:
  - Drag-and-drop or select PDF, JPG, PNG FIR documents.
  - Authoritative server-side byte-stream SHA-256 hash generation.
  - Automated OCR pipeline detects statutory sections (e.g. `BNS 64`, `BNS 70`) and populates case parameters.
  - Automatic MinIO S3 upload to `documents` bucket.
- **Case Ingestion Mode 2: Manual Statutory Entry**:
  - `CASE NUMBER`: Auto-generated statutory identifier (e.g. `TN-2026-4892`).
  - `CASE TITLE`: Formal title (e.g. *State vs. Accused Name*).
  - `SYNOPSIS / DESCRIPTION`: Detailed statement of the complaint or incident.
  - `JURISDICTION & POLICE STATION`: Assigned operational zone.
  - `STATUTORY SECTIONS`: Comma-delimited list of applicable BNS/BNSS codes.
  - `INCIDENT LOCATION`: Landmark, street address, or spot description.
  - `PRIORITY LEVEL`: `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL_URGENT`.
  - `SENSITIVITY LEVEL`: `PUBLIC`, `INTERNAL`, `SENSITIVE`, or `HIGHLY_SENSITIVE`.

---

### 4.3 Case Dossier & Exhibit Ingestion (`/(web)/cases/:id`)
Within any individual case dossier, the IO has comprehensive write and update permissions:

#### A. Exhibit Ingestion (`+ INGEST`)
- Ingest physical, photographic, digital, and documentary exhibits:
  - `FIR`: First Information Report
  - `WITNESS_STATEMENT`: Section 180 BNSS witness deposition
  - `VICTIM_STATEMENT`: Recorded victim statement
  - `FORENSIC_REPORT`: Cyber / FSL forensic lab certificate
  - `SEIZURE_MEMO`: On-scene recovery memo
  - `PHOTOGRAPHIC_EVIDENCE`: Crime scene photography
- Automated client-side preview, file size calculation, and server-side cryptographic anchoring.

#### B. Exhibit Scrutiny & Hash Inspection
- Toggle SHA-256 digital fingerprint visibility (`SHOW HASH` / `HIDE HASH`).
- View OCR-detected BNS sections tagged directly on the exhibit card.
- Inspect original uploader metadata, timestamp, and MIME classification.
- **Integrity Seal Verification (`VERIFY`)**: Routes to the digital seal inspection screen (`/(web)/documents/:id/verify`) verifying active file bytes against the permissioned blockchain ledger block.

#### C. Chain-of-Custody Timeline (`CUSTODY` Tab)
- Real-time audit history of every interaction with exhibits:
  - `UPLOADED`: Byte-stream received and hashed.
  - `MALWARE_SCANNED`: Confirmed clean by security daemon.
  - `OCR_PROCESSED`: Extracted full text and statutory entity analysis.
  - `SIGNED`: Digitally signed by officer or witness.
  - `VERIFIED`: Cryptographic integrity test executed.
  - `FILED`: Locked into final court bundle.

#### D. Cross-Case Intelligence Links (`LINKS` Tab)
- View correlation alerts (`[INTEL] X cross-case intelligence links detected`).
- Inspect AI-detected links matching suspect identity, phone numbers, vehicle numbers, or geographic recurrence across cases.

---

### 4.4 Charge Sheet Workflow & Statutory Filing (`/(web)/workflows/:caseId/charge-sheet`)
The IO is responsible for compiling the charge sheet under Section 193 BNSS:

- **Mandatory Workflow Hard Gates**:
  - `Forensic Science Laboratory (FSL) Report`: Must be uploaded, verified, and anchored.
  - `Witness Statement (Sec. 180 BNSS)`: Must be signed and certified.
  - `Digital Evidence Integrity Verification`: All exhibit hashes must match ledger proofs.
  - `Supervisory ACP / DSP Endorsement`: Formal supervisory officer sign-off.
- **Pre-Filing Enforcement**:
  - Attempting to submit a charge sheet with unsatisfied requirements triggers a server-side **HTTP 409 Conflict** blocking filing.
- **Applying Digital Endorsement**:
  - IO applies official officer endorsement directly on the workflow checklist.
  - Once all checklist gates turn green, the status transitions to `READY TO FILE`.
- **Statutory Court Submission**:
  - IO clicks `FILE CHARGE SHEET IN COURT`.
  - The case status transitions immutably to `FILED`.
  - A permanent transaction block (`CHARGE_SHEET_FILING`) is written to the permissioned ledger.

---

### 4.5 Intelligence Search & Discovery (`/(web)/search`)
- Natural-language keyword and boolean statutory queries.
- **Strict RAG Investigative Advisory**:
  - Uses local Qwen 2.5 7B LLM and Nomic-Embed-Text vector embeddings.
  - Generates grounded synthesis strictly citing verified exhibit numbers and SHA-256 hashes.
  - Detects recurring patterns and modus operandi across police jurisdictions.

---

### 4.6 Global Audit Trail (`/(web)/audit`)
- Read access to system-wide audit records.
- Verification that all evidentiary actions comply with **Bharatiya Sakshya Adhiniyam, 2023 (BSA Section 63/65B)** electronic records admissibility.

---

## 5. Server-Side RBAC & Security Restrictions

| Operation | HTTP Route | Access Status | Security Constraint |
| :--- | :--- | :--- | :--- |
| **Case Registration** | `POST /cases` | **PERMITTED** | Allowed for `INVESTIGATION_OFFICER` role |
| **Case Detail Inspection** | `GET /cases/:id` | **PERMITTED** | Must match jurisdiction or be assigned |
| **Evidence Ingestion** | `POST /cases/:id/documents` | **PERMITTED** | Case must be under investigation |
| **Workflow Satisfaction** | `POST /workflow/:caseId/satisfy`| **PERMITTED** | Case must be under investigation |
| **Workflow Endorsement** | `POST /workflow/:caseId/endorse`| **PERMITTED** | Requires valid officer authentication |
| **Charge Sheet Filing** | `POST /workflow/:caseId/file` | **PERMITTED** | Blocked with HTTP 409 if checklist incomplete |
| **Direct Mutation of Filed Case** | `PUT /cases/:id` | **BLOCKED** | Once `FILED`, case is cryptographically sealed |
| **Tamper Verification** | `GET /documents/:id/verify` | **PERMITTED** | Open to all authenticated cadres |
