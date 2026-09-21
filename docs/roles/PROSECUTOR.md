# Role Specification: Public Prosecutor

**Cadre**: Directorate of Public Prosecutions & State Law Officers  
**Platform**: Pramaan Digital Evidence & Chain-of-Custody Ledger  
**Standard Demo Persona**: Advocate Meera Sundaram (`TN-PP-0381`)  
**Department**: Directorate of Public Prosecutions  
**Primary Surface**: Web Scrutiny Portal (`/(web)/dashboard`)  

---

## 1. Role Overview & Statutory Mandate

The **Public Prosecutor** represents the State in criminal trials and serves as the legal scrutiny authority under the **Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023** and **Bharatiya Sakshya Adhiniyam (BSA), 2023**.

The Prosecutor’s statutory mandate is to independently scrutinize police investigation dossiers and draft charge sheets prior to judicial filing. This involves verifying that:
1. All statutory legal elements of the invoked BNS offences are established with admissible evidence.
2. Digital and forensic records strictly comply with **Section 63 of BSA, 2023** (Conditions in respect of electronic records).
3. The chain of custody from seizure through laboratory analysis remains unbroken, untampered, and verifiable on the blockchain ledger.

---

## 2. Authentication & Credential Profile

| Attribute | Specification |
| :--- | :--- |
| **Official Email** | `prosecutor@example.gov` |
| **Cadre Badge ID** | `TN-PP-0381` |
| **Statutory Password** | `DemoPass123!` |
| **Multi-Factor Auth (MFA)** | TOTP SHA-1 (Base32 secret: `JBSWY3DPEHPK3PXP`, Demo bypass: `123456`) |
| **Rapid Evaluation Access** | Available on login page via `PROVISION TOKENS →` (issued JWT with role `PROSECUTOR`) |
| **Jurisdiction Scope** | Sessions Court Jurisdiction (Default: `City Sessions Court, Chennai`) |

---

## 3. Accessible Surfaces & Navigation Matrix

The Public Prosecutor operates within a specialized legal scrutiny workspace:

```
Pramaan Navigation (Prosecutor Cadre)
├── [DASH]  Prosecutorial Dashboard  (/(web)/dashboard)
├── [CASES] Case Register & Scrutiny (/(web)/cases)
│   ├── Case File & Exhibits        (/(web)/cases/:id)
│   └── Workflow & Prerequisites    (/(web)/workflows/:caseId/charge-sheet)
├── [SEARCH] Intelligence Search    (/(web)/search)
├── [AUDIT] System Audit Trail      (/(web)/audit)
├── [STATS] NCRB Analytics          (/(web)/analytics)
└── [PROFILE] Profile & Credentials (/(web)/profile)
```

---

## 4. Comprehensive Feature & Action Catalog

### 4.1 Dashboard (`/(web)/dashboard`)
- **Cadre Status Tag**: Displays `PROSECUTOR` in the official header banner.
- **Prosecutorial Telemetry Metrics**:
  - `ACTIVE CASES`: Filed or charge-sheet-prepared cases currently pending scrutiny in the sessions jurisdiction.
  - `EVIDENCE ANCHORED`: Total verified digital exhibits anchored across active court dockets.
  - `CHARGE SHEET RATE`: Conversion rate of police investigation files to successful court submissions.
  - `TAMPER ALERTS`: Zero-tolerance alert monitor highlighting any cryptographic verification mismatch across case files.
- **Prosecutorial Quick Actions**:
  - `[Pending Charge Sheets]`: Filters case register to cases with status `CHARGE_SHEET_PREPARED` or `FILED`.
  - `[Verify Document Hashes]`: Direct jump to exhibit verification workspace.
  - `[Audit Trail]`: Direct navigation to immutable custody transfer logs.
- **Recent Cases Ledger**:
  - High-priority view of cases pending trial or formal charge-sheet approval.

---

### 4.2 Legal Dossier Scrutiny (`/(web)/cases/:id`)
The Prosecutor conducts rigorous pre-trial review of the case dossier:

#### A. Document Scrutiny & Section 63 BSA Compliance
- Review each exhibit:
  - **FIR (`FIR`)**: Ensures charges align strictly with facts alleged.
  - **Witness Statements (`WITNESS_STATEMENT`)**: Inspects Section 180 BNSS depositions for admissibility, non-coercion signatures, and corroborating timestamps.
  - **Forensic Laboratory Certificates (`FORENSIC_REPORT`)**: Verifies digital hash matching against the FSL server transmission.
  - **Seizure Memos (`SEIZURE_MEMO`)**: Validates independent witness (pancha) signatures.

#### B. Cryptographic Document Verification (`VERIFY`)
- Clicking `VERIFY` routes to `/(web)/documents/:id/verify`:
  - **Live Byte-Level Recalculation**: Fetches binary from MinIO S3 and recomputes authoritative SHA-256 in real time.
  - **Ledger Block Comparison**: Compares active hash against the immutable ledger transaction block.
  - **Tamper Simulation Mode**: Allows prosecutor to test simulated tampering to verify that any altered file triggers an immediate **INTEGRITY MISMATCH ALERT**.

#### C. Chain-of-Custody Scrutiny (`CUSTODY` Tab)
- Examines every handover of physical and digital items:
  - Officer dispatch timestamp vs. FSL laboratory intake timestamp.
  - Verification that no unauthorized intermediary accessed or exported the files.
  - Actor badge numbers and IP addresses recorded permanently on each step.

---

### 4.3 Charge Sheet Workflow Scrutiny (`/(web)/workflows/:caseId/charge-sheet`)
- **Prerequisite Validation**:
  - Confirms completion of the 4 mandatory statutory gates:
    1. Forensic Science Laboratory (FSL) Report.
    2. Witness Statement under Section 180 BNSS.
    3. Evidence Metadata and SHA-256 verification.
    4. Supervisory ACP / DSP Endorsement.
- **Legal Clearance & Scrutiny Sign-Off**:
  - Prosecutor reviews evidence sufficiency before the case proceeds to the judicial docket.

---

### 4.4 Intelligence Search & Case Precedent Synthesis (`/(web)/search`)
- Searches statutory case records for corroborating forensic patterns, modus operandi, and repeat offenders.
- Utilizes Strict RAG synthesis for legal research grounded solely in verified exhibits.

---

### 4.5 Global Audit Trail Scrutiny (`/(web)/audit`)
- Real-time scrutiny of all platform operations across all users.
- Confirms non-repudiation proofs for court submission under **Section 65B of the Indian Evidence Act / Section 63 of BSA, 2023**.

---

## 5. Server-Side RBAC & Security Restrictions

| Operation | HTTP Route | Access Status | Security Constraint |
| :--- | :--- | :--- | :--- |
| **Inspect Filed / Scrutiny Cases** | `GET /cases/:id` | **PERMITTED** | Allowed if case is filed or assigned |
| **Document Hash Verification** | `GET /documents/:id/verify` | **PERMITTED** | Real-time SHA-256 vs Ledger comparison |
| **Workflow Scrutiny Review** | `GET /workflow/:caseId/status` | **PERMITTED** | Full visibility into pre-filing gates |
| **Inspect Global Audit Log** | `GET /audit` | **PERMITTED** | Unrestricted audit inspection |
| **Create New Initial FIR** | `POST /cases` | **RESTRICTED** | Case registration is reserved for Police IO |
| **Upload Raw Crime Evidence** | `POST /cases/:id/documents` | **RESTRICTED** | Evidence capture is reserved for IO / WHDO |
| **Alter Anchored Evidence** | `PUT /documents/:id` | **BLOCKED** | All exhibits are cryptographically immutable |
