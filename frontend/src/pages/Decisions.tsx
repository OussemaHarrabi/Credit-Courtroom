import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { VerdictBadge } from '@/components/ui-custom/VerdictBadge';
import { listCases } from '@/lib/api';
import type { Case } from '@/types';
import { Scale, Search, ArrowRight, TrendingUp, TrendingDown, HelpCircle } from 'lucide-react';
import { format } from 'date-fns';

export function Decisions() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDecisions();
  }, []);

  const loadDecisions = async () => {
    try {
      const response = await listCases();
      setCases(response.items.filter(c => c.decision));
    } catch (error) {
      console.error('Failed to load decisions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCases = cases.filter(c =>
    c.case_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.decision?.verdict.includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: cases.length,
    approve: cases.filter(c => c.decision?.verdict === 'approve').length,
    reject: cases.filter(c => c.decision?.verdict === 'reject').length,
    manual_review: cases.filter(c => c.decision?.verdict === 'manual_review').length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Decisions</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review all credit decision outcomes
          </p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search decisions..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Scale className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Total Decisions</p>
              </div>
            </div>
            <span className="text-2xl font-bold">{stats.total}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-700">Approved</p>
              </div>
            </div>
            <span className="text-2xl font-bold text-emerald-700">{stats.approve}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-rose-700">Rejected</p>
              </div>
            </div>
            <span className="text-2xl font-bold text-rose-700">{stats.reject}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-700">Manual Review</p>
              </div>
            </div>
            <span className="text-2xl font-bold text-amber-700">{stats.manual_review}</span>
          </CardContent>
        </Card>
      </div>

      {/* Decisions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Decisions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="text-center py-12">
              <Scale className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No decisions found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case ID</TableHead>
                  <TableHead>Verdict</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Evidence Used</TableHead>
                  <TableHead>Decided</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases.map((c) => (
                  <TableRow key={c.case_id}>
                    <TableCell className="font-medium">
                      #{c.case_id.toUpperCase()}
                    </TableCell>
                    <TableCell>
                      <VerdictBadge verdict={c.decision?.verdict || null} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-20">
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                c.decision?.confidence && c.decision.confidence > 0.8
                                  ? 'bg-emerald-500'
                                  : c.decision?.confidence && c.decision.confidence > 0.6
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                              }`}
                              style={{ width: `${(c.decision?.confidence || 0) * 100}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-sm text-slate-600">
                          {Math.round((c.decision?.confidence || 0) * 100)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {c.decision?.evidence_refs.slice(0, 3).map((ref) => (
                          <Badge key={ref} variant="secondary" className="text-xs">
                            #{ref.split('_')[1]}
                          </Badge>
                        ))}
                        {(c.decision?.evidence_refs.length || 0) > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{(c.decision?.evidence_refs.length || 0) - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {format(new Date(c.updated_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Link to={`/cases/${c.case_id}`}>
                        <Button variant="ghost" size="icon">
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
