import { PrismaClient, Role, CasePriority, SensitivityLevel, CaseStatus, DocumentType, DocumentStatus, CustodyAction, AuditAction } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Deterministic TOTP secret for demo (Base32 encoded 'PRAMAANDEMOSECRET12345678901234')
const DEMO_TOTP_SECRET = 'JBSWY3DPEHPK3PXP';
const DEMO_PASSWORD = 'DemoPass123!';

async function main() {
  console.log('🌱 Seeding Pramaan Database with Synthetic Demonstration Data...');

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // 1. Seed Demo Users for all 5 Roles
  console.log('Creating demo users for all 5 roles...');

  const io = await prisma.user.upsert({
    where: { email: 'io@example.gov' },
    update: {},
    create: {
      email: 'io@example.gov',
      passwordHash,
      name: 'Inspector Rajesh Varma',
      badgeNumber: 'TN-IO-4892',
      department: 'Women Safety Division, Crime Branch',
      jurisdiction: 'Chennai Central',
      role: Role.INVESTIGATION_OFFICER,
      totpSecret: DEMO_TOTP_SECRET,
      totpEnabled: true,
    },
  });

  const helpdesk = await prisma.user.upsert({
    where: { email: 'helpdesk@example.gov' },
    update: {},
    create: {
      email: 'helpdesk@example.gov',
      passwordHash,
      name: 'Sub-Inspector Ananya Swaminathan',
      badgeNumber: 'TN-WHD-1044',
      department: 'Women Help Desk, T. Nagar PS',
      jurisdiction: 'Chennai South',
      role: Role.WOMEN_HELP_DESK_OFFICER,
      totpSecret: DEMO_TOTP_SECRET,
      totpEnabled: true,
    },
  });

  const prosecutor = await prisma.user.upsert({
    where: { email: 'prosecutor@example.gov' },
    update: {},
    create: {
      email: 'prosecutor@example.gov',
      passwordHash,
      name: 'Advocate Meera Sundaram',
      badgeNumber: 'TN-PP-0381',
      department: 'Directorate of Public Prosecutions',
      jurisdiction: 'City Sessions Court, Chennai',
      role: Role.PROSECUTOR,
      totpSecret: DEMO_TOTP_SECRET,
      totpEnabled: true,
    },
  });

  const judge = await prisma.user.upsert({
    where: { email: 'judge@example.gov' },
    update: {},
    create: {
      email: 'judge@example.gov',
      passwordHash,
      name: 'Hon. Justice K. Ramanathan',
      badgeNumber: 'TN-JUD-0012',
      department: 'Special Fast Track Court for Women & Children',
      jurisdiction: 'Chennai Metropolitan Sessions',
      role: Role.JUDGE,
      totpSecret: DEMO_TOTP_SECRET,
      totpEnabled: true,
    },
  });

  const analyst = await prisma.user.upsert({
    where: { email: 'analyst@example.gov' },
    update: {},
    create: {
      email: 'analyst@example.gov',
      passwordHash,
      name: 'Dr. Siddharth Sen',
      badgeNumber: 'NCRB-STAT-992',
      department: 'NCRB Crime Research & Statistical Division',
      jurisdiction: 'National Crime Records Directorate, New Delhi',
      role: Role.NCRB_ANALYST,
      totpSecret: DEMO_TOTP_SECRET,
      totpEnabled: true,
    },
  });

  console.log('✅ Users created: IO, WHDO, Prosecutor, Judge, Analyst');

  // 2. Genesis Ledger Block
  let prevHash = '0000000000000000000000000000000000000000000000000000000000000000';
  const genesisHash = crypto.createHash('sha256').update(prevHash + 'GENESIS_BLOCK_PRAMAAN_NCRB_2026').digest('hex');

  await prisma.ledgerBlock.upsert({
    where: { index: 0 },
    update: {},
    create: {
      index: 0,
      previousHash: prevHash,
      blockHash: genesisHash,
      payloadHash: crypto.createHash('sha256').update('GENESIS').digest('hex'),
      payloadType: 'GENESIS_BLOCK',
      payloadData: { system: 'Pramaan National Chain-of-Custody Ledger', version: '1.0.0-PROTOTYPE' },
      validatorId: 'GENESIS_AUTHORITY_NCRB',
    },
  });

  // 3. Create Demo Case 1: Complete Case Scenario (Ready for Workflow Demo)
  const case1 = await prisma.case.upsert({
    where: { caseNumber: 'TN-2026-001245' },
    update: {},
    create: {
      caseNumber: 'TN-2026-001245',
      title: 'State vs. Unidentified Accused (T. Nagar Cyber Stalking & Threat Incident)',
      description: 'Repeated cyber-harassment, physical surveillance and intimidation reported near T. Nagar commercial zone.',
      firNumber: 'FIR-402/2026-TNAGAR',
      firDate: new Date('2026-08-10T10:30:00Z'),
      jurisdiction: 'Chennai South',
      policeStation: 'T. Nagar All-Women Police Station',
      bnsSections: ['BNS 64 (Rape / Attempt)', 'BNS 70 (Gang Harassment)', 'BNS 351 (Criminal Intimidation)', 'IT Act 66E'],
      priority: CasePriority.HIGH,
      sensitivity: SensitivityLevel.HIGHLY_SENSITIVE,
      status: CaseStatus.CHARGE_SHEET_PREPARED,
      incidentDate: new Date('2026-08-09T22:15:00Z'),
      incidentLocation: 'Pondy Bazaar 3rd Cross Road, T. Nagar, Chennai',
      victimName: 'Priya Narayanan (Protected)',
      victimAge: 24,
      suspects: ['Karthik S.', 'Ravi V.'],
    },
  });

  // Assign IO and Prosecutor
  await prisma.caseAssignment.upsert({
    where: { caseId_userId: { caseId: case1.id, userId: io.id } },
    update: {},
    create: { caseId: case1.id, userId: io.id, role: Role.INVESTIGATION_OFFICER },
  });

  await prisma.caseAssignment.upsert({
    where: { caseId_userId: { caseId: case1.id, userId: prosecutor.id } },
    update: {},
    create: { caseId: case1.id, userId: prosecutor.id, role: Role.PROSECUTOR },
  });

  // Create Documents for Case 1
  const firText = `FIRST INFORMATION REPORT (Under Section 154 Cr.P.C / BNSS)\nCase: TN-2026-001245\nPolice Station: T. Nagar AWPS\nDate & Time: 10-Aug-2026 10:30 hrs\nComplainant: Priya N.\nOffenses: BNS 64, BNS 70, BNS 351\nDetails: Complainant states recurring intimidation and stalking near Pondy Bazaar.`;
  const firHash = crypto.createHash('sha256').update(firText).digest('hex');

  const doc1 = await prisma.document.upsert({
    where: { id: 'doc-fir-001' },
    update: {},
    create: {
      id: 'doc-fir-001',
      caseId: case1.id,
      documentType: DocumentType.FIR,
      title: 'Original Registered First Information Report (FIR 402/2026)',
      originalFileName: 'FIR_402_2026_TNAGAR_SIGNED.pdf',
      storageKey: `cases/${case1.id}/documents/doc-fir-001/FIR_402_2026_TNAGAR_SIGNED.pdf`,
      mimeType: 'application/pdf',
      fileSize: 248102,
      sha256Hash: firHash,
      status: DocumentStatus.VERIFIED,
      extractedText: firText,
      detectedBnsSections: ['BNS 64', 'BNS 70', 'BNS 351'],
      detectedParties: { complainant: 'Priya N.', officer: 'Ananya Swaminathan', station: 'T. Nagar AWPS' },
      ledgerTxId: 'TX-LEDGER-000101-FIR',
      uploadedBy: helpdesk.id,
    },
  });

  const witnessText = `WITNESS DEPOSITION UNDER SECTION 180 BNSS\nWitness: Smt. Lakshmi R., Shop Owner Pondy Bazaar\nStates: Observed motorcycle with registration TN-09-XX-1122 idling repeatedly near bus stand between 21:45 and 22:30 hrs.`;
  const witnessHash = crypto.createHash('sha256').update(witnessText).digest('hex');

  const doc2 = await prisma.document.upsert({
    where: { id: 'doc-witness-002' },
    update: {},
    create: {
      id: 'doc-witness-002',
      caseId: case1.id,
      documentType: DocumentType.WITNESS_STATEMENT,
      title: 'Section 180 BNSS Witness Statement of Smt. Lakshmi R.',
      originalFileName: 'Witness_Statement_Lakshmi_Sec180.pdf',
      storageKey: `cases/${case1.id}/documents/doc-witness-002/Witness_Statement_Lakshmi_Sec180.pdf`,
      mimeType: 'application/pdf',
      fileSize: 184510,
      sha256Hash: witnessHash,
      status: DocumentStatus.VERIFIED,
      extractedText: witnessText,
      detectedBnsSections: ['BNS 70'],
      detectedParties: { witness: 'Lakshmi R.', recordedBy: 'Rajesh Varma' },
      ledgerTxId: 'TX-LEDGER-000102-WITNESS',
      uploadedBy: io.id,
    },
  });

  const forensicText = `FORENSIC SCIENCE LABORATORY (FSL) DIGITAL FORENSICS EXAMINATION REPORT\nFSL Ref: FSL-CHN-CY-2026-8812\nDevice: Apple iPhone 14 & SIM Card\nFindings: Digital extraction recovered 42 deleted threatening messaging transcripts matching complainant timestamp logs. Hash match verified.`;
  const forensicHash = crypto.createHash('sha256').update(forensicText).digest('hex');

  const doc3 = await prisma.document.upsert({
    where: { id: 'doc-fsl-003' },
    update: {},
    create: {
      id: 'doc-fsl-003',
      caseId: case1.id,
      documentType: DocumentType.FORENSIC_REPORT,
      title: 'State Forensic Science Laboratory (Cyber Unit) Digital Evidence Analysis',
      originalFileName: 'FSL_CHN_CY_2026_8812_CyberReport.pdf',
      storageKey: `cases/${case1.id}/documents/doc-fsl-003/FSL_CHN_CY_2026_8812_CyberReport.pdf`,
      mimeType: 'application/pdf',
      fileSize: 942100,
      sha256Hash: forensicHash,
      status: DocumentStatus.VERIFIED,
      extractedText: forensicText,
      detectedBnsSections: ['IT Act 66E', 'BNS 351'],
      detectedParties: { examiner: 'Dr. K. Senthil, Sr. Forensic Examiner', lab: 'FSL Chennai' },
      ledgerTxId: 'TX-LEDGER-000103-FORENSIC',
      uploadedBy: io.id,
    },
  });

  // Seed Ledger Blocks for these documents
  await prisma.ledgerBlock.upsert({
    where: { index: 1 },
    update: {},
    create: {
      index: 1,
      previousHash: genesisHash,
      blockHash: crypto.createHash('sha256').update(genesisHash + firHash).digest('hex'),
      payloadHash: firHash,
      payloadType: 'DOCUMENT_INTEGRITY',
      payloadData: { documentId: doc1.id, caseId: case1.id, documentType: 'FIR', hash: firHash },
      validatorId: 'NODE_TAMIL_NADU_VALIDATOR_1',
    },
  });

  await prisma.ledgerBlock.upsert({
    where: { index: 2 },
    update: {},
    create: {
      index: 2,
      previousHash: crypto.createHash('sha256').update(genesisHash + firHash).digest('hex'),
      blockHash: crypto.createHash('sha256').update(firHash + forensicHash).digest('hex'),
      payloadHash: forensicHash,
      payloadType: 'DOCUMENT_INTEGRITY',
      payloadData: { documentId: doc3.id, caseId: case1.id, documentType: 'FORENSIC_REPORT', hash: forensicHash },
      validatorId: 'NODE_TAMIL_NADU_VALIDATOR_1',
    },
  });

  // Seed Custody Timeline for Case 1
  await prisma.custodyEvent.createMany({
    data: [
      {
        caseId: case1.id,
        documentId: doc1.id,
        action: CustodyAction.UPLOADED,
        actorId: helpdesk.id,
        actorRole: Role.WOMEN_HELP_DESK_OFFICER,
        documentHash: firHash,
        ledgerTxId: 'TX-LEDGER-000101-FIR',
        ipAddress: '10.20.4.112',
        metadata: { client: 'Mobile Field App', station: 'T. Nagar AWPS' },
      },
      {
        caseId: case1.id,
        documentId: doc1.id,
        action: CustodyAction.OCR_PROCESSED,
        actorId: io.id,
        actorRole: Role.INVESTIGATION_OFFICER,
        documentHash: firHash,
        metadata: { engine: 'Pramaan DocumentAIService v1.0', detectedSections: ['BNS 64', 'BNS 70'] },
      },
      {
        caseId: case1.id,
        documentId: doc1.id,
        action: CustodyAction.SIGNED,
        actorId: io.id,
        actorRole: Role.INVESTIGATION_OFFICER,
        documentHash: firHash,
        metadata: { signatureType: 'DIGITAL_CRYPTOGRAPHIC_SEAL', badge: 'TN-IO-4892' },
      },
      {
        caseId: case1.id,
        documentId: doc3.id,
        action: CustodyAction.UPLOADED,
        actorId: io.id,
        actorRole: Role.INVESTIGATION_OFFICER,
        documentHash: forensicHash,
        ledgerTxId: 'TX-LEDGER-000103-FORENSIC',
        metadata: { lab: 'State FSL Chennai', reportNum: 'FSL-CHN-CY-2026-8812' },
      },
      {
        caseId: case1.id,
        documentId: doc1.id,
        action: CustodyAction.VERIFIED,
        actorId: prosecutor.id,
        actorRole: Role.PROSECUTOR,
        documentHash: firHash,
        ledgerTxId: 'TX-LEDGER-000101-FIR',
        metadata: { matchResult: 'MATCH_EXACT_AUTHORITATIVE', verificationMethod: 'SHA256_LEDGER_ANCHOR' },
      },
    ],
    skipDuplicates: true,
  });

  // Seed Workflow Requirements for Case 1 (1 unsatisfied initially to showcase blocked demo!)
  await prisma.workflowRequirement.createMany({
    data: [
      {
        caseId: case1.id,
        type: 'FORENSIC_REPORT',
        title: 'State Forensic Science Laboratory (FSL) Cyber/Digital Report',
        description: 'Forensic extraction report corroborating cyber communications and device extraction.',
        isSatisfied: true,
        mandatoryForFiling: true,
        satisfiedAt: new Date('2026-08-14T14:20:00Z'),
        satisfiedBy: io.name,
        documentRefId: doc3.id,
      },
      {
        caseId: case1.id,
        type: 'WITNESS_STATEMENT',
        title: 'Corroborating Eye-Witness / Panchnama Statement (BNSS Sec 180)',
        description: 'Independent deposition establishing suspect presence and vehicle identification.',
        isSatisfied: true,
        mandatoryForFiling: true,
        satisfiedAt: new Date('2026-08-12T11:00:00Z'),
        satisfiedBy: io.name,
        documentRefId: doc2.id,
      },
      {
        caseId: case1.id,
        type: 'EVIDENCE_METADATA',
        title: 'Cryptographic Document Hashing & Chain-of-Custody Integrity',
        description: 'All submitted case documents securely anchored in the permissioned audit ledger.',
        isSatisfied: true,
        mandatoryForFiling: true,
        satisfiedAt: new Date('2026-08-14T16:00:00Z'),
        satisfiedBy: 'Pramaan Ledger Service',
      },
      {
        caseId: case1.id,
        type: 'OFFICER_VERIFICATION',
        title: 'Investigating Officer Formal Case Verification',
        description: 'Authoritative sign-off by Investigation Officer affirming completeness of case record.',
        isSatisfied: true,
        mandatoryForFiling: true,
        satisfiedAt: new Date('2026-08-15T09:30:00Z'),
        satisfiedBy: io.name,
      },
      {
        caseId: case1.id,
        type: 'REQUIRED_SIGNATURES',
        title: 'Supervisory Officer Endorsement & Public Prosecutor Pre-Filing Clearance',
        description: 'Formal digital endorsement by Senior Inspector / Assistant Commissioner of Police.',
        isSatisfied: false, // Intentionally left false for demo flow!
        mandatoryForFiling: true,
        notes: 'Awaiting digital endorsement from Supervisory Officer before court filing.',
      },
    ],
    skipDuplicates: true,
  });

  // Seed Case 2: Cross-Case Intelligence Link Demo
  const case2 = await prisma.case.upsert({
    where: { caseNumber: 'TN-2026-001398' },
    update: {},
    create: {
      caseNumber: 'TN-2026-001398',
      title: 'State vs. Unknown (Stalking & Threat Incident near Usman Road)',
      description: 'Recurring night-time surveillance and threatening calls reported in proximity to commercial intersection.',
      firNumber: 'FIR-466/2026-TNAGAR',
      firDate: new Date('2026-08-18T14:00:00Z'),
      jurisdiction: 'Chennai South',
      policeStation: 'T. Nagar AWPS',
      bnsSections: ['BNS 70 (Gang Harassment)', 'BNS 351 (Criminal Intimidation)'],
      priority: CasePriority.HIGH,
      sensitivity: SensitivityLevel.HIGHLY_SENSITIVE,
      status: CaseStatus.UNDER_INVESTIGATION,
      incidentLocation: 'Usman Road Flyover Junction, T. Nagar, Chennai',
      victimName: 'Deepa S. (Protected)',
      victimAge: 22,
      suspects: ['Karthik S.'], // Shared suspect with Case 1!
    },
  });

  await prisma.caseAssignment.upsert({
    where: { caseId_userId: { caseId: case2.id, userId: io.id } },
    update: {},
    create: { caseId: case2.id, userId: io.id, role: Role.INVESTIGATION_OFFICER },
  });

  // Seed Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        actorId: io.id,
        actorRole: Role.INVESTIGATION_OFFICER,
        action: AuditAction.LOGIN_SUCCESS,
        resource: 'AUTH',
        ipAddress: '10.20.4.112',
        result: 'SUCCESS',
        reason: 'Officer MFA verified via TOTP',
      },
      {
        actorId: io.id,
        actorRole: Role.INVESTIGATION_OFFICER,
        action: AuditAction.CASE_VIEWED,
        resource: 'CASE',
        resourceId: case1.id,
        caseId: case1.id,
        result: 'SUCCESS',
      },
      {
        actorId: prosecutor.id,
        actorRole: Role.PROSECUTOR,
        action: AuditAction.DOCUMENT_VERIFIED,
        resource: 'DOCUMENT',
        resourceId: doc1.id,
        caseId: case1.id,
        result: 'SUCCESS',
        reason: 'SHA-256 integrity match verified against ledger block #1',
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Seed completed successfully! Demo accounts & case scenarios ready.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
