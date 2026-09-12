import { BaseApiClient } from './client';
import { CaseWorkflowStatus, FileChargeSheetRequest } from '@pramaan/shared-types';

export class WorkflowApi extends BaseApiClient {
  async getWorkflowStatus(caseId: string): Promise<CaseWorkflowStatus> {
    const headers = await this.getAuthHeader();
    const res = await fetch(`${this.baseUrl}/cases/${caseId}/workflow`, { headers });
    return this.handleResponse<CaseWorkflowStatus>(res);
  }

  async satisfyWorkflowRequirement(caseId: string, requirementId: string, notes?: string): Promise<any> {
    const headers = await this.getAuthHeader();
    const res = await fetch(`${this.baseUrl}/cases/${caseId}/workflow/satisfy`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ requirementId, notes }),
    });
    return this.handleResponse<any>(res);
  }

  async fileChargeSheet(caseId: string, payload: FileChargeSheetRequest): Promise<any> {
    const headers = await this.getAuthHeader();
    const res = await fetch(`${this.baseUrl}/cases/${caseId}/file`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return this.handleResponse<any>(res);
  }
}

export const workflowApi = new WorkflowApi();
