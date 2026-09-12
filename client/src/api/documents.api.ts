import { BaseApiClient } from './client';
import { DocumentSummary, VerifyDocumentResponse } from '@pramaan/shared-types';

export class DocumentsApi extends BaseApiClient {
  async uploadDocument(payload: {
    caseId: string;
    title: string;
    fileName: string;
    documentType: string;
    mimeType: string;
    fileBase64?: string;
    fileDataUri?: string;
  }): Promise<DocumentSummary> {
    const headers = await this.getAuthHeader();
    const res = await fetch(`${this.baseUrl}/documents/upload`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return this.handleResponse<DocumentSummary>(res);
  }

  async getDocument(id: string): Promise<DocumentSummary> {
    const headers = await this.getAuthHeader();
    const res = await fetch(`${this.baseUrl}/documents/${id}`, { headers });
    return this.handleResponse<DocumentSummary>(res);
  }

  async verifyDocument(id: string): Promise<VerifyDocumentResponse> {
    const headers = await this.getAuthHeader();
    const res = await fetch(`${this.baseUrl}/documents/${id}/verify`, {
      method: 'POST',
      headers,
    });
    return this.handleResponse<VerifyDocumentResponse>(res);
  }

  async simulateTamper(id: string): Promise<any> {
    const headers = await this.getAuthHeader();
    const res = await fetch(`${this.baseUrl}/documents/${id}/simulate-tamper`, {
      method: 'POST',
      headers,
    });
    return this.handleResponse<any>(res);
  }
}

export const documentsApi = new DocumentsApi();
