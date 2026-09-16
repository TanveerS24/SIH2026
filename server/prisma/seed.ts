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

  console.log('[INITIALIZATION] Authority accounts & Genesis Ledger Block #0 successfully configured. Clean register ready.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
