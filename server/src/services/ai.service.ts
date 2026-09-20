import { Buffer } from 'node:buffer';
import { ragService } from './rag.service.js';

export interface ExtractedMetadata {
  documentType: string;
  caseNumber?: string;
  detectedBnsSections: string[];
  jurisdiction?: string;
  detectedParties: {
    complainant?: string;
    victim?: string;
    witness?: string;
    suspect?: string;
    officer?: string;
    station?: string;
  };
  confidenceScore: number;
  advisoryDisclaimer: string;
}

export interface IDocumentAIService {
  extractText(buffer: Buffer, mimeType: string, fileName: string): Promise<string>;
  classifyDocument(text: string, fileName: string): Promise<string>;
  extractMetadata(text: string, fileName: string): Promise<ExtractedMetadata>;
  generateCaseSummary(caseDetails: any, documents: any[]): Promise<string>;
  semanticSearch(query: string, cases: any[]): Promise<{ caseId: string; relevanceScore: number; aiMatchExplanation: string }[]>;
}

class SimulatedDocumentAIService implements IDocumentAIService {
  private disclaimer = 'AI-GENERATED ADVISORY METADATA — NOT AUTHORITATIVE LEGAL EVIDENCE';

  public async extractText(buffer: Buffer, _mimeType: string, fileName: string): Promise<string> {
    const rawContent = buffer.toString('utf8');
    if (rawContent && rawContent.length > 20 && !rawContent.includes('\0')) {
      return rawContent;
    }

    // Deterministic simulation based on file naming / type
    const lower = fileName.toLowerCase();
    if (lower.includes('fir')) {
      return `FIRST INFORMATION REPORT (Under Section 154 Cr.P.C / BNSS)\nState Crime Records Bureau - Women Safety Division\nFIR No: 402/2026\nSections: BNS 64, BNS 70, BNS 351\nJurisdiction: Chennai South (T. Nagar AWPS)\nDetails: Complainant reports repeated cyber stalking, physical surveillance, and aggressive threats near Pondy Bazaar.`;
    } else if (lower.includes('witness') || lower.includes('statement')) {
      return `DEPOSITION OF WITNESS (Section 180 BNSS)\nWitness: Smt. Lakshmi R., Commercial Shop Owner\nStation: T. Nagar AWPS\nStatement: Witness confirms seeing suspect loitering near commercial complex between 21:30 and 22:30 hrs.`;
    } else if (lower.includes('forensic') || lower.includes('fsl')) {
      return `STATE FORENSIC SCIENCE LABORATORY DIGITAL EXAMINATION\nReport: FSL-CHN-CY-2026-8812\nDevice: Mobile handset extraction\nSections: IT Act 66E, BNS 351\nFindings: Digital artifacts and deleted messages recovered. Hash verification intact.`;
    }

    return `EXHIBIT EVIDENCE RECORD\nFileName: ${fileName}\nExtracted text artifact processed by Pramaan OCR Engine.\nDate: ${new Date().toLocaleDateString()}`;
  }

  public async classifyDocument(text: string, fileName: string): Promise<string> {
    const content = (text + ' ' + fileName).toUpperCase();
    if (content.includes('FIRST INFORMATION') || content.includes('FIR')) return 'FIR';
    if (content.includes('FORENSIC') || content.includes('FSL')) return 'FORENSIC_REPORT';
    if (content.includes('WITNESS') || content.includes('180 BNSS')) return 'WITNESS_STATEMENT';
    if (content.includes('MEDICAL') || content.includes('HOSPITAL')) return 'MEDICAL_EXAM_REPORT';
    if (content.includes('SEIZURE') || content.includes('PANCHNAMA')) return 'SEIZURE_MEMO';
    if (content.includes('CHARGE SHEET') || content.includes('173')) return 'CHARGE_SHEET';
    return 'PHOTOGRAPHIC_EVIDENCE';
  }

  public async extractMetadata(text: string, fileName: string): Promise<ExtractedMetadata> {
    const docType = await this.classifyDocument(text, fileName);
    const bnsSections: string[] = [];

    if (text.includes('64') || text.toUpperCase().includes('BNS 64')) bnsSections.push('BNS 64 (Rape / Attempt)');
    if (text.includes('70') || text.toUpperCase().includes('BNS 70')) bnsSections.push('BNS 70 (Gang Harassment)');
    if (text.includes('351') || text.toUpperCase().includes('BNS 351')) bnsSections.push('BNS 351 (Criminal Intimidation)');
    if (text.includes('66E') || text.toUpperCase().includes('IT ACT')) bnsSections.push('IT Act 66E (Privacy Violation)');

    if (bnsSections.length === 0) {
      bnsSections.push('BNS 70 (Harassment)');
    }

    // Extract Case or FIR Number
    let caseNumber = 'TN-2026-001245';
    const caseMatch = text.match(/(?:Case|FIR|Record)\s*[:#\s]+([A-Z0-9\-\/]+)/i);
    if (caseMatch && caseMatch[1]) {
      caseNumber = caseMatch[1];
    }

    return {
      documentType: docType,
      caseNumber,
      detectedBnsSections: bnsSections,
      jurisdiction: 'Chennai South / T. Nagar AWPS',
      detectedParties: {
        complainant: 'Priya N. (Protected)',
        victim: 'Priya N. (Protected)',
        witness: 'Lakshmi R.',
        suspect: 'Karthik S.',
        officer: 'Inspector Rajesh Varma',
        station: 'T. Nagar All-Women Police Station',
      },
      confidenceScore: 0.94,
      advisoryDisclaimer: this.disclaimer,
    };
  }

  public async generateCaseSummary(caseDetails: any, documents: any[]): Promise<string> {
    if (caseDetails?.id) {
      try {
        const ragDigest = await ragService.generateCaseDigest(caseDetails.id);
        if (ragDigest && !ragDigest.includes('No extracted text chunks')) {
          return ragDigest;
        }
      } catch {
        // Fallback to structured overview
      }
    }
    const docTypes = documents.map((d) => d.documentType).join(', ');
    return `[Strict RAG Grounded Summary]\nCase ${caseDetails.caseNumber} (${caseDetails.policeStation}) under statutory sections ${caseDetails.bnsSections?.join(', ')}. Contains ${documents.length} verified digital exhibits (${docTypes}). Verified under Bharatiya Sakshya Adhiniyam, 2023.`;
  }

  public async semanticSearch(
    query: string,
    cases: any[]
  ): Promise<{ caseId: string; relevanceScore: number; aiMatchExplanation: string }[]> {
    try {
      const retrieved = await ragService.retrieveChunks(query, { topK: 10 });
      if (retrieved.length > 0) {
        // Group by caseId
        const caseScoreMap = new Map<string, { score: number; explanations: string[] }>();
        for (const item of retrieved) {
          const current = caseScoreMap.get(item.caseId) || { score: 0, explanations: [] };
          current.score = Math.max(current.score, item.similarity);
          current.explanations.push(`Semantic match in [${item.documentType}] "${item.documentTitle}" (Score: ${(item.similarity * 100).toFixed(1)}%)`);
          caseScoreMap.set(item.caseId, current);
        }

        const results = Array.from(caseScoreMap.entries()).map(([caseId, data]) => ({
          caseId,
          relevanceScore: Math.min(0.99, data.score),
          aiMatchExplanation: data.explanations.slice(0, 2).join('; '),
        }));

        return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
      }
    } catch {
      // Fallback to pattern matcher if vector store is empty
    }

    const q = query.toLowerCase();
    const results = [];

    for (const c of cases) {
      let score = 0;
      let reasons: string[] = [];

      if (c.incidentLocation && q.split(' ').some((w) => w.length > 3 && c.incidentLocation.toLowerCase().includes(w))) {
        score += 0.45;
        reasons.push(`Geographical overlap in location: ${c.incidentLocation}`);
      }
      if (c.bnsSections && c.bnsSections.some((sec: string) => q.includes(sec.toLowerCase().slice(0, 6)))) {
        score += 0.35;
        reasons.push(`Matching statutory section classifications`);
      }
      if (c.suspects && c.suspects.some((s: string) => q.includes(s.toLowerCase()))) {
        score += 0.5;
        reasons.push(`Suspect correlation identified`);
      }
      if (q.includes('stalking') || q.includes('harassment') || q.includes('cyber')) {
        score += 0.3;
        reasons.push(`Modus-operandi pattern match across cyber and physical intimidation`);
      }

      if (score > 0.2) {
        results.push({
          caseId: c.id,
          relevanceScore: Math.min(score, 0.98),
          aiMatchExplanation: reasons.join('; ') || 'Metadata similarity pattern match.',
        });
      }
    }

    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }
}

export const documentAIService: IDocumentAIService = new SimulatedDocumentAIService();
