import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clean() {
  console.log('Cleaning mock cases, documents, and custody records...');
  await prisma.custodyEvent.deleteMany({});
  await prisma.signature.deleteMany({});
  await prisma.workflowRequirement.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.caseAssignment.deleteMany({});
  await prisma.case.deleteMany({});
  await prisma.accessRequest.deleteMany({});
  console.log('Database cleaned to 0 cases and 0 documents.');
}

clean()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
