import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { listPolicies, uploadPolicy } from '@/lib/api';
import type { Policy } from '@/types';
import { useDropzone } from 'react-dropzone';
import { 
  FileText, 
  Upload, 
  Search, 
  Calendar, 
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Scale,
  Gavel,
  HelpCircle
} from 'lucide-react';
import { format } from 'date-fns';

const policyTypeConfig = {
  eligibility: { label: 'Eligibility', icon: CheckCircle2, color: 'bg-blue-100 text-blue-800' },
  risk_threshold: { label: 'Risk Threshold', icon: Scale, color: 'bg-amber-100 text-amber-800' },
  regulatory: { label: 'Regulatory', icon: Gavel, color: 'bg-purple-100 text-purple-800' },
  manual_review: { label: 'Manual Review', icon: HelpCircle, color: 'bg-slate-100 text-slate-800' },
};

export function Policies() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [newPolicyName, setNewPolicyName] = useState('');
  const [newPolicyType, setNewPolicyType] = useState<Policy['document_type']>('eligibility');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      const response = await listPolicies();
      setPolicies(response.items);
    } catch (error) {
      console.error('Failed to load policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
      setUploadError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!selectedFile || !newPolicyName) {
      setUploadError('Please provide a policy name and select a file');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      await uploadPolicy(selectedFile, newPolicyName, newPolicyType);
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setNewPolicyName('');
      loadPolicies();
    } catch (error) {
      setUploadError('Failed to upload policy');
    } finally {
      setUploading(false);
    }
  };

  const filteredPolicies = policies.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.document_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Policies</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage bank policies for policy-aware RAG
          </p>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Upload className="w-4 h-4" />
              Upload Policy
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Upload New Policy</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="policy-name">Policy Name</Label>
                <Input
                  id="policy-name"
                  placeholder="e.g., Credit Score Eligibility Policy"
                  value={newPolicyName}
                  onChange={(e) => setNewPolicyName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="policy-type">Policy Type</Label>
                <Select 
                  value={newPolicyType} 
                  onValueChange={(v) => setNewPolicyType(v as Policy['document_type'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eligibility">Eligibility Rules</SelectItem>
                    <SelectItem value="risk_threshold">Risk Thresholds</SelectItem>
                    <SelectItem value="regulatory">Regulatory Constraints</SelectItem>
                    <SelectItem value="manual_review">Manual Review Conditions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-slate-900 bg-slate-50' : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600">
                  {selectedFile ? selectedFile.name : 'Drag & drop or click to select'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  PDF, DOC, or DOCX (max 10MB)
                </p>
              </div>

              {uploadError && (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>{uploadError}</AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={handleUpload} 
                disabled={uploading || !selectedFile || !newPolicyName}
                className="w-full"
              >
                {uploading ? 'Uploading...' : 'Upload Policy'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Total Policies</p>
              </div>
            </div>
            <span className="text-2xl font-bold">{policies.length}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700">Eligibility</p>
              </div>
            </div>
            <span className="text-2xl font-bold text-blue-700">
              {policies.filter(p => p.document_type === 'eligibility').length}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Scale className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-700">Risk Thresholds</p>
              </div>
            </div>
            <span className="text-2xl font-bold text-amber-700">
              {policies.filter(p => p.document_type === 'risk_threshold').length}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Gavel className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-700">Regulatory</p>
              </div>
            </div>
            <span className="text-2xl font-bold text-purple-700">
              {policies.filter(p => p.document_type === 'regulatory').length}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Policies Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">All Policies</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search policies..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredPolicies.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No policies found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Policy</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Clauses</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uploaded</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPolicies.map((policy) => {
                  const typeConfig = policyTypeConfig[policy.document_type];
                  const Icon = typeConfig.icon;
                  return (
                    <TableRow key={policy.policy_id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-4 h-4 text-slate-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{policy.name}</p>
                            <p className="text-xs text-slate-500">{policy.filename}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={typeConfig.color}>
                          <Icon className="w-3 h-3 mr-1" />
                          {typeConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">{policy.version}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600">{policy.clauses_count} clauses</span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={policy.status === 'active' ? 'default' : 'secondary'}
                          className={policy.status === 'active' ? 'bg-emerald-100 text-emerald-800' : ''}
                        >
                          {policy.status === 'active' ? (
                            <><CheckCircle2 className="w-3 h-3 mr-1" /> Active</>
                          ) : (
                            'Archived'
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(policy.uploaded_at), 'MMM d, yyyy')}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
