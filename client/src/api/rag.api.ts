import { BaseApiClient } from './client';

export interface RetrievedEvidenceChunk {
  id: string;
  chunkIndex: number;
  content: string;
  documentId: string;
  documentTitle: string;
  documentType: string;
  sha256Hash: string;
  caseId: string;
  caseNumber?: string;
  similarity: number;
}

export interface CitedEvidence {
  documentId: string;
  title: string;
  documentType: string;
  sha256Hash: string;
}

export interface RagQueryResponse {
  query: string;
  answer: string;
  isGrounded: boolean;
  retrievedChunks: RetrievedEvidenceChunk[];
  citedEvidence: CitedEvidence[];
  modelUsed: string;
  latencyMs: number;
  disclaimer: string;
}

export interface RagHealthResponse {
  status: 'READY' | 'DEGRADED' | 'OFFLINE';
  ollamaUrl: string;
  modelsAvailable: string[];
  hasLlm: boolean;
  hasEmbedder: boolean;
  message: string;
}

export class RagApi extends BaseApiClient {
  async queryEvidence(query: string, caseId?: string, topK?: number): Promise<RagQueryResponse> {
    const headers = await this.getAuthHeader();
    const res = await fetch(`${this.baseUrl}/ai/rag/query`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, caseId, topK }),
    });
    return this.handleResponse<RagQueryResponse>(res);
  }

  async getCaseDigest(caseId: string): Promise<{ caseId: string; digest: string; disclaimer: string }> {
    const headers = await this.getAuthHeader();
    const res = await fetch(`${this.baseUrl}/ai/rag/case-digest/${caseId}`, {
      method: 'POST',
      headers,
    });
    return this.handleResponse<{ caseId: string; digest: string; disclaimer: string }>(res);
  }

  async checkHealth(): Promise<RagHealthResponse> {
    const headers = await this.getAuthHeader();
    const res = await fetch(`${this.baseUrl}/ai/rag/health`, { headers });
    return this.handleResponse<RagHealthResponse>(res);
  }

  async reindexDocument(documentId: string): Promise<{ message: string; chunksCreated: number }> {
    const headers = await this.getAuthHeader();
    const res = await fetch(`${this.baseUrl}/ai/rag/index-document/${documentId}`, {
      method: 'POST',
      headers,
    });
    return this.handleResponse<{ message: string; chunksCreated: number }>(res);
  }
}

export const ragApi = new RagApi();
