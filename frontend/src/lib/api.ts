import { mockDataStore } from './mockData';
import type {
  AuditEvent,
  DashboardStats,
  CreateCaseRequest,
  CreateCaseResponse,
  ListCasesResponse,
  GetCaseResponse,
  UpdateApplicantRequest,
  UpdateApplicantResponse,
  UploadDocumentResponse,
  ListDocumentsResponse,
  StartDebateRequest,
  StartDebateResponse,
  GetRunStatusResponse,
  GetTranscriptResponse,
  GetDecisionResponse,
  CaseStatusType,
  Policy,
  PolicyClause,
} from '@/types';

// ============================================
// Configuration
// ============================================

const API_CONFIG = {
  baseUrl: '/api/v1',
  useMock: false,
  timeout: 30000,
};

export function configureApi(options: { baseUrl?: string; useMock?: boolean }) {
  if (options.baseUrl) API_CONFIG.baseUrl = options.baseUrl;
  if (options.useMock !== undefined) API_CONFIG.useMock = options.useMock;
}

// ============================================
// Helper Functions
// ============================================

async function mockDelay(ms: number = 300): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (API_CONFIG.useMock) {
    throw new Error('Mock mode is enabled. Use mock API functions instead.');
  }

  const url = `${API_CONFIG.baseUrl}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// ============================================
// Cases API
// ============================================

export async function createCase(request: CreateCaseRequest = {}): Promise<CreateCaseResponse> {
  if (API_CONFIG.useMock) {
    await mockDelay(500);
    const case_ = mockDataStore.createCase(request);
    return { case: case_ };
  }

  return apiRequest<CreateCaseResponse>('/cases', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function listCases(
  query?: string,
  status?: CaseStatusType,
  limit: number = 20,
  offset: number = 0
): Promise<ListCasesResponse> {
  if (API_CONFIG.useMock) {
    await mockDelay(300);
    let items = mockDataStore.getCases();
    
    if (query) {
      const lowerQuery = query.toLowerCase();
      items = items.filter(c => 
        c.case_id.toLowerCase().includes(lowerQuery) ||
        c.applicant?.loan_purpose.toLowerCase().includes(lowerQuery)
      );
    }
    
    if (status) {
      items = items.filter(c => c.status === status);
    }
    
    const total = items.length;
    items = items.slice(offset, offset + limit);
    
    return { items, total };
  }

  const params = new URLSearchParams();
  if (query) params.set('query', query);
  if (status) params.set('status', status);
  params.set('limit', limit.toString());
  params.set('offset', offset.toString());

  return apiRequest<ListCasesResponse>(`/cases?${params.toString()}`);
}

export async function getCase(caseId: string): Promise<GetCaseResponse> {
  if (API_CONFIG.useMock) {
    await mockDelay(300);
    const case_ = mockDataStore.getCase(caseId);
    if (!case_) {
      throw new Error(`Case not found: ${caseId}`);
    }
    return { case: case_ };
  }

  return apiRequest<GetCaseResponse>(`/cases/${caseId}`);
}

export async function updateApplicant(
  caseId: string,
  request: UpdateApplicantRequest
): Promise<UpdateApplicantResponse> {
  if (API_CONFIG.useMock) {
    await mockDelay(400);
    const updatedCase = mockDataStore.updateApplicant(caseId, request);
    if (!updatedCase) {
      throw new Error(`Case not found: ${caseId}`);
    }
    return { case: updatedCase };
  }

  return apiRequest<UpdateApplicantResponse>(`/cases/${caseId}/applicant`, {
    method: 'PATCH',
    body: JSON.stringify(request),
  });
}

// ============================================
// Documents API
// ============================================

export async function uploadDocument(
  caseId: string,
  file: File
): Promise<UploadDocumentResponse> {
  if (API_CONFIG.useMock) {
    await mockDelay(800);
    const document = mockDataStore.addDocument(caseId, file);
    return { document };
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_CONFIG.baseUrl}/cases/${caseId}/documents`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return response.json();
}

export async function listDocuments(caseId: string): Promise<ListDocumentsResponse> {
  if (API_CONFIG.useMock) {
    await mockDelay(300);
    const items = mockDataStore.getDocuments(caseId);
    return { items };
  }

  return apiRequest<ListDocumentsResponse>(`/cases/${caseId}/documents`);
}

// ============================================
// Debate API
// ============================================

export async function startDebate(
  caseId: string,
  request: StartDebateRequest = {}
): Promise<StartDebateResponse> {
  if (API_CONFIG.useMock) {
    await mockDelay(600);
    const runId = mockDataStore.startDebate(caseId, request.top_k || 8);
    return {
      run_id: runId,
      status: 'running',
      case_id: caseId,
    };
  }

  return apiRequest<StartDebateResponse>(`/cases/${caseId}/run`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function getRunStatus(runId: string): Promise<GetRunStatusResponse> {
  if (API_CONFIG.useMock) {
    await mockDelay(200);
    const run = mockDataStore.getRun(runId);
    if (!run) {
      throw new Error(`Run not found: ${runId}`);
    }

    const stageProgress: Record<string, number> = {
      opening: 20,
      rebuttal: 40,
      counter: 60,
      final: 80,
      verdict: 90,
      done: 100,
    };

    const case_ = Array.from(mockDataStore['cases'].values()).find(
      c => c.debate?.run_id === runId
    );

    return {
      run_id: runId,
      case_id: case_?.case_id || '',
      status: run.stage === 'done' ? 'decided' : 'running',
      stage: run.stage,
      progress: stageProgress[run.stage] || 0,
    };
  }

  return apiRequest<GetRunStatusResponse>(`/runs/${runId}/status`);
}

export async function getTranscript(runId: string): Promise<GetTranscriptResponse> {
  if (API_CONFIG.useMock) {
    await mockDelay(300);
    const run = mockDataStore.getRun(runId);
    if (!run) {
      throw new Error(`Run not found: ${runId}`);
    }
    return {
      messages: run.messages,
      stage: run.stage,
      updated_at: run.updated_at,
    };
  }

  return apiRequest<GetTranscriptResponse>(`/runs/${runId}/transcript`);
}

export async function getDecision(runId: string): Promise<GetDecisionResponse> {
  if (API_CONFIG.useMock) {
    await mockDelay(300);
    const run = mockDataStore.getRun(runId);
    if (!run) {
      throw new Error(`Run not found: ${runId}`);
    }

    const case_ = Array.from(mockDataStore['cases'].values()).find(
      c => c.debate?.run_id === runId
    );

    if (!case_?.decision || !case_.retrieval) {
      throw new Error('Decision not ready');
    }

    return {
      decision: case_.decision,
      retrieval: case_.retrieval,
    };
  }

  return apiRequest<GetDecisionResponse>(`/runs/${runId}/decision`);
}

// ============================================
// Audit API
// ============================================

export async function getAuditEvents(caseId: string): Promise<AuditEvent[]> {
  if (API_CONFIG.useMock) {
    await mockDelay(300);
    return mockDataStore.getAuditEvents(caseId);
  }

  return apiRequest<AuditEvent[]>(`/cases/${caseId}/audit`);
}

// ============================================
// Dashboard API
// ============================================

export async function getDashboardStats(): Promise<DashboardStats> {
  if (API_CONFIG.useMock) {
    await mockDelay(300);
    return mockDataStore.getStats();
  }

  return apiRequest<DashboardStats>('/dashboard/stats');
}

// ============================================
// Export API
// ============================================

export async function exportReport(caseId: string): Promise<Blob> {
  if (API_CONFIG.useMock) {
    await mockDelay(1000);
    const content = `Credit Courtroom Report - Case ${caseId}\n\nGenerated: ${new Date().toISOString()}\n\nThis is a mock PDF export.`;
    return new Blob([content], { type: 'application/pdf' });
  }

  const response = await fetch(`${API_CONFIG.baseUrl}/cases/${caseId}/export.pdf`);
  if (!response.ok) {
    throw new Error(`Export failed: ${response.statusText}`);
  }
  return response.blob();
}

// ============================================
// Real-time Updates (Polling)
// ============================================

export function pollRunStatus(
  runId: string,
  onUpdate: (status: GetRunStatusResponse) => void,
  onError: (error: Error) => void,
  interval: number = 2000
): () => void {
  let isActive = true;

  const poll = async () => {
    if (!isActive) return;

    try {
      const status = await getRunStatus(runId);
      onUpdate(status);

      // Stop polling on terminal states
      if (status.status === 'decided' || status.status === 'failed') {
        return;
      }

      if (isActive) {
        setTimeout(poll, interval);
      }
    } catch (error) {
      onError(error instanceof Error ? error : new Error(String(error)));
      if (isActive) {
        setTimeout(poll, interval);
      }
    }
  };

  poll();

  return () => {
    isActive = false;
  };
}

export function pollTranscript(
  runId: string,
  onUpdate: (transcript: GetTranscriptResponse) => void,
  onError: (error: Error) => void,
  interval: number = 1500
): () => void {
  let isActive = true;
  let lastMessageCount = 0;

  const poll = async () => {
    if (!isActive) return;

    try {
      const transcript = await getTranscript(runId);
      
      if (transcript.messages.length !== lastMessageCount) {
        lastMessageCount = transcript.messages.length;
        onUpdate(transcript);
      }

      if (transcript.stage !== 'done') {
        setTimeout(poll, interval);
      }
    } catch (error) {
      onError(error instanceof Error ? error : new Error(String(error)));
      if (isActive) {
        setTimeout(poll, interval);
      }
    }
  };

  poll();

  return () => {
    isActive = false;
  };
}

// ============================================
// Fraud Signals API (Neo4j Graph Layer)
// ============================================

export async function getFraudSignals(caseId: string): Promise<{ fraud_signals: import('@/types').FraudSignals }> {
  if (API_CONFIG.useMock) {
    await mockDelay(400);
    let signals = mockDataStore.getFraudSignals(caseId);
    if (!signals) {
      signals = mockDataStore.computeFraudSignals(caseId);
    }
    return { fraud_signals: signals };
  }

  return apiRequest<{ fraud_signals: import('@/types').FraudSignals }>(`/cases/${caseId}/fraud-signals`);
}

// ============================================
// Policy API (Policy-Aware RAG)
// ============================================

export async function listPolicies(): Promise<{ items: Policy[]; total: number }> {
  if (API_CONFIG.useMock) {
    await mockDelay(300);
    const items = mockDataStore.getPolicies();
    return { items, total: items.length };
  }

  return apiRequest<{ items: Policy[]; total: number }>('/policies');
}

export async function getPolicy(policyId: string): Promise<{ policy: Policy }> {
  if (API_CONFIG.useMock) {
    await mockDelay(300);
    const policy = mockDataStore.getPolicy(policyId);
    if (!policy) {
      throw new Error(`Policy not found: ${policyId}`);
    }
    return { policy };
  }

  return apiRequest<{ policy: Policy }>(`/policies/${policyId}`);
}

export async function uploadPolicy(
  file: File,
  name: string,
  documentType: Policy['document_type']
): Promise<Policy> {
  if (API_CONFIG.useMock) {
    await mockDelay(1000);
    return mockDataStore.uploadPolicy(name, documentType, file.name);
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', name);
  formData.append('document_type', documentType);

  const response = await fetch(`${API_CONFIG.baseUrl}/policies/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return response.json();
}

export async function getPolicyEvidence(caseId: string): Promise<{ clauses: PolicyClause[] }> {
  if (API_CONFIG.useMock) {
    await mockDelay(300);
    const clauses = mockDataStore.getPolicyEvidence(caseId);
    return { clauses };
  }

  return apiRequest<{ clauses: PolicyClause[] }>(`/cases/${caseId}/policy-evidence`);
}
