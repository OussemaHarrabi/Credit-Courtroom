# Frontend → Backend API Contract (from fetch usage)

This document lists every backend endpoint the frontend will call when mock mode is disabled.

Source of truth in the frontend:
- Fetch implementation: [frontend/src/lib/api.ts](../frontend/src/lib/api.ts)
- Type shapes (Zod + TS types): [frontend/src/types/index.ts](../frontend/src/types/index.ts)

## Notes

- Base URL defaults to `/api/v1` in the frontend.
- The frontend expects JSON unless explicitly noted as `multipart/form-data` or `application/pdf`.
- Error handling: the frontend throws if the HTTP response is not `2xx`.
- Timestamps are ISO strings (`new Date().toISOString()`).

---

## Cases

### POST /api/v1/cases

**Utility (frontend):** Create a new case (draft) optionally pre-filled with applicant fields.

**Used by:** `createCase()` in [frontend/src/lib/api.ts](../frontend/src/lib/api.ts)

**Request (JSON):** `CreateCaseRequest`

```json
{
  "applicant": {
    "age": 30,
    "annual_income": 50000
  }
}
```

- `applicant` is optional.
- If present, it’s a partial object of the applicant payload.

**Response (JSON):** `CreateCaseResponse`

```json
{
  "case": {
    "case_id": "case_001",
    "status": "draft",
    "created_at": "2026-01-30T12:00:00.000Z",
    "updated_at": "2026-01-30T12:00:00.000Z",
    "applicant": null,
    "documents": [],
    "retrieval": null,
    "debate": null,
    "decision": null,
    "fraud_signals": null
  }
}
```

---

### GET /api/v1/cases

**Utility (frontend):** List cases with optional filtering and pagination.

**Used by:** `listCases()` in [frontend/src/lib/api.ts](../frontend/src/lib/api.ts)

**Query params:**
- `query` (string, optional)
- `status` (one of `draft|ready|running|decided|failed`, optional)
- `limit` (number, required by frontend call site; default in UI is `20`)
- `offset` (number, required by frontend call site; default in UI is `0`)

Example:

```
GET /api/v1/cases?query=car&status=decided&limit=20&offset=0
```

**Response (JSON):** `ListCasesResponse`

```json
{
  "items": [
    { "case_id": "case_001", "status": "decided", "created_at": "...", "updated_at": "...", "applicant": null, "documents": [], "retrieval": null, "debate": null, "decision": null, "fraud_signals": null }
  ],
  "total": 127
}
```

---

### GET /api/v1/cases/{caseId}

**Utility (frontend):** Fetch a single case for the case detail view (includes applicant, documents, retrieval, debate, decision, fraud signals).

**Used by:** `getCase()` in [frontend/src/lib/api.ts](../frontend/src/lib/api.ts)

**Path params:**
- `caseId` (string)

**Response (JSON):** `GetCaseResponse`

```json
{ "case": { "case_id": "case_001", "status": "draft", "created_at": "...", "updated_at": "...", "applicant": null, "documents": [], "retrieval": null, "debate": null, "decision": null, "fraud_signals": null } }
```

---

### PATCH /api/v1/cases/{caseId}/applicant

**Utility (frontend):** Update applicant fields for a case.

**Used by:** `updateApplicant()` in [frontend/src/lib/api.ts](../frontend/src/lib/api.ts)

**Request (JSON):** `UpdateApplicantRequest`

- In the frontend types this is intentionally permissive: `{ [key: string]: any }`.
- In practice, the UI sends a partial applicant payload (any subset of applicant fields).

Example:

```json
{
  "age": 30,
  "annual_income": 50000,
  "loan_purpose": "Car"
}
```

**Response (JSON):** `UpdateApplicantResponse`

```json
{ "case": { "case_id": "case_001", "status": "draft", "created_at": "...", "updated_at": "...", "applicant": { "age": 30, "annual_income": 50000, "loan_purpose": "Car" }, "documents": [], "retrieval": null, "debate": null, "decision": null, "fraud_signals": null } }
```

---

## Documents

### POST /api/v1/cases/{caseId}/documents

**Utility (frontend):** Upload a single document file for a case.

**Used by:** `uploadDocument()` in [frontend/src/lib/api.ts](../frontend/src/lib/api.ts)

**Request (multipart/form-data):**
- `file` (required): the uploaded file

**Response (JSON):** `UploadDocumentResponse`

```json
{
  "document": {
    "document_id": "doc_xxx",
    "case_id": "case_001",
    "filename": "paystub.pdf",
    "content_type": "application/pdf",
    "status": "uploaded",
    "extracted_fields": null,
    "created_at": "...",
    "size": 245760
  }
}
```

---

### GET /api/v1/cases/{caseId}/documents

**Utility (frontend):** List documents attached to a case.

**Used by:** `listDocuments()` in [frontend/src/lib/api.ts](../frontend/src/lib/api.ts)

**Response (JSON):** `ListDocumentsResponse`

```json
{
  "items": [
    {
      "document_id": "doc_xxx",
      "case_id": "case_001",
      "filename": "paystub.pdf",
      "content_type": "application/pdf",
      "status": "extracted",
      "extracted_fields": { "income_verified": true },
      "created_at": "...",
      "size": 245760
    }
  ]
}
```

---

## Debate Runs

### POST /api/v1/cases/{caseId}/run

**Utility (frontend):** Start a debate run for the case.

**Used by:** `startDebate()` in [frontend/src/lib/api.ts](../frontend/src/lib/api.ts)

**Request (JSON):** `StartDebateRequest`

```json
{
  "top_k": 8,
  "mode": "standard"
}
```

- `top_k` is optional.
- `mode` is optional and should be `standard` or `adversarial`.

**Response (JSON):** `StartDebateResponse`

```json
{
  "run_id": "run_xxx",
  "status": "running",
  "case_id": "case_001"
}
```

---

### GET /api/v1/runs/{runId}/status

**Utility (frontend):** Poll run progress and show the stage/progress bar.

**Used by:** `getRunStatus()` and `pollRunStatus()` in [frontend/src/lib/api.ts](../frontend/src/lib/api.ts)

**Response (JSON):** `GetRunStatusResponse`

```json
{
  "run_id": "run_xxx",
  "case_id": "case_001",
  "status": "running",
  "stage": "rebuttal",
  "progress": 40
}
```

- `stage` must be one of: `opening|rebuttal|counter|final|verdict|done`.
- `status` is treated like a string in the frontend, but the UI expects values like `running` or `decided`.

---

### GET /api/v1/runs/{runId}/transcript

**Utility (frontend):** Poll the debate transcript messages as they are produced.

**Used by:** `getTranscript()` and `pollTranscript()` in [frontend/src/lib/api.ts](../frontend/src/lib/api.ts)

**Response (JSON):** `GetTranscriptResponse`

```json
{
  "messages": [
    {
      "role": "MODERATOR",
      "content": "The court is now in session...",
      "timestamp": "...",
      "stage": "opening"
    }
  ],
  "stage": "opening",
  "updated_at": "..."
}
```

---

### GET /api/v1/runs/{runId}/decision

**Utility (frontend):** Fetch the final decision and retrieval summary once the run completes.

**Used by:** `getDecision()` in [frontend/src/lib/api.ts](../frontend/src/lib/api.ts)

**Response (JSON):** `GetDecisionResponse`

```json
{
  "decision": {
    "verdict": "manual_review",
    "justification": ["..."],
    "evidence_refs": ["neighbor_1"],
    "confidence": 0.72,
    "policy_refs": [
      {
        "policy_id": "policy_004",
        "clause": {
          "clause_id": "clause_004",
          "policy_id": "policy_004",
          "section": "1.3",
          "text": "Cases with mixed evidence...",
          "policy_type": "manual_review",
          "document_name": "Manual Review Conditions",
          "version": "v1.0"
        },
        "rationale": "..."
      }
    ]
  },
  "retrieval": {
    "top_k": 6,
    "neighbors": [
      {
        "neighbor_id": "neighbor_1",
        "similarity": 0.92,
        "outcome": "repaid",
        "highlights": ["..."],
        "payload_preview": { "age": 33 }
      }
    ],
    "stats": {
      "default_rate": 33,
      "average_credit_score": 700,
      "median_income": 68000,
      "total_neighbors": 6
    }
  }
}
```

---

## Audit

### GET /api/v1/cases/{caseId}/audit

**Utility (frontend):** Fetch audit events for a case (used to build the audit logs page and the case audit tab).

**Used by:** `getAuditEvents()` in [frontend/src/lib/api.ts](../frontend/src/lib/api.ts)

**Response (JSON):** array of `AuditEvent`

```json
[
  {
    "event_id": "evt_xxx",
    "case_id": "case_001",
    "event_type": "created_case",
    "timestamp": "...",
    "metadata": { "created_by": "analyst_001" }
  }
]
```

---

## Dashboard

### GET /api/v1/dashboard/stats

**Utility (frontend):** Populate dashboard KPI cards.

**Used by:** `getDashboardStats()` in [frontend/src/lib/api.ts](../frontend/src/lib/api.ts)

**Response (JSON):** `DashboardStats`

```json
{
  "total_cases": 127,
  "approvals": 68,
  "rejects": 42,
  "manual_reviews": 17,
  "draft_cases": 8,
  "running_cases": 3
}
```

---

## Export

### GET /api/v1/cases/{caseId}/export.pdf

**Utility (frontend):** Download a PDF export for the case.

**Used by:** `exportReport()` in [frontend/src/lib/api.ts](../frontend/src/lib/api.ts)

**Response:** binary PDF (`Content-Type: application/pdf`)

- The frontend reads it as a `Blob`.

---

## Fraud Signals

### GET /api/v1/cases/{caseId}/fraud-signals

**Utility (frontend):** Retrieve computed fraud signals for the case.

**Used by:** `getFraudSignals()` in [frontend/src/lib/api.ts](../frontend/src/lib/api.ts)

**Response (JSON):** `GetFraudSignalsResponse`

```json
{
  "fraud_signals": {
    "shared_device_count": 1,
    "shared_ip_count": 2,
    "shared_merchant_count": 3,
    "known_fraud_neighbor_count": 1,
    "fraud_cluster_score": 0.45,
    "fraud_flags": ["shared_ip_with_1_defaulter"],
    "computed_at": "..."
  }
}
```

---

## Policies

### GET /api/v1/policies

**Utility (frontend):** List uploaded policies.

**Used by:** `listPolicies()` in [frontend/src/lib/api.ts](../frontend/src/lib/api.ts)

**Response (JSON):** `ListPoliciesResponse`

```json
{
  "items": [
    {
      "policy_id": "policy_001",
      "name": "Credit Score Eligibility Policy",
      "document_type": "eligibility",
      "filename": "credit_score_policy_v2.pdf",
      "version": "v2.0",
      "uploaded_at": "...",
      "clauses_count": 12,
      "status": "active"
    }
  ],
  "total": 1
}
```

---

### GET /api/v1/policies/{policyId}

**Utility (frontend):** Get details for a single policy.

**Used by:** `getPolicy()` in [frontend/src/lib/api.ts](../frontend/src/lib/api.ts)

**Response (JSON):** `GetPolicyResponse`

```json
{
  "policy": {
    "policy_id": "policy_001",
    "name": "Credit Score Eligibility Policy",
    "document_type": "eligibility",
    "filename": "credit_score_policy_v2.pdf",
    "version": "v2.0",
    "uploaded_at": "...",
    "clauses_count": 12,
    "status": "active"
  }
}
```

---

### POST /api/v1/policies/upload

**Utility (frontend):** Upload a policy document.

**Used by:** `uploadPolicy()` in [frontend/src/lib/api.ts](../frontend/src/lib/api.ts)

**Request (multipart/form-data):**
- `file` (required): policy document
- `name` (required): policy name
- `document_type` (required): `eligibility|risk_threshold|regulatory|manual_review`

**Response (JSON):**

Important: the frontend implementation currently returns the raw JSON body from the server and expects it to be a `Policy` object.

So the simplest compatible response is:

```json
{
  "policy_id": "policy_abc",
  "name": "...",
  "document_type": "eligibility",
  "filename": "...",
  "version": "v1.0",
  "uploaded_at": "...",
  "clauses_count": 12,
  "status": "active"
}
```

(There is also a `UploadPolicyResponse` type declared in [frontend/src/types/index.ts](../frontend/src/types/index.ts) as `{ policy: Policy }`, but the fetch wrapper in `api.ts` does **not** currently use that shape.)

---

### GET /api/v1/cases/{caseId}/policy-evidence

**Utility (frontend):** Fetch policy clauses referenced/used for a case decision.

**Used by:** `getPolicyEvidence()` in [frontend/src/lib/api.ts](../frontend/src/lib/api.ts)

**Response (JSON):** `GetPolicyEvidenceResponse`

```json
{
  "clauses": [
    {
      "clause_id": "clause_004",
      "policy_id": "policy_004",
      "section": "1.3",
      "text": "Cases with mixed evidence...",
      "policy_type": "manual_review",
      "document_name": "Manual Review Conditions",
      "version": "v1.0"
    }
  ]
}
```
