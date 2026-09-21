# Role Specification: NCRB Statistical Analyst

**Cadre**: Crime Records Directorate & Statistical Analytics Division  
**Platform**: Pramaan Digital Evidence & Chain-of-Custody Ledger  
**Standard Demo Persona**: Dr. Siddharth Sen (`NCRB-STAT-992`)  
**Department**: NCRB Crime Research & Statistical Division  
**Primary Surface**: Web Intelligence & Analytics Portal (`/(web)/dashboard`)  

---

## 1. Role Overview & Statutory Mandate

The **NCRB Statistical Analyst** operates under the aegis of the **National Crime Records Directorate (NCRB), Ministry of Home Affairs**. The analyst is responsible for macro-level crime data synthesis, monitoring state-wise charge-sheet disposal performance, evaluating forensic turnaround timelines, identifying cross-jurisdictional crime patterns, and compiling statutory crime disposal reports (e.g. *Crime in India*).

To preserve the fundamental privacy rights of citizens, victims, and witnesses under Indian law (Digital Personal Data Protection Act, 2023), the NCRB Analyst operates under a **strict Privacy-Preserving De-Identification Architecture**. Aggregate data is accessible by default, while inspection of individual case records is restricted behind a statutory **Elevated Access Request** gate.

---

## 2. Authentication & Credential Profile

| Attribute | Specification |
| :--- | :--- |
| **Official Email** | `analyst@example.gov` |
| **Cadre Badge ID** | `NCRB-STAT-992` |
| **Statutory Password** | `DemoPass123!` |
| **Multi-Factor Auth (MFA)** | TOTP SHA-1 (Base32 secret: `JBSWY3DPEHPK3PXP`, Demo bypass: `123456`) |
| **Rapid Evaluation Access** | Available on login page via `PROVISION TOKENS →` (issued JWT with role `NCRB_ANALYST`) |
| **Jurisdiction Scope** | National Directorate (Default: `National Crime Records Directorate, New Delhi`) |

---

## 3. Privacy Preservation & Elevated Access Security Gate

> [!IMPORTANT]
> **STATUTORY ACCESS REQUEST RULE (RBAC PLUGIN)**
> - **Aggregate Data Open**: The analyst has unrestricted access to macro statistics, state disposal matrices, trend curves, and de-identified RAG queries.
> - **Individual Case Details Blocked by Default**: In `server/src/plugins/rbac.plugin.ts`, any attempt by an NCRB Analyst to inspect an individual case dossier (`GET /cases/:id`) without active clearance is rejected with **HTTP 403 Forbidden**:  
>   `"NCRB Analysts are restricted to aggregate statistics. Individual case inspection requires a formal written Access Request and supervisor approval."`
> - **Elevated Access Workflow**:
>   1. The analyst submits a formal request via `/(web)/access-requests` with a written statutory justification (minimum 20 characters) and duration (e.g. 24 hours).
>   2. An authorized supervisory authority reviews and approves the request.
>   3. Once approved, the analyst gains temporary time-bound access to that specific case.
>   4. Every single access event is immutably recorded in the universal audit log under `ELEVATED_CASE_ACCESS_UTILIZED`.

---

## 4. Accessible Surfaces & Navigation Matrix

The Statistical Analyst operates in an intelligence-centric analytics portal:

```
Pramaan Navigation (Analyst Cadre)
├── [DASH]   Analyst Dashboard        (/(web)/dashboard)
├── [STATS]  NCRB National Analytics  (/(web)/analytics)
├── [ACCESS] Case Access Clearances   (/(web)/access-requests)
├── [SEARCH] Intelligence Search & RAG (/(web)/search)
├── [AUDIT]  Global Audit Logs        (/(web)/audit)
└── [PROFILE] Directorate Profile     (/(web)/profile)
```

---

## 5. Comprehensive Feature & Action Catalog

### 5.1 Analyst Dashboard (`/(web)/dashboard`)
- **Cadre Status Tag**: Displays `NCRB ANALYST` in the official header banner.
- **National Overview Telemetry**:
  - `ACTIVE CASES`: Total cases under active investigation across all reporting states.
  - `EVIDENCE ANCHORED`: Total evidence objects currently secured on the national ledger.
  - `CHARGE SHEET RATE`: National aggregate charge sheet filing rate within 60/90-day statutory limits.
  - `TAMPER ALERTS`: Live indicator verifying 0 unhandled tamper alerts across all state police ledgers.
- **Analyst Quick Actions**:
  - `[NCRB Statistics]`: Immediate jump to deep national analytics and state breakdowns.
  - `[Request Case Access]`: Launches modal to submit formal statutory access clearance.
  - `[Intelligence Search]`: Opens multi-jurisdictional AI pattern discovery.

---

### 5.2 National Analytics Dashboard (`/(web)/analytics`)
A comprehensive macro-level disposal intelligence portal:

#### A. Key Metric Counters
- `TOTAL CASES`: National registered case volume.
- `CHARGE SHEET RATE`: Percentage of cases filed vs. registered.
- `AVG DAYS TO FILE`: Average calendar days from FIR registration to formal charge sheet filing.
- `LEDGER BLOCKS`: Total cryptographically sealed blocks anchored in the national chain.

#### B. State-by-State Disposal Table (`STATE BREAKDOWN`)
- Multi-column data grid comparing state police performance:
  - `STATE`: Jurisdiction name (e.g. *Tamil Nadu, Delhi NCT, Maharashtra*).
  - `CASES`: Total registered cases.
  - `ACTIVE`: Cases currently under investigation.
  - `FILED`: Cases with completed charge sheets.
  - `CONVICTION`: Conviction rate percentage (color-coded: green >= 60%, rust < 60%).
  - `AVG DAYS`: Average turnaround timeline to court filing.

#### C. Crime Categorization Analysis (`BY CATEGORY`)
- Breakdown by statutory classification under the Bharatiya Nyaya Sanhita, 2023:
  - Offences against women and children (BNS 64, BNS 70, POCSO).
  - Cyber stalking and electronic harassment.
  - Case volume and charge sheet conversion percentage per category.

#### D. Monthly Disposal Curves (`MONTHLY TRENDS`)
- Multi-month comparative visualization:
  - Reported FIRs vs. Charge-sheeted cases vs. Court Disposals.
  - Enables early detection of investigative backlogs and procedural bottlenecks.

---

### 5.3 Elevated Access Request Management (`/(web)/access-requests`)
The formal privacy clearance workflow:

- **Requests Register**:
  - Displays all submitted access requests with live status badges (`PENDING`, `APPROVED`, `REJECTED`).
  - Cards show target case number, title, requested duration, and expiry timestamp.
- **Request Submission Modal (`+ REQUEST ACCESS`)**:
  - `SELECT CASE`: Dropdown list of cases requiring deep analytical scrutiny.
  - `STATUTORY JUSTIFICATION`: Minimum 20-character mandatory written explanation (e.g. *Investigating cross-district cyber stalking pattern in FIR 402/2026 for NCRB annual report*).
  - Submitting sends a notification to supervisory administrators and logs an `ACCESS_REQUEST_SUBMITTED` audit entry.
- **Supervisory Approval Simulation**:
  - Review actions (`APPROVE` / `REJECT`) available to clear requests for inspection.
  - Approved requests grant temporary clearance, enabling the analyst to open the case dossier.

---

### 5.4 Cross-Case Intelligence Search & RAG Synthesis (`/(web)/search`)
- Natural-language search across multi-jurisdiction police records.
- Strict RAG investigative advisory digest powered by Qwen 2.5 7B & Nomic-Embed-Text:
  - Synthesizes emerging crime patterns and cross-district syndicates while suppressing personal identifying information unless elevated clearance is granted.

---

## 6. Server-Side RBAC & Security Restrictions

| Operation | HTTP Route | Access Status | Security Constraint |
| :--- | :--- | :--- | :--- |
| **Inspect Aggregate Telemetry** | `GET /analytics/overview` | **PERMITTED** | Open to `NCRB_ANALYST` |
| **Submit Access Request** | `POST /access-requests` | **PERMITTED** | Requires written statutory justification |
| **Inspect Approved Case** | `GET /cases/:id` | **CONDITIONAL** | Allowed only with active, unexpired approved request |
| **Inspect Unapproved Case** | `GET /cases/:id` | **BLOCKED (403)** | Rejected with HTTP 403 Forbidden |
| **Cross-Case Intelligence Search**| `POST /search` | **PERMITTED** | Multi-jurisdiction search allowed |
| **Register New FIR** | `POST /cases` | **RESTRICTED** | Analysts cannot register police cases |
| **Upload Evidence Exhibits** | `POST /cases/:id/documents` | **RESTRICTED** | Evidence capture is reserved for IO / WHDO |
| **Modify Case Dossiers** | `PUT /cases/:id` | **BLOCKED** | Analysts possess zero mutation privileges |
