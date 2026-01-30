import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { DocumentStatusBadge } from '@/components/ui-custom/DocumentStatusBadge';
import { createCase, startDebate, updateApplicant, uploadDocument } from '@/lib/api';
import type { Case, Document, ApplicantPayload } from '@/types';
import { useDropzone } from 'react-dropzone';
import { 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  Play, 
  Upload, 
  FileText, 
  CheckCircle2,
  AlertCircle,
  Sparkles,
  User,
  FileUp
} from 'lucide-react';

const STEPS = [
  { id: 'applicant', label: 'Applicant Info', icon: User },
  { id: 'documents', label: 'Documents', icon: FileUp },
  { id: 'review', label: 'Review & Run', icon: Play },
];

const employmentOptions = ['Employed', 'Self-employed', 'Unemployed', 'Retired', 'Student'];
const educationOptions = ["High School", "Associate's", "Bachelor's", "Master's", "Doctorate"];
const loanPurposeOptions = ['Car', 'Home', 'Education', 'Medical', 'Business', 'Debt Consolidation', 'Personal', 'Other'];
const maritalStatusOptions = ['Single', 'Married', 'Divorced', 'Widowed'];
const residenceTypeOptions = ['Rent', 'Own', 'Mortgage', 'Other'];

export function NewCase() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [case_, setCase] = useState<Case | null>(null);
  const [applicant, setApplicant] = useState<Partial<ApplicantPayload>>({
    age: 30,
    annual_income: 50000,
    credit_score: 650,
    loan_amount: 20000,
    loan_term: 60,
    interest_rate: 10,
    debt_to_income_ratio: 30,
    employment_status: 'Employed',
    education_level: "Bachelor's",
    loan_purpose: 'Car',
    marital_status: 'Single',
    gender: 'Male',
    delinquency_history: 0,
    public_records: 0,
    num_of_open_accounts: 3,
    num_of_credit_inquiries: 1,
    residence_type: 'Rent',
    years_at_current_residence: 2,
    years_at_current_job: 3,
  });
  const [documents, setDocuments] = useState<Document[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize case on mount
  const initializeCase = async () => {
    try {
      const response = await createCase();
      setCase(response.case);
      return response.case;
    } catch (err) {
      setError('Failed to create case');
      throw err;
    }
  };

  // Step A: Applicant Info
  const handleApplicantChange = (field: keyof ApplicantPayload, value: any) => {
    setApplicant(prev => ({ ...prev, [field]: value }));
  };

  const saveApplicant = async () => {
    if (!case_) {
      const newCase = await initializeCase();
      if (!newCase) return;
    }
    
    setSaving(true);
    try {
      const targetCase = case_ || (await initializeCase());
      await updateApplicant(targetCase.case_id, applicant);
      setCurrentStep(1);
    } catch (err) {
      setError('Failed to save applicant info');
    } finally {
      setSaving(false);
    }
  };

  // Step B: Documents
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!case_) {
      const newCase = await initializeCase();
      if (!newCase) return;
    }

    const targetCase = case_ || (await initializeCase());
    
    for (const file of acceptedFiles) {
      try {
        const response = await uploadDocument(targetCase.case_id, file);
        setDocuments(prev => [...prev, response.document]);
      } catch (err) {
        console.error('Failed to upload:', file.name);
      }
    }
  }, [case_]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
  });

  // Step C: Review & Run
  const handleRunDebate = async () => {
    if (!case_) {
      setError('Case not created yet. Please save applicant first.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // start run on backend
      await startDebate(case_.case_id, { top_k: 8, mode: 'standard' });
      // go to case detail page (it will poll run status/transcript)
      navigate(`/cases/${case_.case_id}`);
    } catch (err) {
      setError('Failed to start debate run');
    } finally {
      setSaving(false);
    }
  };


  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          
          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isActive 
                      ? 'bg-slate-900 border-slate-900 text-white' 
                      : isCompleted
                        ? 'bg-emerald-100 border-emerald-500 text-emerald-700'
                        : 'bg-white border-slate-300 text-slate-400'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <span className={`text-xs mt-2 font-medium ${
                  isActive ? 'text-slate-900' : isCompleted ? 'text-emerald-700' : 'text-slate-400'
                }`}>
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`w-24 h-0.5 mx-4 ${
                  isCompleted ? 'bg-emerald-500' : 'bg-slate-200'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderApplicantForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            type="number"
            value={applicant.age}
            onChange={(e) => handleApplicantChange('age', parseInt(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="annual_income">Annual Income ($)</Label>
          <Input
            id="annual_income"
            type="number"
            value={applicant.annual_income}
            onChange={(e) => handleApplicantChange('annual_income', parseFloat(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="credit_score">Credit Score (300-850)</Label>
          <Input
            id="credit_score"
            type="number"
            min={300}
            max={850}
            value={applicant.credit_score}
            onChange={(e) => handleApplicantChange('credit_score', parseInt(e.target.value))}
          />
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="loan_amount">Loan Amount ($)</Label>
          <Input
            id="loan_amount"
            type="number"
            value={applicant.loan_amount}
            onChange={(e) => handleApplicantChange('loan_amount', parseFloat(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="loan_term">Loan Term (months)</Label>
          <Input
            id="loan_term"
            type="number"
            value={applicant.loan_term}
            onChange={(e) => handleApplicantChange('loan_term', parseInt(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="interest_rate">Interest Rate (%)</Label>
          <Input
            id="interest_rate"
            type="number"
            step="0.1"
            value={applicant.interest_rate}
            onChange={(e) => handleApplicantChange('interest_rate', parseFloat(e.target.value))}
          />
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="debt_to_income_ratio">Debt-to-Income Ratio (%)</Label>
          <Input
            id="debt_to_income_ratio"
            type="number"
            value={applicant.debt_to_income_ratio}
            onChange={(e) => handleApplicantChange('debt_to_income_ratio', parseFloat(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="employment_status">Employment Status</Label>
          <Select 
            value={applicant.employment_status} 
            onValueChange={(v) => handleApplicantChange('employment_status', v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {employmentOptions.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="education_level">Education Level</Label>
          <Select 
            value={applicant.education_level} 
            onValueChange={(v) => handleApplicantChange('education_level', v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {educationOptions.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="loan_purpose">Loan Purpose</Label>
          <Select 
            value={applicant.loan_purpose} 
            onValueChange={(v) => handleApplicantChange('loan_purpose', v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {loanPurposeOptions.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="marital_status">Marital Status</Label>
          <Select 
            value={applicant.marital_status} 
            onValueChange={(v) => handleApplicantChange('marital_status', v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {maritalStatusOptions.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="residence_type">Residence Type</Label>
          <Select 
            value={applicant.residence_type} 
            onValueChange={(v) => handleApplicantChange('residence_type', v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {residenceTypeOptions.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="space-y-2">
          <Label htmlFor="delinquency_history">Delinquencies</Label>
          <Input
            id="delinquency_history"
            type="number"
            value={applicant.delinquency_history}
            onChange={(e) => handleApplicantChange('delinquency_history', parseInt(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="public_records">Public Records</Label>
          <Input
            id="public_records"
            type="number"
            value={applicant.public_records}
            onChange={(e) => handleApplicantChange('public_records', parseInt(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="years_at_current_job">Years at Job</Label>
          <Input
            id="years_at_current_job"
            type="number"
            value={applicant.years_at_current_job}
            onChange={(e) => handleApplicantChange('years_at_current_job', parseInt(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="years_at_current_residence">Years at Residence</Label>
          <Input
            id="years_at_current_residence"
            type="number"
            value={applicant.years_at_current_residence}
            onChange={(e) => handleApplicantChange('years_at_current_residence', parseInt(e.target.value))}
          />
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={saveApplicant} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            Save as Draft
          </Button>
          <Button onClick={saveApplicant} disabled={saving}>
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderDocuments = () => (
    <div className="space-y-6">
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-slate-900 bg-slate-50' : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-slate-900 mb-2">
          {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p className="text-sm text-slate-500 mb-4">
          or click to select files (PDF, images, docs)
        </p>
        <Button type="button" variant="outline">
          Select Files
        </Button>
      </div>

      <Button 
        variant="outline" 
        className="w-full" 
        disabled
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Auto-fill from documents (coming soon)
      </Button>

      {documents.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-slate-900">Uploaded Documents</h4>
          {documents.map((doc) => (
            <div 
              key={doc.document_id} 
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{doc.filename}</p>
                  <p className="text-xs text-slate-500">
                    {(doc.size ? (doc.size / 1024).toFixed(1) : '0')} KB
                  </p>
                </div>
              </div>
              <DocumentStatusBadge status={doc.status} />
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => setCurrentStep(0)}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={() => setCurrentStep(2)}>
          Next
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderReview = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Applicant Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-slate-50 rounded">
              <p className="text-xs text-slate-500">Age</p>
              <p className="font-medium">{applicant.age} years</p>
            </div>
            <div className="p-3 bg-slate-50 rounded">
              <p className="text-xs text-slate-500">Annual Income</p>
              <p className="font-medium">${applicant.annual_income?.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded">
              <p className="text-xs text-slate-500">Credit Score</p>
              <p className="font-medium">{applicant.credit_score}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded">
              <p className="text-xs text-slate-500">Loan Amount</p>
              <p className="font-medium">${applicant.loan_amount?.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded">
              <p className="text-xs text-slate-500">Employment</p>
              <p className="font-medium">{applicant.employment_status}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded">
              <p className="text-xs text-slate-500">Loan Purpose</p>
              <p className="font-medium">{applicant.loan_purpose}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded">
              <p className="text-xs text-slate-500">Debt-to-Income</p>
              <p className="font-medium">{applicant.debt_to_income_ratio}%</p>
            </div>
            <div className="p-3 bg-slate-50 rounded">
              <p className="text-xs text-slate-500">Documents</p>
              <p className="font-medium">{documents.length} uploaded</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>
          Running the courtroom debate will retrieve similar historical cases and 
          orchestrate a multi-agent debate. This typically takes 30-60 seconds.
        </AlertDescription>
      </Alert>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => setCurrentStep(1)}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleRunDebate} className="gap-2">
          <Play className="w-4 h-4" />
          Run Courtroom Debate
        </Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">New Case</h1>
        <p className="text-sm text-slate-500">Create a new loan application case</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {renderStepIndicator()}

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep].label}</CardTitle>
          <CardDescription>
            {currentStep === 0 && 'Enter applicant information for the loan request'}
            {currentStep === 1 && 'Upload supporting documents for verification'}
            {currentStep === 2 && 'Review and start the AI debate process'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === 0 && renderApplicantForm()}
          {currentStep === 1 && renderDocuments()}
          {currentStep === 2 && renderReview()}
        </CardContent>
      </Card>
    </div>
  );
}
