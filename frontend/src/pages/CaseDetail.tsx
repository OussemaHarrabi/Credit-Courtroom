import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CaseStatusBadge } from '@/components/ui-custom/CaseStatusBadge';
import { VerdictBadge } from '@/components/ui-custom/VerdictBadge';
import { EvidenceCard } from '@/components/ui-custom/EvidenceCard';
import { TranscriptMessage } from '@/components/ui-custom/TranscriptMessage';
import { FraudNetworkPanel } from '@/components/ui-custom/FraudNetworkPanel';

import { getCase, startDebate, pollRunStatus, pollTranscript, getAuditEvents } from '@/lib/api';
import type { Case, DebateMessage, AuditEvent, GetTranscriptResponse } from '@/types';
import { 
  Play, 
  RotateCcw, 
  Download, 
  Copy, 
  FileText, 
  Scale, 
  MessageSquare, 
  Gavel,
  User,
  DollarSign,
  Briefcase,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronLeft,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';

export function CaseDetail() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const [case_, setCase] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (caseId) {
      loadCase();
    }
  }, [caseId]);

  useEffect(() => {
    if (case_?.debate?.run_id) {
      const unsubscribeStatus = pollRunStatus(
        case_.debate.run_id,
        (status) => {
          setProgress(status.progress);
          if (status.status === 'decided') {
            setRunning(false);
            loadCase();
          }
        },
        (err) => console.error('Status poll error:', err)
      );

      const unsubscribeTranscript = pollTranscript(
        case_.debate.run_id,
        (transcript: GetTranscriptResponse) => {
          setMessages(transcript.messages);
        },
        (err) => console.error('Transcript poll error:', err)
      );

      return () => {
        unsubscribeStatus();
        unsubscribeTranscript();
      };
    }
  }, [case_?.debate?.run_id]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadCase = async () => {
    if (!caseId) return;
    try {
      const response = await getCase(caseId);
      setCase(response.case);
      if (response.case.debate) {
        setMessages(response.case.debate.messages);
      }
      const events = await getAuditEvents(caseId);
      setAuditEvents(events);
    } catch (err) {
      setError('Failed to load case');
    } finally {
      setLoading(false);
    }
  };

  const handleRunDebate = async () => {
    if (!caseId) return;
    setRunning(true);
    setProgress(0);
    try {
      await startDebate(caseId, { top_k: 8 });
      loadCase();
    } catch (err) {
      setError('Failed to start debate');
      setRunning(false);
    }
  };

  const copyTranscript = () => {
    const text = messages.map(m => `[${m.role}] ${m.content}`).join('\n\n');
    navigator.clipboard.writeText(text);
  };

  const downloadTranscript = () => {
    const text = messages.map(m => `[${m.role}] ${m.content}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript_${caseId}.txt`;
    a.click();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!case_) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>Case not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Button variant="ghost" size="sm" className="mb-2 -ml-2" onClick={() => navigate('/dashboard')}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">#{case_.case_id.toUpperCase()}</h1>
            <CaseStatusBadge status={case_.status} />
            {case_.decision && <VerdictBadge verdict={case_.decision.verdict} />}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Created {format(new Date(case_.created_at), 'MMM d, yyyy HH:mm')}
          </p>
        </div>
        <div className="flex gap-2">
          {case_.status === 'draft' && (
            <Button onClick={handleRunDebate} disabled={running}>
              {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
              Run Debate
            </Button>
          )}
          {case_.status === 'decided' && (
            <Button variant="outline" onClick={handleRunDebate}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Re-run
            </Button>
          )}
          <Button variant="outline" disabled>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      {running && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Debate in Progress</span>
              <span className="text-sm text-slate-500">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
          <TabsTrigger value="decision">Decision</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                {['Draft', 'Retrieved', 'Debate', 'Verdict'].map((stage, index) => {
                  const isCompleted = 
                    (stage === 'Draft' && case_.status !== 'draft') ||
                    (stage === 'Retrieved' && case_.retrieval) ||
                    (stage === 'Debate' && case_.debate) ||
                    (stage === 'Verdict' && case_.decision);
                  const isCurrent = 
                    (stage === 'Draft' && case_.status === 'draft') ||
                    (stage === 'Retrieved' && case_.status === 'ready') ||
                    (stage === 'Debate' && case_.status === 'running') ||
                    (stage === 'Verdict' && case_.status === 'decided');
                  
                  return (
                    <div key={stage} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                          isCompleted 
                            ? 'bg-emerald-100 border-emerald-500 text-emerald-700' 
                            : isCurrent
                              ? 'bg-slate-900 border-slate-900 text-white'
                              : 'bg-white border-slate-300 text-slate-400'
                        }`}>
                          {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                        </div>
                        <span className={`text-xs mt-2 ${isCurrent ? 'font-medium text-slate-900' : 'text-slate-500'}`}>
                          {stage}
                        </span>
                      </div>
                      {index < 3 && (
                        <div className={`w-24 h-0.5 mx-2 ${isCompleted ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Applicant Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Applicant Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {case_.applicant ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <User className="w-4 h-4" />
                      <span className="text-xs">Age</span>
                    </div>
                    <p className="text-lg font-semibold">{case_.applicant.age} years</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-xs">Annual Income</span>
                    </div>
                    <p className="text-lg font-semibold">${case_.applicant.annual_income.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Scale className="w-4 h-4" />
                      <span className="text-xs">Credit Score</span>
                    </div>
                    <p className="text-lg font-semibold">{case_.applicant.credit_score}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Briefcase className="w-4 h-4" />
                      <span className="text-xs">Employment</span>
                    </div>
                    <p className="text-lg font-semibold">{case_.applicant.employment_status}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-xs">Loan Amount</span>
                    </div>
                    <p className="text-lg font-semibold">${case_.applicant.loan_amount.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs">Loan Term</span>
                    </div>
                    <p className="text-lg font-semibold">{case_.applicant.loan_term} months</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-xs">Debt-to-Income</span>
                    </div>
                    <p className="text-lg font-semibold">{case_.applicant.debt_to_income_ratio}%</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <FileText className="w-4 h-4" />
                      <span className="text-xs">Documents</span>
                    </div>
                    <p className="text-lg font-semibold">{case_.documents.length}</p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500">No applicant information available</p>
              )}
            </CardContent>
          </Card>

          {/* Risk Signals */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Risk Signals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg border ${
                  (case_.applicant?.credit_score || 0) < 600 
                    ? 'bg-rose-50 border-rose-200' 
                    : (case_.applicant?.credit_score || 0) < 700 
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-emerald-50 border-emerald-200'
                }`}>
                  <p className="text-sm font-medium mb-1">Credit Score</p>
                  <p className={`text-2xl font-bold ${
                    (case_.applicant?.credit_score || 0) < 600 
                      ? 'text-rose-700' 
                      : (case_.applicant?.credit_score || 0) < 700 
                        ? 'text-amber-700'
                        : 'text-emerald-700'
                  }`}>
                    {case_.applicant?.credit_score || 'N/A'}
                  </p>
                  <p className="text-xs mt-1">
                    {(case_.applicant?.credit_score || 0) < 600 
                      ? 'Below average - elevated risk' 
                      : (case_.applicant?.credit_score || 0) < 700 
                        ? 'Fair - moderate risk'
                        : 'Good - low risk'}
                  </p>
                </div>
                <div className={`p-4 rounded-lg border ${
                  (case_.applicant?.debt_to_income_ratio || 0) > 40 
                    ? 'bg-rose-50 border-rose-200' 
                    : (case_.applicant?.debt_to_income_ratio || 0) > 30 
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-emerald-50 border-emerald-200'
                }`}>
                  <p className="text-sm font-medium mb-1">Debt-to-Income</p>
                  <p className={`text-2xl font-bold ${
                    (case_.applicant?.debt_to_income_ratio || 0) > 40 
                      ? 'text-rose-700' 
                      : (case_.applicant?.debt_to_income_ratio || 0) > 30 
                        ? 'text-amber-700'
                        : 'text-emerald-700'
                  }`}>
                    {case_.applicant?.debt_to_income_ratio || 0}%
                  </p>
                  <p className="text-xs mt-1">
                    {(case_.applicant?.debt_to_income_ratio || 0) > 40 
                      ? 'High - may struggle with payments' 
                      : (case_.applicant?.debt_to_income_ratio || 0) > 30 
                        ? 'Moderate - within acceptable range'
                        : 'Low - comfortable margin'}
                  </p>
                </div>
                <div className={`p-4 rounded-lg border ${
                  (case_.applicant?.delinquency_history || 0) > 0 
                    ? 'bg-rose-50 border-rose-200' 
                    : 'bg-emerald-50 border-emerald-200'
                }`}>
                  <p className="text-sm font-medium mb-1">Delinquencies</p>
                  <p className={`text-2xl font-bold ${
                    (case_.applicant?.delinquency_history || 0) > 0 
                      ? 'text-rose-700' 
                      : 'text-emerald-700'
                  }`}>
                    {case_.applicant?.delinquency_history || 0}
                  </p>
                  <p className="text-xs mt-1">
                    {(case_.applicant?.delinquency_history || 0) > 0 
                      ? 'Previous payment issues' 
                      : 'Clean payment history'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fraud Network Panel */}
          <FraudNetworkPanel fraudSignals={case_.fraud_signals} />
        </TabsContent>

        {/* Evidence Tab */}
        <TabsContent value="evidence" className="space-y-6">
          {/* Fraud Network Evidence (Neo4j) */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Network Evidence</h3>
              <Badge variant="outline" className="text-xs">Neo4j Graph</Badge>
            </div>
            <FraudNetworkPanel fraudSignals={case_.fraud_signals} />
          </div>

          {/* Vector Evidence (Qdrant) */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Vector Evidence</h3>
              <Badge variant="outline" className="text-xs">Qdrant</Badge>
            </div>
            {case_.retrieval ? (
              <>
                {/* Stats */}
                <Card className="mb-4">
                  <CardHeader>
                    <CardTitle className="text-lg">Similar Cases Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-slate-50 rounded-lg text-center">
                        <p className="text-3xl font-bold text-slate-900">{case_.retrieval.top_k}</p>
                        <p className="text-sm text-slate-500">Similar Cases</p>
                      </div>
                      <div className="p-4 bg-rose-50 rounded-lg text-center">
                        <p className="text-3xl font-bold text-rose-700">{case_.retrieval.stats.default_rate}%</p>
                        <p className="text-sm text-rose-600">Default Rate</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg text-center">
                        <p className="text-3xl font-bold text-slate-900">{case_.retrieval.stats.average_credit_score}</p>
                        <p className="text-sm text-slate-500">Avg Credit Score</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg text-center">
                        <p className="text-3xl font-bold text-slate-900">${(case_.retrieval.stats.median_income / 1000).toFixed(0)}k</p>
                        <p className="text-sm text-slate-500">Median Income</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Neighbor Cases */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {case_.retrieval.neighbors.map((neighbor, index) => (
                    <EvidenceCard 
                      key={neighbor.neighbor_id} 
                      neighbor={neighbor} 
                      index={index}
                    />
                  ))}
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No vector evidence retrieved yet</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Run the debate to retrieve similar historical cases
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Transcript Tab */}
        <TabsContent value="transcript" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Debate Transcript</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyTranscript}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadTranscript}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {messages.length > 0 ? (
                <div className="space-y-6 max-h-[600px] overflow-auto pr-4">
                  {messages.map((message, index) => (
                    <TranscriptMessage
                      key={index}
                      message={message}
                      isLatest={index === messages.length - 1}
                    />
                  ))}
                  <div ref={transcriptEndRef} />
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No transcript available</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Start the debate to see the transcript
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Decision Tab */}
        <TabsContent value="decision" className="space-y-6">
          {case_.decision ? (
            <>
              <Card className={`border-2 ${
                case_.decision.verdict === 'approve' 
                  ? 'border-emerald-200 bg-emerald-50/50' 
                  : case_.decision.verdict === 'reject'
                    ? 'border-rose-200 bg-rose-50/50'
                    : 'border-amber-200 bg-amber-50/50'
              }`}>
                <CardContent className="p-8 text-center">
                  <VerdictBadge verdict={case_.decision.verdict} size="lg" className="mb-4" />
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">
                    {case_.decision.verdict === 'approve' 
                      ? 'Application Approved' 
                      : case_.decision.verdict === 'reject'
                        ? 'Application Rejected'
                        : 'Manual Review Required'}
                  </h2>
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <span className="text-sm text-slate-500">Confidence:</span>
                    <div className="w-32">
                      <Progress value={case_.decision.confidence * 100} className="h-2" />
                    </div>
                    <span className="text-sm font-medium">{Math.round(case_.decision.confidence * 100)}%</span>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Justification</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {case_.decision.justification.map((point, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-medium text-slate-600">{index + 1}</span>
                          </div>
                          <p className="text-sm text-slate-700">{point}</p>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Evidence Used</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {case_.decision.evidence_refs.map((ref) => (
                        <Badge key={ref} variant="secondary">
                          Exhibit #{ref.split('_')[1]}
                        </Badge>
                      ))}
                    </div>
                    <Separator className="my-4" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-900">Fairness Checks</p>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Clock className="w-4 h-4" />
                        <span>Coming soon - demographic parity analysis</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Policy References */}
              {case_.decision.policy_refs && case_.decision.policy_refs.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Policy References</CardTitle>
                      <Badge variant="outline" className="text-xs">Policy-Aware RAG</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {case_.decision.policy_refs.map((ref, index) => (
                        <div key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="text-xs">
                              {ref.clause.document_name}
                            </Badge>
                            <span className="text-xs text-slate-500">Section {ref.clause.section}</span>
                          </div>
                          <blockquote className="text-sm text-slate-700 italic border-l-2 border-slate-300 pl-3 mb-2">
                            "{ref.clause.text}"
                          </blockquote>
                          <p className="text-xs text-slate-500">
                            <span className="font-medium">Rationale:</span> {ref.rationale}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Gavel className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No decision yet</p>
                <p className="text-sm text-slate-400 mt-1">
                  Complete the debate to see the verdict
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Audit Log</CardTitle>
              <CardDescription>
                Immutable record of all actions taken on this case
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditEvents.map((event) => (
                  <div key={event.event_id} className="flex items-start gap-4 pb-4 border-b border-slate-100 last:border-0">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                      {event.event_type === 'created_case' && <Briefcase className="w-4 h-4 text-slate-600" />}
                      {event.event_type === 'updated_applicant' && <User className="w-4 h-4 text-slate-600" />}
                      {event.event_type === 'uploaded_docs' && <FileText className="w-4 h-4 text-slate-600" />}
                      {event.event_type === 'retrieved_neighbors' && <Scale className="w-4 h-4 text-slate-600" />}
                      {event.event_type === 'debate_started' && <MessageSquare className="w-4 h-4 text-slate-600" />}
                      {event.event_type === 'judge_decision' && <Gavel className="w-4 h-4 text-slate-600" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-slate-900">
                          {event.event_type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </p>
                        <span className="text-xs text-slate-500">
                          {format(new Date(event.timestamp), 'MMM d, HH:mm:ss')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        {JSON.stringify(event.metadata, null, 2).slice(0, 100)}
                        {JSON.stringify(event.metadata).length > 100 ? '...' : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
