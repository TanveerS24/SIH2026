import crypto from 'crypto';
import { prisma } from '../config/prisma.js';

export interface LedgerRecordResult {
  txId: string;
  blockIndex: number;
  blockHash: string;
  previousHash: string;
  payloadHash: string;
  timestamp: string;
}

export interface LedgerVerificationResult {
  isAnchored: boolean;
  isValid: boolean;
  txId: string | null;
  blockIndex: number | null;
  storedLedgerHash: string | null;
  providedHash: string;
  anchoredAt: string | null;
  validator: string | null;
}

export interface ILedgerService {
  recordEvent(payloadType: string, payloadData: Record<string, any>, payloadHash: string): Promise<LedgerRecordResult>;
  verifyDocumentHash(documentId: string, providedHash: string): Promise<LedgerVerificationResult>;
  getLedgerHistory(limit?: number): Promise<any[]>;
}

class SimulatedPermissionedLedgerService implements ILedgerService {
  private validatorId = 'NODE_NCRB_VALIDATOR_PRIMARY';

  public async recordEvent(
    payloadType: string,
    payloadData: Record<string, any>,
    payloadHash: string
  ): Promise<LedgerRecordResult> {
    let retries = 5;
    while (retries > 0) {
      try {
        // 1. Fetch latest block to maintain cryptographically linked chain
        const latestBlock = await prisma.ledgerBlock.findFirst({
          orderBy: { index: 'desc' },
        });

        const previousHash = latestBlock ? latestBlock.blockHash : '0000000000000000000000000000000000000000000000000000000000000000';
        const nextIndex = latestBlock ? latestBlock.index + 1 : 0;
        const timestamp = new Date();

        // 2. Compute block hash: SHA256(index + prevHash + payloadHash + timestamp)
        const blockPayload = `${nextIndex}:${previousHash}:${payloadHash}:${timestamp.toISOString()}:${this.validatorId}`;
        const blockHash = crypto.createHash('sha256').update(blockPayload).digest('hex');
        const txId = `TX-LEDGER-${String(nextIndex).padStart(6, '0')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

        const enrichedPayload = {
          ...payloadData,
          txId,
        };

        // 3. Persist block into database
        await prisma.ledgerBlock.create({
          data: {
            index: nextIndex,
            previousHash,
            blockHash,
            payloadHash,
            payloadType,
            payloadData: enrichedPayload,
            timestamp,
            validatorId: this.validatorId,
          },
        });

        return {
          txId,
          blockIndex: nextIndex,
          blockHash,
          previousHash,
          payloadHash,
          timestamp: timestamp.toISOString(),
        };
      } catch (err: any) {
        if (err.code === 'P2002' && retries > 1) {
          retries--;
          await new Promise((resolve) => setTimeout(resolve, 30 + Math.random() * 50));
          continue;
        }
        throw err;
      }
    }
    throw new Error('Failed to record ledger event after retries');
  }

  public async verifyDocumentHash(documentId: string, providedHash: string): Promise<LedgerVerificationResult> {
    // Find ledger block referencing this document
    const blocks = await prisma.ledgerBlock.findMany({
      orderBy: { index: 'desc' },
    });

    const matchingBlock = blocks.find((b) => {
      const data = b.payloadData as any;
      return data && data.documentId === documentId;
    });

    if (!matchingBlock) {
      return {
        isAnchored: false,
        isValid: false,
        txId: null,
        blockIndex: null,
        storedLedgerHash: null,
        providedHash,
        anchoredAt: null,
        validator: null,
      };
    }

    const isMatch = matchingBlock.payloadHash.toLowerCase() === providedHash.toLowerCase();
    const data = matchingBlock.payloadData as any;

    return {
      isAnchored: true,
      isValid: isMatch,
      txId: data?.txId || `TX-BLK-${matchingBlock.index}`,
      blockIndex: matchingBlock.index,
      storedLedgerHash: matchingBlock.payloadHash,
      providedHash,
      anchoredAt: matchingBlock.timestamp.toISOString(),
      validator: matchingBlock.validatorId,
    };
  }

  public async getLedgerHistory(limit = 50): Promise<any[]> {
    return prisma.ledgerBlock.findMany({
      take: limit,
      orderBy: { index: 'desc' },
    });
  }
}

export const ledgerService: ILedgerService = new SimulatedPermissionedLedgerService();
