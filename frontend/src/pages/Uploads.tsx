import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { DocumentStatusBadge } from '@/components/ui-custom/DocumentStatusBadge';
import { listCases } from '@/lib/api';
import type { Case, Document } from '@/types';
import { FileText, Search, Eye, Download, Calendar, Briefcase } from 'lucide-react';
import { format } from 'date-fns';

interface DocumentWithCase extends Document {
  case?: Case;
}

export function Uploads() {
  const [documents, setDocuments] = useState<DocumentWithCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<DocumentWithCase | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const casesResponse = await listCases();
      const allDocs: DocumentWithCase[] = [];
      
      for (const case_ of casesResponse.items) {
        for (const doc of case_.documents) {
          allDocs.push({ ...doc, case: case_ });
        }
      }
      
      setDocuments(allDocs.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocs = documents.filter(doc =>
    doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.case?.case_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFileIcon = (contentType: string) => {
    if (contentType.includes('pdf')) return 'PDF';
    if (contentType.includes('image')) return 'IMG';
    return 'DOC';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Uploads</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage uploaded documents across all cases
          </p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search documents..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No documents found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Case</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocs.map((doc) => (
                  <TableRow key={doc.document_id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                          <span className="text-xs font-medium text-slate-600">
                            {getFileIcon(doc.content_type)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{doc.filename}</p>
                          <p className="text-xs text-slate-500">{doc.content_type}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {doc.case ? (
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-slate-400" />
                          <span className="text-sm">#{doc.case.case_id.toUpperCase()}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DocumentStatusBadge status={doc.status} />
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600">
                        {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(doc.created_at), 'MMM d, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setSelectedDoc(doc)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Document Preview Drawer */}
      {selectedDoc && (
        <div 
          className="fixed inset-0 bg-black/50 z-50"
          onClick={() => setSelectedDoc(null)}
        >
          <div 
            className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Document Preview</h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedDoc(null)}>
                Close
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="w-full h-48 bg-slate-100 rounded-lg flex items-center justify-center">
                <FileText className="w-16 h-16 text-slate-300" />
              </div>
              
              <div>
                <p className="text-sm text-slate-500">Filename</p>
                <p className="font-medium">{selectedDoc.filename}</p>
              </div>
              
              <div>
                <p className="text-sm text-slate-500">Status</p>
                <DocumentStatusBadge status={selectedDoc.status} />
              </div>
              
              <div>
                <p className="text-sm text-slate-500">Size</p>
                <p className="font-medium">
                  {selectedDoc.size ? `${(selectedDoc.size / 1024).toFixed(1)} KB` : '-'}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-slate-500">Uploaded</p>
                <p className="font-medium">
                  {format(new Date(selectedDoc.created_at), 'MMM d, yyyy HH:mm')}
                </p>
              </div>
              
              {selectedDoc.extracted_fields && (
                <div>
                  <p className="text-sm text-slate-500">Extracted Fields</p>
                  <pre className="text-xs bg-slate-50 p-2 rounded mt-1 overflow-auto">
                    {JSON.stringify(selectedDoc.extracted_fields, null, 2)}
                  </pre>
                </div>
              )}
              
              <Button className="w-full" variant="outline" disabled>
                <Download className="w-4 h-4 mr-2" />
                Download (Coming Soon)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
