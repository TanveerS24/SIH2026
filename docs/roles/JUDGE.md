# Role Specification: Hon. Magistrate / Judge

**Cadre**: Judicial Service & Courtroom Presiding Officers  
**Platform**: Pramaan Digital Evidence & Chain-of-Custody Ledger  
**Standard Demo Persona**: Hon. Justice K. Ramanathan (`TN-JUD-0012`)  
**Department**: Special Fast Track Court for Women & Children  
**Primary Surface**: Judicial Chamber Web Portal (`/(web)/dashboard`)  

---

## 1. Role Overview & Statutory Mandate

The **Hon. Magistrate / Judge** is the presiding judicial officer empowered under the **Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023** and the **Bharatiya Sakshya Adhiniyam (BSA), 2023** to conduct pre-trial scrutiny, frame charges, admit electronic records into evidence, preside over trial hearings, and pronounce judgment.

Within Pramaan, the Judicial role represents the ultimate evidentiary arbiter. The judge inspects filed charge sheets, examines cryptographic integrity proofs, validates electronic record certifications under **Section 63 of BSA, 2023**, and reviews the unbroken custody trail of all digital exhibits.

---

## 2. Authentication & Credential Profile

| Attribute | Specification |
| :--- | :--- |
| **Official Email** | `judge@example.gov` |
| **Cadre Badge ID** | `TN-JUD-0012` |
| **Statutory Password** | `DemoPass123!` |
| **Multi-Factor Auth (MFA)** | TOTP SHA-1 (Base32 secret: `JBSWY3DPEHPK3PXP`, Demo bypass: `123456`) |
| **Rapid Evaluation Access** | Available on login page via `PROVISION TOKENS →` (issued JWT with role `JUDGE`) |
| **Jurisdiction Scope** | Sessions Division / Fast Track Jurisdiction (Default: `Chennai Metropolitan Sessions`) |

---

## 3. Strict Judicial Read-Only Security Architecture

> [!IMPORTANT]
> **SERVER-SIDE READ-ONLY HARD CONSTRAINT**
> In strict adherence to judicial neutrality and evidentiary non-contamination principles, the `JUDGE` role is enforced by the server-side RBAC middleware (`server/src/plugins/rbac.plugin.ts`) as **strictly read-only**:
> - Any attempt to issue `POST`, `PUT`, `PATCH`, or `DELETE` requests against case artifacts or evidence items is immediately intercepted and rejected with **HTTP 403 Forbidden**:
>   `"Judicial officers possess read-only scrutiny access. Case mutations are strictly prohibited."`
> - The universal audit logger records any mutation attempt as `DOCUMENT_REDACTED` / `DENIED` with full network telemetry and IP tracking.

---

## 4. Accessible Surfaces & Navigation Matrix

The Presiding Magistrate operates within a tamper-proof courtroom scrutiny surface:

```
Pramaan Navigation (Judicial Cadre)
├── [DASH]  Judicial Bench Dashboard  (/(web)/dashboard)
├── [CASES] Court Docket & Dossiers    (/(web)/cases)
│   ├── Judicial Dossier Scrutiny     (/(web)/cases/:id)
│   └── Digital Certificate Proofs    (/(web)/documents/:id/verify)
├── [SEARCH] Precedent & Case Search   (/(web)/search)
├── [AUDIT] Courtroom Audit Trail      (/(web)/audit)
├── [STATS] NCRB Judicial Statistics  (/(web)/analytics)
└── [PROFILE] Judicial Bench Profile   (/(web)/profile)
```

---

## 5. Comprehensive Feature & Action Catalog

### 5.1 Bench Dashboard (`/(web)/dashboard`)
- **Cadre Status Tag**: Displays `JUDGE` in the official header banner.
- **Judicial Bench Telemetry**:
  - `ACTIVE CASES`: Total formally filed cases pending before the court.
  - `EVIDENCE ANCHORED`: Cryptographically sealed exhibits admitted to the court register.
  - `CHARGE SHEET RATE`: Judicial disposal percentage within statutory timelines.
  - `TAMPER ALERTS`: Real-time system monitor showing 0 tamper alerts, proving uncorrupted record history.
- **Judicial Quick Actions**:
  - `[Filed Cases]`: Opens the court docket filtered to formally submitted charge sheets.
  - `[Verify Documents]`: Direct access to cryptographic hash verification suite.
  - `[Audit Logs]`: Direct inspection of courtroom and custody chain logs.
- **Recent Cases Register**:
  - List of filed cases awaiting trial scheduling or judicial orders.

---

### 5.2 Judicial Docket & Exhibit Examination (`/(web)/cases/:id`)
The Judge conducts judicial scrutiny of the filed police file:

#### A. Case Dossier Examination
- Review formal FIR details, statutory sections invoked, and accused/victim profiles.
- Scrutinize police investigation summaries, panchnamas, and forensic conclusions.

#### B. Exhibit Admissibility Scrutiny (`EXHIBITS` Tab)
- Inspect all admitted documents (FIR, Sec. 180 BNSS witness depositions, FSL reports, seizure memos).
- Inspect OCR-extracted statutory sections and party details.
- Toggle and examine authoritative SHA-256 digital hashes (`SHOW HASH`).

#### C. Section 63 BSA Digital Seal Verification (`VERIFY`)
- Clicking `VERIFY` on any exhibit opens `/(web)/documents/:id/verify`:
  - **Cryptographic Seal Check**: Verifies that the byte stream stored in MinIO matches the SHA-256 hash locked in the blockchain ledger.
  - **Ledger Proof Scrutiny**: Inspects the Block Index, Payload Hash, Previous Block Hash, and Authority Validator ID (`NODE_NCRB_GENESIS_VALIDATOR`).
  - **Tamper Simulation Verification**: The court can demonstrate live integrity testing—altering a simulated byte immediately triggers a rust-red **TAMPER DETECTED** banner.

#### D. Chain-of-Custody Judicial Audit (`CUSTODY` Tab)
- Review complete, chronologically sorted, non-repudiable logs of physical and digital transfers:
  - From initial field capture by Sub-Inspector, through FSL laboratory receipt, to court filing.
  - Confirms unbroken custody, satisfying the stringent legal threshold of electronic record admissibility under Section 63(2) of BSA, 2023.

---

### 5.3 Courtroom Audit Trail (`/(web)/audit`)
- Complete judicial visibility into the platform’s ledger audit trail:
  - Verifies exact timestamps and identity badges of officers who created, viewed, uploaded, or endorsed evidence.
  - Ensures complete compliance with the statutory record-keeping rules of the High Court and Ministry of Home Affairs.

---

## 6. Server-Side RBAC & Security Restrictions

| Operation | HTTP Route | Access Status | Security Constraint |
| :--- | :--- | :--- | :--- |
| **Inspect Filed Court Cases** | `GET /cases` | **PERMITTED** | Filtered to court docket |
| **Inspect Case Dossier** | `GET /cases/:id` | **PERMITTED** | Full read-only scrutiny |
| **Verify Exhibit Integrity** | `GET /documents/:id/verify` | **PERMITTED** | Cryptographic verification permitted |
| **View Audit Trail** | `GET /audit` | **PERMITTED** | Unrestricted read access |
| **Register New Police FIR** | `POST /cases` | **BLOCKED (403)** | Judicial officers cannot register police cases |
| **Upload / Modify Exhibit** | `POST /cases/:id/documents` | **BLOCKED (403)** | Court cannot inject evidence directly |
| **Modify Case Parameters** | `PUT /cases/:id` | **BLOCKED (403)** | Hardcoded read-only block in RBAC plugin |
| **Delete Any Record** | `DELETE /*` | **BLOCKED (403)** | Platform preserves permanent evidentiary immutability |
