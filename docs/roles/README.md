# Pramaan Role Architecture & Cadre Specifications

**Pramaan (प्रमाण)** implements strict, end-to-end Role-Based Access Control (RBAC) enforced authoritatively at the Fastify server layer (`server/src/plugins/rbac.plugin.ts`). Every platform operation—from mobile field ingestion to courtroom judicial scrutiny—is strictly governed by statutory mandates under the **Bharatiya Nyaya Sanhita (BNS), 2023**, **Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023**, and **Bharatiya Sakshya Adhiniyam (BSA), 2023**.

---

## 1. Cadre Documentation Index

Click any role below to view its dedicated, comprehensive specification detailing its operational mandate, surfaces, navigation options, feature workflows, and server-side security restrictions:

| Role Identifier | Official Cadre Title | Demo Persona | Primary Surface | Detailed Specification |
| :--- | :--- | :--- | :--- | :--- |
| `INVESTIGATION_OFFICER` | **Investigation Officer (IO)** | Inspector Rajesh Varma (`TN-IO-4892`) | Web Portal & Responsive UI | [Read Specification →](file:///c:/Users/Tanveer/Projects/pramaan/docs/roles/INVESTIGATION_OFFICER.md) |
| `WOMEN_HELP_DESK_OFFICER` | **Women Help Desk Officer (WHDO)** | Sub-Inspector Ananya Swaminathan (`TN-WHD-1044`) | Mobile Field App & Offline Queue | [Read Specification →](file:///c:/Users/Tanveer/Projects/pramaan/docs/roles/WOMEN_HELP_DESK_OFFICER.md) |
| `PROSECUTOR` | **Public Prosecutor** | Advocate Meera Sundaram (`TN-PP-0381`) | Legal Scrutiny Web Portal | [Read Specification →](file:///c:/Users/Tanveer/Projects/pramaan/docs/roles/PROSECUTOR.md) |
| `JUDGE` | **Hon. Magistrate / Judge** | Hon. Justice K. Ramanathan (`TN-JUD-0012`) | Courtroom Chamber Web Portal | [Read Specification →](file:///c:/Users/Tanveer/Projects/pramaan/docs/roles/JUDGE.md) |
| `NCRB_ANALYST` | **NCRB Statistical Analyst** | Dr. Siddharth Sen (`NCRB-STAT-992`) | National Analytics & Intelligence | [Read Specification →](file:///c:/Users/Tanveer/Projects/pramaan/docs/roles/NCRB_ANALYST.md) |

---

## 2. Cross-Cadre Permission Matrix

The following matrix summarizes the precise permissions and restrictions enforced across all 5 cadres:

| Feature / Operation | Investigation Officer (IO) | Women Help Desk Officer (WHDO) | Public Prosecutor | Hon. Magistrate / Judge | NCRB Statistical Analyst |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Register New Police FIR / Case** | **YES** | Assigned Cases | NO | NO | NO |
| **Upload Raw Crime Scene Evidence** | **YES** | **YES** (Field) | NO | NO | NO |
| **Offline SQLite Field Capture** | NO | **YES** | NO | NO | NO |
| **Perform OCR & BNS Tagging** | **YES** | **YES** | Review Only | Review Only | De-Identified |
| **Satisfy Pre-Filing Workflow Gates** | **YES** | NO | **YES** (Scrutiny) | NO | NO |
| **Submit Formal Charge Sheet (Court)** | **YES** | NO | NO | NO | NO |
| **Cryptographic Hash Verification** | **YES** | **YES** | **YES** | **YES** | **YES** |
| **Direct Case Mutation Privileges** | Active Investigation | Field Intake | NO | **STRICTLY BLOCKED** | **STRICTLY BLOCKED** |
| **Inspect Unassigned / Unfiled Cases** | Jurisdiction Match | Station Match | NO | NO | **BLOCKED (Needs Request)**|
| **Submit Elevated Access Request** | NO | NO | NO | NO | **YES** |
| **View System-Wide Macro Analytics** | Summary | Summary | Summary | Bench Stats | **UNRESTRICTED** |
| **Inspect Global Audit Trail** | **YES** | Precinct Only | **YES** | **YES** | **YES** |

---

## 3. Core Architectural Security Principles

### 3.1 Server-Side Authoritative Enforcement
All access control decisions are made inside Fastify route pre-handlers (`requireRoles`, `checkCaseAccess`) before executing database queries or touching MinIO S3 object storage. Client-side hiding of buttons is purely cosmetic; unauthorized requests directly submitted to the API fail with **HTTP 401 Unauthorized**, **HTTP 403 Forbidden**, or **HTTP 409 Conflict**.

### 3.2 Judicial Read-Only Scrutiny Lock
Presiding judicial officers possess total transparency into filed evidence and custody logs, but any request method modifying state (`POST`, `PUT`, `PATCH`, `DELETE`) is hard-blocked by the RBAC middleware to preserve judicial neutrality and evidence integrity.

### 3.3 Privacy-Preserving De-Identification Gate
NCRB analysts cannot directly browse individual police case files. They must submit a formal written statutory justification (minimum 20 characters) and obtain supervisor clearance. Once approved, access is granted on a temporary, time-bound basis and audited permanently under `ELEVATED_CASE_ACCESS_UTILIZED`.

### 3.4 Strict Pre-Filing Workflow Hard Gates
Police officers cannot prematurely file incomplete charge sheets. The server enforces four mandatory prerequisites (FSL lab report, Sec. 180 BNSS witness deposition, exhibit hash verification, and supervisory ACP endorsement). Bypassing this returns an immediate **HTTP 409 Conflict**.

### 3.5 Universal Non-Repudiation Audit Logging
Every action across all 5 roles—successful logins, TOTP challenges, case views, exhibit uploads, hash verifications, simulated tamper checks, and access grants—is permanently recorded via `auditService.logAction` in accordance with **Section 63 / 65B of the Bharatiya Sakshya Adhiniyam, 2023**.
