import type {
  Case,
  Document,
  DebateMessage,
  DebateRun,
  Decision,
  RetrievalSummary,
  NeighborCase,
  AuditEvent,
  DashboardStats,
  ApplicantPayload,
  FraudSignals,
  Policy,
  PolicyClause,
} from '@/types';

// ============================================
// Helper Functions
// ============================================

const generateId = (prefix: string) => `${prefix}_${Math.random().toString(36).substr(2, 9)}`;

const generateTimestamp = (daysAgo: number = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};

// ============================================
// Mock Applicants
// ============================================

export const mockApplicants: ApplicantPayload[] = [
  {
    age: 32,
    annual_income: 75000,
    credit_score: 720,
    loan_amount: 25000,
    loan_term: 60,
    interest_rate: 8.5,
    debt_to_income_ratio: 28,
    employment_status: 'Employed',
    education_level: "Bachelor's",
    loan_purpose: 'Home',
    marital_status: 'Married',
    gender: 'Male',
    delinquency_history: 0,
    public_records: 0,
    num_of_open_accounts: 5,
    num_of_credit_inquiries: 1,
    residence_type: 'Mortgage',
    years_at_current_residence: 3,
    years_at_current_job: 5,
  },
  {
    age: 28,
    annual_income: 45000,
    credit_score: 640,
    loan_amount: 15000,
    loan_term: 48,
    interest_rate: 12.5,
    debt_to_income_ratio: 42,
    employment_status: 'Employed',
    education_level: "Associate's",
    loan_purpose: 'Car',
    marital_status: 'Single',
    gender: 'Female',
    delinquency_history: 2,
    public_records: 0,
    num_of_open_accounts: 3,
    num_of_credit_inquiries: 3,
    residence_type: 'Rent',
    years_at_current_residence: 1,
    years_at_current_job: 2,
  },
  {
    age: 45,
    annual_income: 120000,
    credit_score: 780,
    loan_amount: 50000,
    loan_term: 84,
    interest_rate: 6.5,
    debt_to_income_ratio: 18,
    employment_status: 'Self-employed',
    education_level: "Master's",
    loan_purpose: 'Business',
    marital_status: 'Married',
    gender: 'Male',
    delinquency_history: 0,
    public_records: 0,
    num_of_open_accounts: 8,
    num_of_credit_inquiries: 0,
    residence_type: 'Own',
    years_at_current_residence: 10,
    years_at_current_job: 15,
  },
  {
    age: 24,
    annual_income: 38000,
    credit_score: 580,
    loan_amount: 10000,
    loan_term: 36,
    interest_rate: 15.9,
    debt_to_income_ratio: 55,
    employment_status: 'Employed',
    education_level: "High School",
    loan_purpose: 'Personal',
    marital_status: 'Single',
    gender: 'Female',
    delinquency_history: 3,
    public_records: 1,
    num_of_open_accounts: 2,
    num_of_credit_inquiries: 5,
    residence_type: 'Rent',
    years_at_current_residence: 0,
    years_at_current_job: 1,
  },
  {
    age: 52,
    annual_income: 95000,
    credit_score: 750,
    loan_amount: 35000,
    loan_term: 72,
    interest_rate: 7.2,
    debt_to_income_ratio: 22,
    employment_status: 'Employed',
    education_level: "Bachelor's",
    loan_purpose: 'Debt Consolidation',
    marital_status: 'Divorced',
    gender: 'Female',
    delinquency_history: 1,
    public_records: 0,
    num_of_open_accounts: 6,
    num_of_credit_inquiries: 1,
    residence_type: 'Mortgage',
    years_at_current_residence: 7,
    years_at_current_job: 12,
  },
];

// ============================================
// Mock Fraud Signals (Neo4j Graph Layer)
// ============================================

export const createMockFraudSignals = (riskLevel: 'low' | 'medium' | 'high' = 'low'): FraudSignals => {
  const configs = {
    low: {
      shared_device_count: 0,
      shared_ip_count: 1,
      shared_merchant_count: 2,
      known_fraud_neighbor_count: 0,
      fraud_cluster_score: 0.12,
      fraud_flags: [],
    },
    medium: {
      shared_device_count: 1,
      shared_ip_count: 2,
      shared_merchant_count: 3,
      known_fraud_neighbor_count: 1,
      fraud_cluster_score: 0.45,
      fraud_flags: ['shared_ip_with_1_defaulter'],
    },
    high: {
      shared_device_count: 3,
      shared_ip_count: 4,
      shared_merchant_count: 5,
      known_fraud_neighbor_count: 3,
      fraud_cluster_score: 0.74,
      fraud_flags: ['shared_device_with_3_defaulters', 'shared_ip_with_2_defaulters', 'high_fraud_cluster_score'],
    },
  };

  const config = configs[riskLevel];
  return {
    ...config,
    computed_at: generateTimestamp(0),
  };
};

// ============================================
// Mock Policies (Policy-Aware RAG)
// ============================================

export const mockPolicies: Policy[] = [
  {
    policy_id: 'policy_001',
    name: 'Credit Score Eligibility Policy',
    document_type: 'eligibility',
    filename: 'credit_score_policy_v2.pdf',
    version: 'v2.0',
    uploaded_at: generateTimestamp(30),
    clauses_count: 12,
    status: 'active',
  },
  {
    policy_id: 'policy_002',
    name: 'Debt-to-Income Risk Thresholds',
    document_type: 'risk_threshold',
    filename: 'dti_thresholds_v1.pdf',
    version: 'v1.0',
    uploaded_at: generateTimestamp(60),
    clauses_count: 8,
    status: 'active',
  },
  {
    policy_id: 'policy_003',
    name: 'Fair Lending Compliance Guide',
    document_type: 'regulatory',
    filename: 'fair_lending_compliance_v3.pdf',
    version: 'v3.0',
    uploaded_at: generateTimestamp(15),
    clauses_count: 24,
    status: 'active',
  },
  {
    policy_id: 'policy_004',
    name: 'Manual Review Conditions',
    document_type: 'manual_review',
    filename: 'manual_review_conditions_v1.pdf',
    version: 'v1.0',
    uploaded_at: generateTimestamp(45),
    clauses_count: 15,
    status: 'active',
  },
];

export const mockPolicyClauses: PolicyClause[] = [
  {
    clause_id: 'clause_001',
    policy_id: 'policy_001',
    section: '3.2',
    text: 'Applicants with credit scores below 600 require enhanced review and may be subject to automatic rejection if additional risk factors are present.',
    policy_type: 'eligibility',
    document_name: 'Credit Score Eligibility Policy',
    version: 'v2.0',
  },
  {
    clause_id: 'clause_002',
    policy_id: 'policy_002',
    section: '2.1',
    text: 'Debt-to-income ratios exceeding 40% trigger mandatory manual review unless compensated by exceptional factors.',
    policy_type: 'risk_threshold',
    document_name: 'Debt-to-Income Risk Thresholds',
    version: 'v1.0',
  },
  {
    clause_id: 'clause_003',
    policy_id: 'policy_003',
    section: '4.5',
    text: 'All lending decisions must be explainable and free from discriminatory bias based on protected characteristics.',
    policy_type: 'regulatory',
    document_name: 'Fair Lending Compliance Guide',
    version: 'v3.0',
  },
  {
    clause_id: 'clause_004',
    policy_id: 'policy_004',
    section: '1.3',
    text: 'Cases with mixed evidence or confidence scores between 0.6 and 0.8 should be flagged for manual review.',
    policy_type: 'manual_review',
    document_name: 'Manual Review Conditions',
    version: 'v1.0',
  },
];

// ============================================
// Mock Documents
// ============================================

export const createMockDocuments = (caseId: string): Document[] => [
  {
    document_id: generateId('doc'),
    case_id: caseId,
    filename: 'paystub_jan2024.pdf',
    content_type: 'application/pdf',
    status: 'extracted',
    extracted_fields: { income_verified: true },
    created_at: generateTimestamp(2),
    size: 245760,
  },
  {
    document_id: generateId('doc'),
    case_id: caseId,
    filename: 'bank_statement_q4.pdf',
    content_type: 'application/pdf',
    status: 'extracted',
    extracted_fields: { balance_avg: 15000 },
    created_at: generateTimestamp(1),
    size: 512000,
  },
  {
    document_id: generateId('doc'),
    case_id: caseId,
    filename: 'id_verification.jpg',
    content_type: 'image/jpeg',
    status: 'extracted',
    extracted_fields: { id_verified: true },
    created_at: generateTimestamp(1),
    size: 102400,
  },
];

// ============================================
// Mock Neighbors
// ============================================

export const createMockNeighbors = (): NeighborCase[] => [
  {
    neighbor_id: 'neighbor_1',
    similarity: 0.92,
    outcome: 'repaid',
    highlights: ['Similar credit score', 'Same employment status', 'Comparable income'],
    payload_preview: { age: 33, credit_score: 715, annual_income: 72000 },
  },
  {
    neighbor_id: 'neighbor_2',
    similarity: 0.88,
    outcome: 'repaid',
    highlights: ['Same loan purpose', 'Similar debt-to-income'],
    payload_preview: { age: 30, credit_score: 705, annual_income: 68000 },
  },
  {
    neighbor_id: 'neighbor_3',
    similarity: 0.85,
    outcome: 'default',
    highlights: ['Similar age', 'Higher delinquency history'],
    payload_preview: { age: 31, credit_score: 625, annual_income: 48000 },
  },
  {
    neighbor_id: 'neighbor_4',
    similarity: 0.81,
    outcome: 'repaid',
    highlights: ['Same education level', 'Stable employment'],
    payload_preview: { age: 35, credit_score: 735, annual_income: 80000 },
  },
  {
    neighbor_id: 'neighbor_5',
    similarity: 0.78,
    outcome: 'default',
    highlights: ['Recent credit inquiries', 'Shorter job tenure'],
    payload_preview: { age: 27, credit_score: 595, annual_income: 42000 },
  },
  {
    neighbor_id: 'neighbor_6',
    similarity: 0.75,
    outcome: 'repaid',
    highlights: ['Low debt-to-income', 'No delinquencies'],
    payload_preview: { age: 40, credit_score: 760, annual_income: 90000 },
  },
];

// ============================================
// Mock Retrieval Summary
// ============================================

export const createMockRetrievalSummary = (): RetrievalSummary => {
  const neighbors = createMockNeighbors();
  const defaults = neighbors.filter(n => n.outcome === 'default').length;
  return {
    top_k: 6,
    neighbors,
    stats: {
      default_rate: Math.round((defaults / neighbors.length) * 100),
      average_credit_score: Math.round(
        neighbors.reduce((sum, n) => sum + ((n.payload_preview.credit_score as number) || 0), 0) / neighbors.length
      ),
      median_income: Math.round(
        neighbors.reduce((sum, n) => sum + ((n.payload_preview.annual_income as number) || 0), 0) / neighbors.length
      ),
      total_neighbors: neighbors.length,
    },
  };
};

// ============================================
// Mock Debate Messages
// ============================================

export const createMockDebateMessages = (): DebateMessage[] => [
  {
    role: 'MODERATOR',
    content: 'The court is now in session. We will evaluate loan application CASE-001. Risk Agent, please present your opening argument.',
    timestamp: generateTimestamp(0),
    stage: 'opening',
  },
  {
    role: 'RISK',
    content: 'Your Honor, I must argue for REJECTION of this application. The applicant presents several concerning risk factors: First, the debt-to-income ratio of 42% exceeds our recommended threshold of 36%. Second, there are 2 recent delinquencies on record, indicating payment reliability issues. Third, the credit score of 640 is below prime lending standards. Historical analysis of similar profiles shows elevated default rates.',
    timestamp: generateTimestamp(0),
    stage: 'opening',
  },
  {
    role: 'ADVOCATE',
    content: 'Your Honor, I respectfully disagree. While the Risk Agent raises valid points, context is crucial. The applicant\'s employment status is stable with 2 years at current job, demonstrating commitment. The loan purpose - vehicle financing - is a necessity for commuting to work, improving future earning potential. Furthermore, 4 out of 6 similar historical cases with comparable profiles resulted in successful repayment.',
    timestamp: generateTimestamp(0),
    stage: 'rebuttal',
  },
  {
    role: 'RISK',
    content: 'The Advocate\'s optimism overlooks critical warning signs. The applicant has 3 recent credit inquiries, suggesting financial distress or rejection from other lenders. The rent-to-income ratio combined with existing obligations creates vulnerability to economic shocks. Similar cases with these combined factors showed 33% default rates.',
    timestamp: generateTimestamp(0),
    stage: 'counter',
  },
  {
    role: 'ADVOCATE',
    content: 'The credit inquiries occurred during a single 30-day window for auto loan shopping, which credit scoring models treat as a single inquiry. The applicant\'s payment history on existing accounts shows 100% on-time payments for the past 18 months. The requested loan amount of $15,000 is conservative relative to income, with manageable monthly payments.',
    timestamp: generateTimestamp(0),
    stage: 'counter',
  },
  {
    role: 'RISK',
    content: 'Even with favorable interpretation, the risk-adjusted return does not justify approval. The interest rate required to compensate for default probability would be prohibitive. Manual review would delay decision without materially improving risk assessment.',
    timestamp: generateTimestamp(0),
    stage: 'final',
  },
  {
    role: 'ADVOCATE',
    content: 'The evidence supports conditional approval with standard underwriting. The applicant\'s improving trajectory - stable employment, recent payment discipline, and conservative loan request - indicates creditworthiness. Rejection would be an overreaction to manageable risk factors.',
    timestamp: generateTimestamp(0),
    stage: 'final',
  },
  {
    role: 'JUDGE',
    content: 'After careful consideration of all arguments and evidence, I render the following verdict: MANUAL REVIEW RECOMMENDED. While the Advocate presents compelling evidence of the applicant\'s improving financial behavior, the Risk Agent\'s concerns about debt-to-income ratio and recent delinquencies warrant additional scrutiny. I recommend: (1) Verification of recent income stability, (2) Explanation for delinquencies, (3) Review of payment history on existing obligations. The split in similar case outcomes (67% repayment vs 33% default) supports this cautious approach.',
    timestamp: generateTimestamp(0),
    stage: 'verdict',
  },
];

// ============================================
// Mock Debate Run
// ============================================

export const createMockDebateRun = (): DebateRun => ({
  run_id: generateId('run'),
  stage: 'done',
  messages: createMockDebateMessages(),
  started_at: generateTimestamp(0),
  updated_at: generateTimestamp(0),
});

// ============================================
// Mock Decision
// ============================================

export const createMockDecision = (): Decision => ({
  verdict: 'manual_review',
  justification: [
    'Debt-to-income ratio of 42% exceeds recommended threshold of 36%',
    '2 recent delinquencies indicate payment reliability concerns',
    'Mixed historical evidence: 67% repayment rate among similar cases',
    'Recent credit inquiries require explanation',
    'Stable employment history is a positive factor',
  ],
  evidence_refs: ['neighbor_1', 'neighbor_2', 'neighbor_3', 'neighbor_4', 'neighbor_5', 'neighbor_6'],
  confidence: 0.72,
});

// ============================================
// Mock Cases
// ============================================

export const createMockCases = (): Case[] => [
  {
    case_id: 'case_001',
    status: 'decided',
    created_at: generateTimestamp(5),
    updated_at: generateTimestamp(0),
    applicant: mockApplicants[0],
    documents: createMockDocuments('case_001'),
    retrieval: createMockRetrievalSummary(),
    debate: createMockDebateRun(),
    decision: {
      ...createMockDecision(),
      policy_refs: [
        {
          policy_id: 'policy_004',
          clause: mockPolicyClauses[3],
          rationale: 'Confidence score of 0.72 falls within the manual review threshold range',
        },
      ],
    },
    fraud_signals: createMockFraudSignals('low'),
  },
  {
    case_id: 'case_002',
    status: 'running',
    created_at: generateTimestamp(3),
    updated_at: generateTimestamp(0),
    applicant: mockApplicants[1],
    documents: createMockDocuments('case_002'),
    retrieval: createMockRetrievalSummary(),
    debate: {
      run_id: generateId('run'),
      stage: 'rebuttal',
      messages: createMockDebateMessages().slice(0, 4),
      started_at: generateTimestamp(0),
      updated_at: generateTimestamp(0),
    },
    decision: null,
    fraud_signals: createMockFraudSignals('medium'),
  },
  {
    case_id: 'case_003',
    status: 'draft',
    created_at: generateTimestamp(2),
    updated_at: generateTimestamp(1),
    applicant: mockApplicants[2],
    documents: [],
    retrieval: null,
    debate: null,
    decision: null,
    fraud_signals: null,
  },
  {
    case_id: 'case_004',
    status: 'decided',
    created_at: generateTimestamp(7),
    updated_at: generateTimestamp(6),
    applicant: mockApplicants[3],
    documents: createMockDocuments('case_004'),
    retrieval: createMockRetrievalSummary(),
    debate: createMockDebateRun(),
    decision: {
      verdict: 'reject',
      justification: [
        'Credit score of 580 falls below minimum threshold',
        'High debt-to-income ratio of 55% indicates severe financial stress',
        'Multiple delinquencies and public record present',
        'Short employment and residence history',
      ],
      evidence_refs: ['neighbor_3', 'neighbor_5'],
      confidence: 0.91,
      policy_refs: [
        {
          policy_id: 'policy_001',
          clause: mockPolicyClauses[0],
          rationale: 'Credit score of 580 is below the 600 threshold requiring enhanced review',
        },
        {
          policy_id: 'policy_002',
          clause: mockPolicyClauses[1],
          rationale: 'Debt-to-income ratio of 55% exceeds the 40% threshold',
        },
      ],
    },
    fraud_signals: createMockFraudSignals('high'),
  },
  {
    case_id: 'case_005',
    status: 'decided',
    created_at: generateTimestamp(10),
    updated_at: generateTimestamp(8),
    applicant: mockApplicants[4],
    documents: createMockDocuments('case_005'),
    retrieval: createMockRetrievalSummary(),
    debate: createMockDebateRun(),
    decision: {
      verdict: 'approve',
      justification: [
        'Strong credit score of 750 demonstrates excellent payment history',
        'Low debt-to-income ratio of 22% provides comfortable margin',
        'Stable employment with 12 years at current position',
        'Home ownership indicates financial stability',
        'Similar cases show 85% successful repayment rate',
      ],
      evidence_refs: ['neighbor_1', 'neighbor_2', 'neighbor_4', 'neighbor_6'],
      confidence: 0.88,
      policy_refs: [
        {
          policy_id: 'policy_003',
          clause: mockPolicyClauses[2],
          rationale: 'Decision is explainable and free from discriminatory bias',
        },
      ],
    },
    fraud_signals: createMockFraudSignals('low'),
  },
];

// ============================================
// Mock Audit Events
// ============================================

export const createMockAuditEvents = (caseId: string): AuditEvent[] => [
  {
    event_id: generateId('evt'),
    case_id: caseId,
    event_type: 'created_case',
    timestamp: generateTimestamp(5),
    metadata: { created_by: 'analyst_001' },
  },
  {
    event_id: generateId('evt'),
    case_id: caseId,
    event_type: 'updated_applicant',
    timestamp: generateTimestamp(4),
    metadata: { fields_updated: ['income', 'employment_status'] },
  },
  {
    event_id: generateId('evt'),
    case_id: caseId,
    event_type: 'uploaded_docs',
    timestamp: generateTimestamp(3),
    metadata: { document_count: 3, filenames: ['paystub.pdf', 'bank_statement.pdf', 'id.jpg'] },
  },
  {
    event_id: generateId('evt'),
    case_id: caseId,
    event_type: 'retrieved_neighbors',
    timestamp: generateTimestamp(2),
    metadata: { top_k: 6, default_rate: 33 },
  },
  {
    event_id: generateId('evt'),
    case_id: caseId,
    event_type: 'debate_started',
    timestamp: generateTimestamp(1),
    metadata: { run_id: 'run_001', mode: 'standard' },
  },
  {
    event_id: generateId('evt'),
    case_id: caseId,
    event_type: 'judge_decision',
    timestamp: generateTimestamp(0),
    metadata: { verdict: 'manual_review', confidence: 0.72 },
  },
];

// ============================================
// Mock Dashboard Stats
// ============================================

export const mockDashboardStats: DashboardStats = {
  total_cases: 127,
  approvals: 68,
  rejects: 42,
  manual_reviews: 17,
  draft_cases: 8,
  running_cases: 3,
};

// ============================================
// In-Memory Store
// ============================================

class MockDataStore {
  private cases: Map<string, Case> = new Map();
  private documents: Map<string, Document> = new Map();
  private auditEvents: Map<string, AuditEvent[]> = new Map();
  private runs: Map<string, DebateRun> = new Map();
  private policies: Map<string, Policy> = new Map();
  private policyClauses: Map<string, PolicyClause[]> = new Map();

  constructor() {
    // Initialize with mock data
    const mockCases = createMockCases();
    mockCases.forEach(c => {
      this.cases.set(c.case_id, c);
      this.auditEvents.set(c.case_id, createMockAuditEvents(c.case_id));
      if (c.debate) {
        this.runs.set(c.debate.run_id, c.debate);
      }
      c.documents.forEach(d => this.documents.set(d.document_id, d));
    });

    // Initialize policies
    mockPolicies.forEach(p => {
      this.policies.set(p.policy_id, p);
    });
    mockPolicyClauses.forEach(c => {
      const clauses = this.policyClauses.get(c.policy_id) || [];
      clauses.push(c);
      this.policyClauses.set(c.policy_id, clauses);
    });
  }

  // Cases
  getCases(): Case[] {
    return Array.from(this.cases.values()).sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }

  getCase(caseId: string): Case | undefined {
    return this.cases.get(caseId);
  }

  createCase(caseData: { applicant?: Partial<ApplicantPayload> }): Case {
    const newCase: Case = {
      case_id: generateId('case'),
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      applicant: (caseData.applicant as ApplicantPayload) || null,
      documents: [],
      retrieval: null,
      debate: null,
      decision: null,
      fraud_signals: null,
    };
    this.cases.set(newCase.case_id, newCase);
    this.auditEvents.set(newCase.case_id, [{
      event_id: generateId('evt'),
      case_id: newCase.case_id,
      event_type: 'created_case',
      timestamp: new Date().toISOString(),
      metadata: { created_by: 'analyst_001' },
    }]);
    return newCase;
  }

  updateCase(caseId: string, updates: Partial<Case>): Case | undefined {
    const existing = this.cases.get(caseId);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
    this.cases.set(caseId, updated);
    return updated;
  }

  updateApplicant(caseId: string, applicant: Partial<ApplicantPayload>): Case | undefined {
    const existing = this.cases.get(caseId);
    if (!existing) return undefined;
    const updated: Case = {
      ...existing,
      applicant: { ...existing.applicant, ...applicant } as ApplicantPayload,
      updated_at: new Date().toISOString(),
    };
    this.cases.set(caseId, updated);
    this.addAuditEvent(caseId, 'updated_applicant', { fields_updated: Object.keys(applicant) });
    return updated;
  }

  // Documents
  getDocuments(caseId: string): Document[] {
    return Array.from(this.documents.values()).filter(d => d.case_id === caseId);
  }

  addDocument(caseId: string, file: File): Document {
    const doc: Document = {
      document_id: generateId('doc'),
      case_id: caseId,
      filename: file.name,
      content_type: file.type,
      status: 'uploaded',
      extracted_fields: null,
      created_at: new Date().toISOString(),
      size: file.size,
    };
    this.documents.set(doc.document_id, doc);
    
    // Simulate parsing progress
    setTimeout(() => {
      doc.status = 'parsing';
      this.documents.set(doc.document_id, doc);
    }, 1000);
    
    setTimeout(() => {
      doc.status = 'extracted';
      doc.extracted_fields = { processed: true };
      this.documents.set(doc.document_id, doc);
    }, 3000);

    const case_ = this.cases.get(caseId);
    if (case_) {
      case_.documents.push(doc);
      this.cases.set(caseId, case_);
    }

    this.addAuditEvent(caseId, 'uploaded_docs', { filename: file.name, size: file.size });
    return doc;
  }

  // Debate Runs
  startDebate(caseId: string, topK: number = 8): string {
    const runId = generateId('run');
    const run: DebateRun = {
      run_id: runId,
      stage: 'opening',
      messages: [],
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.runs.set(runId, run);

    const case_ = this.cases.get(caseId);
    if (case_) {
      case_.status = 'running';
      case_.debate = run;
      case_.retrieval = createMockRetrievalSummary();
      this.cases.set(caseId, case_);
    }

    this.addAuditEvent(caseId, 'debate_started', { run_id: runId, top_k: topK });

    // Simulate debate progression
    this.simulateDebateProgress(caseId, runId);

    return runId;
  }

  private simulateDebateProgress(caseId: string, runId: string) {
    const stages: Array<'opening' | 'rebuttal' | 'counter' | 'final' | 'verdict' | 'done'> = 
      ['opening', 'rebuttal', 'counter', 'final', 'verdict', 'done'];
    const allMessages = createMockDebateMessages();
    let messageIndex = 0;

    stages.forEach((stage, index) => {
      setTimeout(() => {
        const run = this.runs.get(runId);
        if (!run) return;

        run.stage = stage;
        
        // Add messages for this stage
        while (messageIndex < allMessages.length && allMessages[messageIndex].stage === stage) {
          run.messages.push(allMessages[messageIndex]);
          messageIndex++;
        }

        run.updated_at = new Date().toISOString();
        this.runs.set(runId, run);

        const case_ = this.cases.get(caseId);
        if (case_) {
          case_.debate = run;
          if (stage === 'done') {
            case_.status = 'decided';
            case_.decision = createMockDecision();
            this.addAuditEvent(caseId, 'judge_decision', { 
              verdict: case_.decision.verdict, 
              confidence: case_.decision.confidence 
            });
          }
          this.cases.set(caseId, case_);
        }
      }, (index + 1) * 2000);
    });
  }

  getRun(runId: string): DebateRun | undefined {
    return this.runs.get(runId);
  }

  // Audit Events
  getAuditEvents(caseId: string): AuditEvent[] {
    return this.auditEvents.get(caseId) || [];
  }

  private addAuditEvent(caseId: string, eventType: AuditEvent['event_type'], metadata: Record<string, any>) {
    const events = this.auditEvents.get(caseId) || [];
    events.push({
      event_id: generateId('evt'),
      case_id: caseId,
      event_type: eventType,
      timestamp: new Date().toISOString(),
      metadata,
    });
    this.auditEvents.set(caseId, events);
  }

  // Stats
  getStats(): DashboardStats {
    const cases = this.getCases();
    return {
      total_cases: cases.length,
      approvals: cases.filter(c => c.decision?.verdict === 'approve').length,
      rejects: cases.filter(c => c.decision?.verdict === 'reject').length,
      manual_reviews: cases.filter(c => c.decision?.verdict === 'manual_review').length,
      draft_cases: cases.filter(c => c.status === 'draft').length,
      running_cases: cases.filter(c => c.status === 'running').length,
    };
  }

  // Fraud Signals (Neo4j Graph Layer)
  getFraudSignals(caseId: string): FraudSignals | undefined {
    const case_ = this.cases.get(caseId);
    return case_?.fraud_signals || undefined;
  }

  computeFraudSignals(caseId: string): FraudSignals {
    // Simulate Neo4j graph query and fraud signal computation
    const riskLevel = Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low';
    const signals = createMockFraudSignals(riskLevel);
    
    const case_ = this.cases.get(caseId);
    if (case_) {
      case_.fraud_signals = signals;
      this.cases.set(caseId, case_);
    }
    
    return signals;
  }

  // Policies (Policy-Aware RAG)
  getPolicies(): Policy[] {
    return Array.from(this.policies.values());
  }

  getPolicy(policyId: string): Policy | undefined {
    return this.policies.get(policyId);
  }

  getPolicyClauses(policyId: string): PolicyClause[] {
    return this.policyClauses.get(policyId) || [];
  }

  uploadPolicy(name: string, documentType: Policy['document_type'], filename: string): Policy {
    const policy: Policy = {
      policy_id: generateId('policy'),
      name,
      document_type: documentType,
      filename,
      version: 'v1.0',
      uploaded_at: new Date().toISOString(),
      clauses_count: Math.floor(Math.random() * 20) + 5,
      status: 'active',
    };
    this.policies.set(policy.policy_id, policy);
    return policy;
  }

  getPolicyEvidence(caseId: string): PolicyClause[] {
    const case_ = this.cases.get(caseId);
    if (!case_?.decision?.policy_refs) {
      return [];
    }
    return case_.decision.policy_refs.map(ref => ref.clause);
  }
}

export const mockDataStore = new MockDataStore();
