# Pramaan (प्रमाण) — Full 5-Role Architecture & Demo Voiceover Script

This document provides the complete, highly efficient, word-for-word voiceover script for presenting **Pramaan**. It covers every single feature across all **5 operational roles**, explains the legal necessity behind their separation, and details why specific capabilities are strictly prohibited for each role under Indian criminal jurisprudence.

---

## 1. System Overview: The 5-Cadre Legal Architecture

* "Welcome to the demonstration of **Pramaan (प्रमाण)** — an offline-first, tamper-evident digital evidence and chain-of-custody platform engineered for Indian law enforcement and judicial scrutiny."
* "Under India’s new criminal codes — the **Bharatiya Nyaya Sanhita (BNS)**, **Bharatiya Nagarik Suraksha Sanhita (BNSS)**, and **Bharatiya Sakshya Adhiniyam (BSA) 2023** — evidence management cannot be a monolithic system where any user can perform any action."
* "To guarantee legal admissibility and constitutional due process, Pramaan strictly segregates permissions across **5 distinct institutional cadres**:"
  1. **Women Help Desk Officer (WHDO):** Frontline on-scene emergency responder.
  2. **Investigation Officer (IO):** Operational detective compiling forensic proof and charge sheets.
  3. **Public Prosecutor:** Independent pre-trial legal scrutiny authority representing the State.
  4. **Honorable Magistrate / Judge:** Neutral courtroom adjudicator admitting evidence and pronouncing verdict.
  5. **NCRB Statistical Analyst:** Macro-level intelligence and crime analytics oversight.
* "Let's examine every feature of each role, the security boundaries separating them, and the technical mechanics enforcing them."

---

## 2. Role 1: Women Help Desk Officer (WHDO) — Frontline Field Response

### Operational Mandate
* Frontline emergency responder for offenses involving women, children, and vulnerable complainants.
* Operates in high-stress, potentially zero-connectivity field conditions to capture pristine on-scene evidence before contamination.

### Complete Feature Set
* **Field Home Dashboard (`/(mobile)/home`):**
  * Displays officer credentials, badge ID (`TN-WHD-1044`), and precinct jurisdiction.
  * Real-time network monitor pulsing `ONLINE` (green) or `OFFLINE` (amber).
  * Device SQLite queue counter showing unanchored field records stored locally on the phone.
  * Rapid one-touch action trigger: `CAPTURE EVIDENCE`.
* **3-Step Guided Capture Pipeline:**
  * **Step 1: Optical & Sensor Capture (`/(mobile)/new-record/capture`):**
    * Native and simulated camera viewfinder with corner alignment brackets and reticle crosshairs.
    * Live hardware GPS lock automatically reading device latitude and longitude sensors (no mock coordinates).
    * Dynamic GPS re-request safeguard: if GPS is disabled or permission denied, clicking the shutter or the HUD badge actively prompts the officer to re-authorize GPS to guarantee Section 63 BSA compliance.
    * Hardware ISO-8601 UTC timestamp locked permanently upon shutter release.
    * Evidence classification switch: Photo Exhibit, Witness Statement (Sec. 180 BNSS), or Seizure Memo.
  * **Step 2: Metadata Scrutiny (`/(mobile)/new-record/review`):**
    * High-fidelity image review with zoom capability.
    * Dynamic case linkage: associate with an existing FIR or mark as a new spot intake.
    * Deponent and witness identity fields: name, age, contact, and relation to case.
    * Verbatim on-scene summary and preliminary AI-suggested BNS offenses.
  * **Step 3: Non-Repudiation Digital Signature (`/(mobile)/new-record/sign`):**
    * Touch/stylus vector signature pad for victim, witness, or seizing officer.
    * Local SHA-256 pre-calculation on the client before transmission.
    * Statutory notice affirming compliance with Section 63 / 65B of BSA 2023.
* **Offline SQLite Sync Engine (`/(mobile)/sync`):**
  * Fully operational in zero-bandwidth zones: encrypted records persist in device SQLite, surviving battery drain or app crashes.
  * Each record carries a cryptographically unique UUIDv4 `idempotencyKey` preventing duplicate ledger transactions on reconnection.
  * Batch synchronization (`SYNC ALL TO LEDGER`) seamlessly transfers binaries to MinIO S3 and commits metadata to the PostgreSQL database and blockchain ledger.
* **Precinct Case Scrutiny (`/(mobile)/cases`):**
  * Review station cases, check investigation status, and review historical field depositions.

### Prohibited Features & Security Rationale
* **Formal Charge Sheet Filing is BLOCKED (`POST /workflow/:caseId/file` → 403 Forbidden):**
  * *Why:* Field officers handle intake, not final judicial filings. Allowing frontline officers to file charge sheets bypasses senior supervisory scrutiny and violates Section 193 BNSS.
* **Inter-Precinct Case Browsing is BLOCKED:**
  * *Why:* Officers are restricted to their assigned precinct jurisdiction to prevent unauthorized snooping into unrelated investigations.

---

## 3. Role 2: Investigation Officer (IO) — Case Compilation & Charge Sheet Engine

### Operational Mandate
* Lead investigator responsible for case initiation, evidence assembly, forensic verification, and statutory court filing.

### Complete Feature Set
* **Investigation Dashboard (`/(web)/dashboard`):**
  * Live telemetry cards: Active Cases, Anchored Evidence Count, Tamper Alert Monitor, and Charge Sheet Rate under statutory 60/90-day limits (Sec. 193 BNSS).
  * Direct action buttons: Register New Case, Launch Intelligence Search, and Workflow Checklists.
  * Recent Cases Ledger displaying case numbers, document counts, custody handovers, and filing milestones.
* **Case Registration & Auto-Ingestion (`/(web)/cases`):**
  * **AI FIR Auto-Ingest:** Drag-and-drop PDF/image FIRs. Authoritative server-side SHA-256 hash calculation, MinIO S3 ingestion, and AI OCR extraction of case parameters and statutory sections (e.g., BNS 64, BNS 70).
  * **Manual Statutory Entry:** Form inputs for Case Number, Title, Police Station, BNS Codes, Incident Location, Priority, and Sensitivity Level.
* **Case Dossier & Exhibit Ingestion (`/(web)/cases/:id`):**
  * **Exhibit Ingestion (`+ INGEST`):** Supports FIR, Witness Statements (Sec. 180 BNSS), Victim Depositions, FSL Forensic Lab Reports, Seizure Memos, and Crime Scene Photos.
  * **Exhibit Inspection:** Toggle SHA-256 cryptographic digest visibility, review OCR-detected BNS offenses, inspect uploader metadata, and initiate ledger verification.
  * **Chain-of-Custody Audit (`CUSTODY` Tab):** Immutable chronological timeline logging every state change: `UPLOADED`, `MALWARE_SCANNED`, `OCR_PROCESSED`, `SIGNED`, `VERIFIED`, and `FILED`.
  * **Cross-Case Intelligence Links (`LINKS` Tab):** AI correlation engine detecting repeat suspect names, phone numbers, vehicle registrations, or recurring modus operandi across stations.
* **Statutory Charge Sheet Workflow Engine (`/(web)/workflows/:caseId/charge-sheet`):**
  * **4 Mandatory Hard Gates:**
    1. Forensic Science Laboratory (FSL) report uploaded and verified.
    2. Witness statement under Section 180 BNSS recorded and digitally signed.
    3. Evidence metadata and SHA-256 hash verified against the ledger.
    4. Supervisory ACP / DSP digital endorsement applied.
  * Applying digital endorsement unlocks the dossier to `READY TO FILE`.
  * Submitting the charge sheet permanently locks the case to `FILED` and writes an immutable transaction block to the ledger.
* **Intelligence Search & Discovery (`/(web)/search`):**
  * Strict RAG-based natural language search powered by local LLM and vector embeddings, strictly grounded in verified exhibits and SHA-256 hashes.
* **Universal Audit Trail (`/(web)/audit`):**
  * Full visibility into evidentiary access events, ensuring compliance with Section 63 BSA 2023.

### Prohibited Features & Security Rationale
* **Post-Filing Case Mutation is BLOCKED (`PUT /cases/:id` → 403 Forbidden):**
  * *Why:* Once a charge sheet is filed in court, the police lose unilateral editing rights. Allowing post-filing edits would enable evidence tampering or retroactive cover-ups.
* **Bypassing Workflow Gates is BLOCKED (`POST /workflow/:caseId/file` → 409 Conflict):**
  * *Why:* Incomplete charge sheets cannot be filed. Attempting to file without mandatory gates (like FSL reports or ACP endorsement) is intercepted by the server with an HTTP 409 Conflict error.

---

## 4. Role 3: Public Prosecutor — Pre-Trial Scrutiny & Admissibility Filter

### Operational Mandate
* Independent legal gatekeeper representing the State. Scrutinizes police dossiers before court submission to ensure evidence is legally sufficient and compliant with Section 63 of BSA 2023.

### Complete Feature Set
* **Prosecutorial Scrutiny Dashboard (`/(web)/dashboard`):**
  * Filtered view of pending charge sheets and sessions cases awaiting trial.
  * Conversion rate metrics tracking police investigation quality.
  * Zero-tolerance tamper alert indicator across all docketed evidence.
* **Legal Dossier Scrutiny (`/(web)/cases/:id`):**
  * Review of FIR charges against alleged facts to prevent over-charging or under-charging.
  * Scrutiny of Section 180 BNSS witness statements to confirm non-coercion, voluntary deposition, and proper timestamps.
  * Scrutiny of FSL forensic certificates and recovery panchanamas.
* **Live Cryptographic Hash Verification (`/(web)/documents/:id/verify`):**
  * Recalculates live byte-stream SHA-256 directly from MinIO S3 and matches it against the immutable ledger transaction block.
  * Displays the green **Digital Integrity Seal** confirming evidence authenticity.
  * **Interactive Tamper Simulation Test:** Simulates an altered byte in the stored file, instantly triggering a rust-red **INTEGRITY MISMATCH DETECTED** alert to demonstrate fraud prevention.
* **Chain-of-Custody Scrutiny (`CUSTODY` Tab):**
  * Verifies timestamps between police dispatch and forensic lab receipt, ensuring no unauthorized intermediary handled the evidence.
* **Workflow Scrutiny Review (`/(web)/workflows/:caseId/charge-sheet`):**
  * Scrutinizes fulfillment of all 4 pre-filing statutory prerequisites before endorsing the case for trial.

### Prohibited Features & Security Rationale
* **FIR Registration is BLOCKED (`POST /cases` → 403 Forbidden):**
  * *Why:* Case initiation is an executive police power under Section 173 BNSS. Prosecutors cannot register crimes.
* **Raw Crime Evidence Upload is BLOCKED (`POST /cases/:id/documents` → 403 Forbidden):**
  * *Why:* The prosecutor is an objective scrutiny authority, not an evidence collector. Allowing prosecutors to generate or upload evidence destroys the institutional separation between police and prosecution.

---

## 5. Role 4: Honorable Magistrate / Presiding Judge — Adjudicating Authority

### Operational Mandate
* Presiding judicial officer who conducts pre-trial scrutiny, frames charges, determines admissibility of electronic records under BSA 2023, presides over trial, and pronounces verdict.

### Complete Feature Set
* **Judicial Bench Dashboard (`/(web)/dashboard`):**
  * Direct overview of the court docket filtered strictly to formally filed charge sheets.
  * Monitored count of cryptographically sealed exhibits admitted to the court register.
  * Bench disposal rates and zero-tamper alert monitor across all judicial dockets.
* **Court Docket & Case Examination (`/(web)/cases/:id`):**
  * Complete visibility into the filed police dossier: formal FIR, accused profiles, witness statements, forensic reports, and seizure memos.
* **Section 63 BSA Digital Seal Verification (`/(web)/documents/:id/verify`):**
  * Full inspection of cryptographic proofs: Block Index, Payload Hash, Previous Block Hash, and Genesis Validator ID (`NODE_NCRB_GENESIS_VALIDATOR`).
  * Instant generation and validation of the digital evidentiary certificate required under **Section 63 of BSA 2023** for admitting electronic records into evidence.
* **Chain-of-Custody Judicial Audit (`CUSTODY` Tab):**
  * Examines the unbroken chronological custody chain from on-scene seizure to courtroom presentation.

### Prohibited Features & Security Rationale (CRITICAL)
* **SERVER-SIDE READ-ONLY HARD LOCK (`POST`, `PUT`, `PATCH`, `DELETE` → 403 Forbidden):**
  * *Why:* In `server/src/plugins/rbac.plugin.ts`, any non-`GET` request by a judge is immediately rejected with HTTP 403: *"Judicial officers possess read-only scrutiny access. Case mutations are strictly prohibited."*
  * *Reason:* If a judge had edit or write permissions on evidence, the court would lose its neutrality. A judge cannot edit evidence, add exhibits, or alter police records. Any modification by a judicial officer would contaminate the record, violate constitutional due process, and cause an immediate mistrial.

---

## 6. Role 5: NCRB Statistical Analyst — Macro Intelligence & Privacy Safeguard

### Operational Mandate
* Operates under the National Crime Records Bureau (Ministry of Home Affairs), monitoring national crime trends, state-wise disposal metrics, and forensic turnaround timelines.

### Complete Feature Set
* **National Analytics Dashboard (`/(web)/analytics`):**
  * Macro-level national conviction rates, state-by-state disposal performance, and monthly disposal trends.
  * Forensic laboratory turnaround metrics and charging speed indicators under Section 193 BNSS.
* **Privacy-Preserving De-Identification Architecture:**
  * Displays macro crime patterns without exposing sensitive personal identifiers of victims, witnesses, or accused individuals.
* **Elevated Access Workflow (`/(web)/access-requests`):**
  * Enables submitting a formal request for temporary, time-bound access to an individual case record when statutory justification exists.

### Prohibited Features & Security Rationale
* **Direct Inspection of Individual Case Records is BLOCKED by Default (`GET /cases/:id` → 403 Forbidden):**
  * *Why:* Under the Digital Personal Data Protection Act and victim privacy safeguards, statistical analysts have no business browsing individual police FIRs or victim identities.
  * *The Security Gate:* Any attempt to inspect an individual case without active approval is rejected with HTTP 403.
  * *Elevated Access Protocol:* The analyst must submit a formal request via `/(web)/access-requests` with a written statutory justification of at least 20 characters and a specified time duration. Once approved by a supervisor, access is granted temporarily, and every single view event is permanently logged in the audit trail under `ELEVATED_CASE_ACCESS_UTILIZED`.

---

## 7. AI Subsystem & Strict RAG Engine: How It Works & Where AI Is Used

### Where AI Support Is Built Into Pramaan
* "Artificial intelligence in Pramaan is strictly engineered as an **investigative decision-support tool**, never an autonomous decision-maker."
* "AI operates across four core surfaces in the platform:"
  1. **Optical Character Recognition (OCR) & Document Ingestion:**
     * Automatically extracts machine-readable text from uploaded scanned PDF and image evidence (FIRs, hospital examination reports, seizure memos, witness depositions).
     * Automatically categorizes exhibits into 6 statutory classes (`FIR`, `FORENSIC_REPORT`, `WITNESS_STATEMENT`, `MEDICAL_EXAM_REPORT`, `SEIZURE_MEMO`, `CHARGE_SHEET`).
  2. **Statutory Offense Classification (BNS Mapping):**
     * Scans extracted depositions and panchanamas to detect and flag applicable offenses under the **Bharatiya Nyaya Sanhita (BNS)**.
     * Identifies offenses such as **BNS 64** (rape/sexual assault), **BNS 70** (gang harassment), **BNS 351** (criminal intimidation), and **IT Act Section 66E** (privacy violation).
     * Extracts named entities: complainant, victim, protected witnesses, suspect, and investigating police station.
  3. **Cross-Case Intelligence Pattern Discovery (`LINKS` Tab):**
     * Employs cross-case entity correlation to detect repeat offenders across station boundaries.
     * Flags recurring suspect names, matching phone numbers, vehicle registrations, and shared modus operandi that human officers might miss across different jurisdictions.
  4. **Automated Executive Case Summarization:**
     * Generates a coherent factual narrative and chronological custody digest from multi-exhibit case dossiers for prosecutor and investigator review.

### How the Strict RAG System Works Under the Hood
* "For evidence search and inquiry, Pramaan implements a **Zero-Hallucination Strict RAG (Retrieval-Augmented Generation)** pipeline."
* "In criminal law, standard generative AI is dangerous because hallucinations can lead to wrongful arrests or contaminated court records. Here is how our architecture guarantees 100% evidentiary grounding:"
  * **Step 1: Sliding-Window Semantic Chunking:**
    * When evidence text is extracted, our chunking engine (`chunking.service.ts`) splits the document into 500-character target chunks with a 100-character overlap.
    * Crucially, it enforces sentence-boundary preservation so that legal statements and witness testimonies are never cut off mid-sentence.
  * **Step 2: Dual Task-Prefixed Dense Vector Embeddings:**
    * Each chunk is embedded using `nomic-embed-text`, generating a 768-dimensional normalized dense vector (`||v|| = 1.0`).
    * We employ asymmetric task prefixes: `search_document: ` for indexing exhibit chunks and `search_query: ` for officer questions. This aligns user queries and legal documents into the optimal mathematical vector space.
  * **Step 3: Vector Similarity Retrieval:**
    * When an officer asks a question in the search bar, Pramaan computes the query embedding and performs a cosine similarity search against all indexed chunks.
    * The system retrieves the top-K highest-scoring chunks that exceed a strict similarity threshold.
  * **Step 4: Near-Deterministic Grounded Generation:**
    * The retrieved chunks are formatted with strict attribution markers (`[EVIDENCE_EXHIBIT_X]`) and injected into the system prompt.
    * The prompt is sent to `qwen2.5:7b` (Alibaba Cloud Qwen 2.5 7B Instruct) running locally via Ollama at a near-deterministic temperature of **0.1** with top-p 0.8.
  * **Step 5: Anti-Hallucination Refusal Gate:**
    * If no evidence meets the similarity threshold, the system strictly refuses to speculate.
    * The model returns: *"NO VERIFIED EVIDENCE FOUND IN CUSTODY RECORDS matching this query. Under strict RAG parameters, ungrounded speculation is prohibited."*
  * **Step 6: Mandatory Cryptographic Citation:**
    * For every answer generated, the system explicitly cites the **Exhibit Title**, **Document Type**, and the exact **SHA-256 cryptographic hash** of the source file.
    * The prosecutor or judge can click any citation to instantly inspect the underlying ledger block and verify the original file bytes.
  * **Step 7: Stage-2 QLoRA Domain Specialization Pipeline:**
    * Pramaan includes an automated training harness (`ai-pipeline/stage2-train/`) using 4-bit NF4 QLoRA (rank 16, alpha 32) on PyTorch and PEFT.
    * This allows continuous fine-tuning on Indian legal precedents and BNS statutory classifications, validated by an automated AI CI/CD pipeline evaluating grounding scores and citation fidelity.

---

## 8. Master Cross-Cadre Permission Matrix

| Operation / Feature | WHDO (Field) | IO (Investigation) | Public Prosecutor | Hon. Magistrate / Judge | NCRB Analyst |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Register New FIR / Case** | Assigned Only | **YES** | BLOCKED | BLOCKED | BLOCKED |
| **On-Scene Field Capture (GPS/Sign)** | **YES** | NO | NO | NO | NO |
| **Offline SQLite Queue & Sync** | **YES** | NO | NO | NO | NO |
| **Upload Raw Crime Scene Evidence** | **YES** (Field) | **YES** | BLOCKED | BLOCKED | BLOCKED |
| **OCR & Statutory BNS Classification** | **YES** | **YES** | Review Only | Review Only | De-Identified |
| **Satisfy Pre-Filing Workflow Gates** | NO | **YES** | Review Only | NO | NO |
| **Submit Formal Court Charge Sheet** | BLOCKED | **YES** | BLOCKED | BLOCKED | BLOCKED |
| **Cryptographic Hash Verification** | **YES** | **YES** | **YES** | **YES** | **YES** |
| **Mutate Anchored Case Evidence** | BLOCKED | BLOCKED (Once Filed)| BLOCKED | **STRICTLY BLOCKED** | **STRICTLY BLOCKED** |
| **Inspect Unassigned Individual Cases** | Precinct Only | Station Only | Filed Only | Docket Only | **BLOCKED (Needs Approval)**|
| **View System Macro Analytics** | Summary | Summary | Summary | Bench Stats | **UNRESTRICTED** |
| **Inspect Global Audit Log** | Precinct Only | **YES** | **YES** | **YES** | **YES** |

---

## 9. Closing Summary

* "To summarize, Pramaan is not just an application — it is an end-to-end digital implementation of Indian criminal jurisprudence."
* "Every piece of evidence is captured on the ground with real hardware GPS, hashed authoritatively by the server, anchored immutably to the ledger, and verified across all five institutional tiers."
* "With our zero-hallucination Strict RAG intelligence and strict server-side RBAC, Pramaan guarantees that digital evidence remains uncompromised from the crime scene all the way to final judicial conviction."
