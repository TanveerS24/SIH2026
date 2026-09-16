import { authApi } from './auth.api';
import { casesApi } from './cases.api';
import { documentsApi } from './documents.api';
import { custodyApi } from './custody.api';
import { workflowApi } from './workflow.api';
import { searchApi } from './search.api';
import { auditApi } from './audit.api';
import { analyticsApi } from './analytics.api';
import { accessApi } from './access.api';
import { syncApi } from './sync.api';

export * from './client';
export * from './auth.api';
export * from './cases.api';
export * from './documents.api';
export * from './custody.api';
export * from './workflow.api';
export * from './search.api';
export * from './audit.api';
export * from './analytics.api';
export * from './access.api';
export * from './sync.api';

export const api = {
  // Auth
  login: authApi.login.bind(authApi),
  register: authApi.register.bind(authApi),
  updateProfile: authApi.updateProfile.bind(authApi),
  mockLogin: authApi.mockLogin.bind(authApi),
  verifyMfa: authApi.verifyMfa.bind(authApi),
  logout: authApi.logout.bind(authApi),

  // Cases
  getCases: casesApi.getCases.bind(casesApi),
  getCaseById: casesApi.getCaseById.bind(casesApi),
  createCase: casesApi.createCase.bind(casesApi),
  getCaseRelationships: casesApi.getCaseRelationships.bind(casesApi),

  // Documents
  uploadDocument: documentsApi.uploadDocument.bind(documentsApi),
  getDocument: documentsApi.getDocument.bind(documentsApi),
  verifyDocument: documentsApi.verifyDocument.bind(documentsApi),
  simulateTamper: documentsApi.simulateTamper.bind(documentsApi),

  // Custody
  getCustodyTimeline: custodyApi.getCustodyTimeline.bind(custodyApi),

  // Workflow
  getWorkflowStatus: workflowApi.getWorkflowStatus.bind(workflowApi),
  satisfyWorkflowRequirement: workflowApi.satisfyWorkflowRequirement.bind(workflowApi),
  fileChargeSheet: workflowApi.fileChargeSheet.bind(workflowApi),

  // Search
  search: searchApi.search.bind(searchApi),

  // Audit
  getAuditLogs: auditApi.getAuditLogs.bind(auditApi),

  // Analytics
  getAnalytics: analyticsApi.getAnalytics.bind(analyticsApi),

  // Access Requests
  getAccessRequests: accessApi.getAccessRequests.bind(accessApi),
  createAccessRequest: accessApi.createAccessRequest.bind(accessApi),
  reviewAccessRequest: accessApi.reviewAccessRequest.bind(accessApi),

  // Offline Sync
  syncBatch: syncApi.syncBatch.bind(syncApi),
};
