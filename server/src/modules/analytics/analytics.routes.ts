import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../config/prisma.js';

export async function analyticsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  fastify.get('/overview', async (_request: FastifyRequest, reply: FastifyReply) => {
    const totalCasesCount = await prisma.case.count();
    const filedCasesCount = await prisma.case.count({ where: { isFiled: true } });
    const documentsCount = await prisma.document.count();
    const ledgerBlockCount = await prisma.ledgerBlock.count();

    // Synthetic & Dynamic state-level breakdown for NCRB Analytics Dashboard
    const states = [
      {
        stateName: 'Tamil Nadu',
        stateCode: 'TN',
        totalRegistered: totalCasesCount + 1420,
        underInvestigation: 412,
        chargeSheetsFiled: filedCasesCount + 1008,
        convictionRatePercent: 74.2,
        avgDaysToChargeSheet: 58,
        forensicTurnaroundDays: 14,
      },
      {
        stateName: 'Maharashtra',
        stateCode: 'MH',
        totalRegistered: 2150,
        underInvestigation: 630,
        chargeSheetsFiled: 1520,
        convictionRatePercent: 68.8,
        avgDaysToChargeSheet: 64,
        forensicTurnaroundDays: 18,
      },
      {
        stateName: 'Karnataka',
        stateCode: 'KA',
        totalRegistered: 1280,
        underInvestigation: 340,
        chargeSheetsFiled: 940,
        convictionRatePercent: 71.5,
        avgDaysToChargeSheet: 52,
        forensicTurnaroundDays: 12,
      },
      {
        stateName: 'Delhi NCT',
        stateCode: 'DL',
        totalRegistered: 1890,
        underInvestigation: 510,
        chargeSheetsFiled: 1380,
        convictionRatePercent: 66.4,
        avgDaysToChargeSheet: 61,
        forensicTurnaroundDays: 16,
      },
      {
        stateName: 'Telangana',
        stateCode: 'TS',
        totalRegistered: 980,
        underInvestigation: 210,
        chargeSheetsFiled: 770,
        convictionRatePercent: 78.1,
        avgDaysToChargeSheet: 47,
        forensicTurnaroundDays: 10,
      },
      {
        stateName: 'Kerala',
        stateCode: 'KL',
        totalRegistered: 860,
        underInvestigation: 140,
        chargeSheetsFiled: 720,
        convictionRatePercent: 82.4,
        avgDaysToChargeSheet: 41,
        forensicTurnaroundDays: 9,
      },
    ];

    const categories = [
      {
        category: 'Cyber Intimidation & Stalking',
        bnsSection: 'BNS 70 / IT 66E',
        caseCount: 1450,
        percentage: 32.5,
        chargeSheetRate: 88.2,
      },
      {
        category: 'Sexual Harassment & Assault',
        bnsSection: 'BNS 64 / BNS 74',
        caseCount: 1210,
        percentage: 27.1,
        chargeSheetRate: 81.4,
      },
      {
        category: 'Criminal Intimidation & Threat',
        bnsSection: 'BNS 351',
        caseCount: 980,
        percentage: 22.0,
        chargeSheetRate: 91.0,
      },
      {
        category: 'Domestic Violence & Cruelty',
        bnsSection: 'BNS 85 / 86',
        caseCount: 820,
        percentage: 18.4,
        chargeSheetRate: 79.5,
      },
    ];

    const monthlyTrends = [
      { month: 'Jan 2026', reported: 310, chargeSheeted: 245, disposed: 190 },
      { month: 'Feb 2026', reported: 340, chargeSheeted: 280, disposed: 215 },
      { month: 'Mar 2026', reported: 380, chargeSheeted: 310, disposed: 260 },
      { month: 'Apr 2026', reported: 360, chargeSheeted: 295, disposed: 240 },
      { month: 'May 2026', reported: 410, chargeSheeted: 350, disposed: 290 },
      { month: 'Jun 2026', reported: 395, chargeSheeted: 340, disposed: 305 },
      { month: 'Jul 2026', reported: 430, chargeSheeted: 375, disposed: 320 },
      { month: 'Aug 2026', reported: 450, chargeSheeted: 390, disposed: 340 },
    ];

    return reply.status(200).send({
      disclaimer: 'DEMONSTRATION DATA — NOT OFFICIAL NCRB STATISTICS',
      totalCases: totalCasesCount + 8580,
      activeInvestigations: 2242,
      chargeSheetsFiledRate: 78.4,
      avgChargeSheetDays: 54,
      evidenceTamperAlerts: 0,
      totalEvidenceAnchored: documentsCount + 24510,
      ledgerBlocksAnchored: ledgerBlockCount,
      states,
      categories,
      monthlyTrends,
      lastUpdated: new Date().toISOString(),
    });
  });
}
