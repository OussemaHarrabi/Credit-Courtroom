import { z } from 'zod';

// ============================================
// Enums and Constants
// ============================================

export const CaseStatus = {
  DRAFT: 'draft',
  READY: 'ready',
  RUNNING: 'running',
  DECIDED: 'decided',
  FAILED: 'failed',
} as const;

export const DocumentStatus = {
  UPLOADED: 'uploaded',
  PARSING: 'parsing',
  EXTRACTED: 'extracted',
  ERROR: 'error',
} as const;

export const DebateStage = {
  OPENING: 'opening',
  REBUTTAL: 'rebuttal',
  COUNTER: 'counter',
  FINAL: 'final',
  VERDICT: 'verdict',
  DONE: 'done',
} as const;

export const DebateRole = {
  RISK: 'RISK',
  ADVOCATE: 'ADVOCATE',
  MODERATOR: 'MODERATOR',
  JUDGE: 'JUDGE',
} as const;

export const Verdict = {
  APPROVE: 'approve',
  REJECT: 'reject',
  MANUAL_REVIEW: 'manual_review',
} as const;

export const AuditEventType = {
  CREATED_CASE: 'created_case',
  UPDATED_APPLICANT: 'updated_applicant',
  UPLOADED_DOCS: 'uploaded_docs',
  RETRIEVED_NEIGHBORS: 'retrieved_neighbors',
  DEBATE_STARTED: 'debate_started',
  DEBATE_MESSAGE: 'debate_message',
  JUDGE_DECISION: 'judge_decision',
  EXPORTED_REPORT: 'exported_report',
} as const;

export const PolicyType = {
  ELIGIBILITY: 'eligibility',
  RISK_THRESHOLD: 'risk_threshold',
  REGULATORY: 'regulatory',
  MANUAL_REVIEW: 'manual_review',
} as const;

// ============================================
// Zod Schemas
// ============================================

export const ApplicantPayloadSchema = z.object({
  age: z.number().min(18).max(100),
  annual_income: z.number().min(0),
  credit_score: z.number().min(300).max(850),
  loan_amount: z.number().min(0),
  loan_term: z.number().min(12).max(360),
  interest_rate: z.number().min(0).max(30),
  debt_to_income_ratio: z.number().min(0).max(100),
  employment_status: z.enum(['Employed', 'Self-employed', 'Unemployed', 'Retired', 'Student']),
  education_level: z.enum(["High School", "Associate's", "Bachelor's", "Master's", "Doctorate"]),
  loan_purpose: z.enum(['Car', 'Home', 'Education', 'Medical', 'Business', 'Debt Consolidation', 'Personal', 'Other']),
  marital_status: z.enum(['Single', 'Married', 'Divorced', 'Widowed']),
  gender: z.enum(['Male', 'Female', 'Other']),
  delinquency_history: z.number().min(0),
  public_records: z.number().min(0),
  num_of_open_accounts: z.number().min(0),
  num_of_credit_inquiries: z.number().min(0),
  residence_type: z.enum(['Rent', 'Own', 'Mortgage', 'Other']),
  years_at_current_residence: z.number().min(0),
  years_at_current_job: z.number().min(0),
});

export const DocumentSchema = z.object({
  document_id: z.string(),
  case_id: z.string(),
  filename: z.string(),
  content_type: z.string(),
  status: z.enum(['uploaded', 'parsing', 'extracted', 'error']),
  extracted_fields: z.record(z.string(), z.unknown()).nullable(),
  created_at: z.string(),
  size: z.number().optional(),
});

export const NeighborCaseSchema = z.object({
  neighbor_id: z.string(),
  similarity: z.number().min(0).max(1),
  outcome: z.enum(['repaid', 'default']),
  highlights: z.array(z.string()),
  payload_preview: z.record(z.string(), z.unknown()),
});

export const RetrievalSummarySchema = z.object({
  top_k: z.number(),
  neighbors: z.array(NeighborCaseSchema),
  stats: z.object({
    default_rate: z.number(),
    average_credit_score: z.number(),
    median_income: z.number(),
    total_neighbors: z.number(),
  }),
});

export const DebateMessageSchema = z.object({
  role: z.enum(['RISK', 'ADVOCATE', 'MODERATOR', 'JUDGE']),
  content: z.string(),
  timestamp: z.string(),
  stage: z.enum(['opening', 'rebuttal', 'counter', 'final', 'verdict', 'done']),
});

export const DebateRunSchema = z.object({
  run_id: z.string(),
  stage: z.enum(['opening', 'rebuttal', 'counter', 'final', 'verdict', 'done']),
  messages: z.array(DebateMessageSchema),
  started_at: z.string(),
  updated_at: z.string(),
});

// ============================================
// Fraud Signals Schema (Neo4j Graph Layer)
// ============================================

export const FraudSignalsSchema = z.object({
  shared_device_count: z.number().min(0),
  shared_ip_count: z.number().min(0),
  shared_merchant_count: z.number().min(0),
  known_fraud_neighbor_count: z.number().min(0),
  fraud_cluster_score: z.number().min(0).max(1),
  fraud_flags: z.array(z.string()),
  computed_at: z.string(),
});

// ============================================
// Policy Schema (Policy-Aware RAG)
// ============================================

export const PolicyClauseSchema = z.object({
  clause_id: z.string(),
  policy_id: z.string(),
  section: z.string(),
  text: z.string(),
  policy_type: z.enum(['eligibility', 'risk_threshold', 'regulatory', 'manual_review']),
  document_name: z.string(),
  version: z.string(),
});

export const PolicySchema = z.object({
  policy_id: z.string(),
  name: z.string(),
  document_type: z.enum(['eligibility', 'risk_threshold', 'regulatory', 'manual_review']),
  filename: z.string(),
  version: z.string(),
  uploaded_at: z.string(),
  clauses_count: z.number(),
  status: z.enum(['active', 'archived']),
});

export const PolicyReferenceSchema = z.object({
  policy_id: z.string(),
  clause: PolicyClauseSchema,
  rationale: z.string(),
});

export const DecisionSchema = z.object({
  verdict: z.enum(['approve', 'reject', 'manual_review']),
  justification: z.array(z.string()),
  evidence_refs: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  policy_refs: z.array(PolicyReferenceSchema).optional(),
});

export const CaseSchema = z.object({
  case_id: z.string(),
  status: z.enum(['draft', 'ready', 'running', 'decided', 'failed']),
  created_at: z.string(),
  updated_at: z.string(),
  applicant: ApplicantPayloadSchema.nullable(),
  documents: z.array(DocumentSchema),
  retrieval: RetrievalSummarySchema.nullable(),
  debate: DebateRunSchema.nullable(),
  decision: DecisionSchema.nullable(),
  fraud_signals: FraudSignalsSchema.nullable(),
});

export const AuditEventSchema = z.object({
  event_id: z.string(),
  case_id: z.string(),
  event_type: z.enum([
    'created_case',
    'updated_applicant',
    'uploaded_docs',
    'retrieved_neighbors',
    'debate_started',
    'debate_message',
    'judge_decision',
    'exported_report',
  ]),
  timestamp: z.string(),
  metadata: z.record(z.string(), z.unknown()),
});

// ============================================
// TypeScript Types
// ============================================

export type ApplicantPayload = z.infer<typeof ApplicantPayloadSchema>;
export type Document = z.infer<typeof DocumentSchema>;
export type NeighborCase = z.infer<typeof NeighborCaseSchema>;
export type RetrievalSummary = z.infer<typeof RetrievalSummarySchema>;
export type DebateMessage = z.infer<typeof DebateMessageSchema>;
export type DebateRun = z.infer<typeof DebateRunSchema>;
export type Decision = z.infer<typeof DecisionSchema>;
export type Case = z.infer<typeof CaseSchema>;
export type AuditEvent = z.infer<typeof AuditEventSchema>;
export type FraudSignals = z.infer<typeof FraudSignalsSchema>;
export type Policy = z.infer<typeof PolicySchema>;
export type PolicyClause = z.infer<typeof PolicyClauseSchema>;
export type PolicyReference = z.infer<typeof PolicyReferenceSchema>;

export type CaseStatusType = typeof CaseStatus[keyof typeof CaseStatus];
export type DocumentStatusType = typeof DocumentStatus[keyof typeof DocumentStatus];
export type DebateStageType = typeof DebateStage[keyof typeof DebateStage];
export type DebateRoleType = typeof DebateRole[keyof typeof DebateRole];
export type VerdictType = typeof Verdict[keyof typeof Verdict];
export type AuditEventTypeType = typeof AuditEventType[keyof typeof AuditEventType];
export type PolicyTypeType = typeof PolicyType[keyof typeof PolicyType];

// ============================================
// API Request/Response Types
// ============================================

export interface CreateCaseRequest {
  applicant?: Partial<ApplicantPayload>;
}

export interface CreateCaseResponse {
  case: Case;
}

export interface ListCasesRequest {
  query?: string;
  status?: CaseStatusType;
  limit?: number;
  offset?: number;
}

export interface ListCasesResponse {
  items: Case[];
  total: number;
}

export interface GetCaseResponse {
  case: Case;
}

export interface UpdateApplicantRequest {
  [key: string]: any;
}

export interface UpdateApplicantResponse {
  case: Case;
}

export interface UploadDocumentResponse {
  document: Document;
}

export interface ListDocumentsResponse {
  items: Document[];
}

export interface StartDebateRequest {
  top_k?: number;
  mode?: 'standard' | 'adversarial';
}

export interface StartDebateResponse {
  run_id: string;
  status: string;
  case_id: string;
}

export interface GetRunStatusResponse {
  run_id: string;
  case_id: string;
  status: string;
  stage: DebateStageType;
  progress: number;
}

export interface GetTranscriptResponse {
  messages: DebateMessage[];
  stage: DebateStageType;
  updated_at: string;
}

export interface GetDecisionResponse {
  decision: Decision;
  retrieval: RetrievalSummary;
}

// ============================================
// Fraud Signals API Types
// ============================================

export interface GetFraudSignalsResponse {
  fraud_signals: FraudSignals;
}

// ============================================
// Policy API Types
// ============================================

export interface UploadPolicyRequest {
  name: string;
  document_type: PolicyTypeType;
}

export interface UploadPolicyResponse {
  policy: Policy;
}

export interface ListPoliciesResponse {
  items: Policy[];
  total: number;
}

export interface GetPolicyResponse {
  policy: Policy;
}

export interface GetPolicyEvidenceResponse {
  clauses: PolicyClause[];
}

// ============================================
// UI Types
// ============================================

export interface DashboardStats {
  total_cases: number;
  approvals: number;
  rejects: number;
  manual_reviews: number;
  draft_cases: number;
  running_cases: number;
}

export interface CaseListItem {
  case_id: string;
  applicant_name: string;
  loan_amount: number;
  status: CaseStatusType;
  verdict: VerdictType | null;
  updated_at: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
}

export interface Settings {
  api_base_url: string;
  use_mock_backend: boolean;
  theme: 'light' | 'dark' | 'system';
  environment: 'local' | 'demo' | 'production';
}
