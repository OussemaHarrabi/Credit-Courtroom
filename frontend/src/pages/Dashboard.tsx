import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
import { StatsCard } from '@/components/ui-custom/StatsCard';
import { CaseStatusBadge } from '@/components/ui-custom/CaseStatusBadge';
import { VerdictBadge } from '@/components/ui-custom/VerdictBadge';
import { getDashboardStats, listCases } from '@/lib/api';
import type { Case, DashboardStats } from '@/types';
import { 
  Briefcase, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Plus, 
  Search,
  Clock,
  FileEdit,
  ArrowRight,
  Scale
} from 'lucide-react';
import { format } from 'date-fns';

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, casesData] = await Promise.all([
          getDashboardStats(),
          listCases(),
        ]);
        setStats(statsData);
        setCases(casesData.items);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredCases = cases.filter(c => 
    c.case_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.applicant?.loan_purpose.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getApplicantDisplay = (c: Case) => {
    if (!c.applicant) return `Applicant #${c.case_id.slice(-3)}`;
    return `${c.applicant.age}yo • ${c.applicant.employment_status} • $${(c.applicant.annual_income / 1000).toFixed(0)}k`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Overview of your credit decision cases
          </p>
        </div>
        <Link to="/cases/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Case
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Cases"
          value={stats?.total_cases || 0}
          description="All time cases"
          icon={Briefcase}
          loading={loading}
        />
        <StatsCard
          title="Approved"
          value={stats?.approvals || 0}
          description={`${stats ? Math.round((stats.approvals / stats.total_cases) * 100) : 0}% approval rate`}
          icon={CheckCircle2}
          trend="up"
          trendValue="+12%"
          loading={loading}
        />
        <StatsCard
          title="Rejected"
          value={stats?.rejects || 0}
          description={`${stats ? Math.round((stats.rejects / stats.total_cases) * 100) : 0}% rejection rate`}
          icon={XCircle}
          trend="down"
          trendValue="-5%"
          loading={loading}
        />
        <StatsCard
          title="Manual Review"
          value={stats?.manual_reviews || 0}
          description="Awaiting analyst"
          icon={HelpCircle}
          loading={loading}
        />
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileEdit className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Draft Cases</p>
                <p className="text-xs text-slate-500">Awaiting submission</p>
              </div>
            </div>
            <span className="text-2xl font-bold text-slate-900">{stats?.draft_cases || 0}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Running</p>
                <p className="text-xs text-slate-500">Debate in progress</p>
              </div>
            </div>
            <span className="text-2xl font-bold text-slate-900">{stats?.running_cases || 0}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Scale className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Decided</p>
                <p className="text-xs text-slate-500">Cases with verdict</p>
              </div>
            </div>
            <span className="text-2xl font-bold text-slate-900">
              {stats ? stats.approvals + stats.rejects + stats.manual_reviews : 0}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Recent Cases */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Recent Cases</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search cases..."
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
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No cases found</p>
              <Link to="/cases/new">
                <Button variant="link" className="mt-2">
                  Create your first case
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case ID</TableHead>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Loan Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verdict</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases.map((c) => (
                  <TableRow key={c.case_id} className="cursor-pointer hover:bg-slate-50">
                    <TableCell className="font-medium">
                      <Link to={`/cases/${c.case_id}`} className="text-slate-900 hover:text-slate-700">
                        #{c.case_id.toUpperCase()}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="font-medium text-slate-900">{getApplicantDisplay(c)}</p>
                        <p className="text-xs text-slate-500">{c.applicant?.loan_purpose || 'N/A'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {c.applicant ? (
                        <span className="font-medium">
                          ${c.applicant.loan_amount.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <CaseStatusBadge status={c.status} />
                    </TableCell>
                    <TableCell>
                      <VerdictBadge verdict={c.decision?.verdict || null} size="sm" />
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {format(new Date(c.updated_at), 'MMM d, HH:mm')}
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
