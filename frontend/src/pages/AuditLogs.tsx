import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { listCases, getAuditEvents } from '@/lib/api';
import type { Case, AuditEvent } from '@/types';
import { 
  ClipboardList, 
  Search, 
  Calendar, 
  Briefcase, 
  User, 
  FileText, 
  Scale,
  MessageSquare,
  Gavel,
  Download,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';

interface AuditEventWithCase extends AuditEvent {
  case?: Case;
}

export function AuditLogs() {
  const [events, setEvents] = useState<AuditEventWithCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      const casesResponse = await listCases();
      const allEvents: AuditEventWithCase[] = [];
      
      for (const case_ of casesResponse.items) {
        const caseEvents = await getAuditEvents(case_.case_id);
        for (const event of caseEvents) {
          allEvents.push({ ...event, case: case_ });
        }
      }
      
      setEvents(allEvents.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ));
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event =>
    event.case?.case_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.event_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'created_case': return <Briefcase className="w-4 h-4" />;
      case 'updated_applicant': return <User className="w-4 h-4" />;
      case 'uploaded_docs': return <FileText className="w-4 h-4" />;
      case 'retrieved_neighbors': return <Scale className="w-4 h-4" />;
      case 'debate_started': return <MessageSquare className="w-4 h-4" />;
      case 'judge_decision': return <Gavel className="w-4 h-4" />;
      default: return <ClipboardList className="w-4 h-4" />;
    }
  };

  const getEventLabel = (eventType: string) => {
    return eventType.split('_').map(w => 
      w.charAt(0).toUpperCase() + w.slice(1)
    ).join(' ');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
          <p className="text-sm text-slate-500 mt-1">
            Immutable record of all system activities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search audit logs..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="w-4 h-4" />
          </Button>
          <Button variant="outline" disabled>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Events</CardTitle>
          <CardDescription>
            Complete audit trail across all cases
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No audit events found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Case</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => (
                  <TableRow key={event.event_id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                          {getEventIcon(event.event_type)}
                        </div>
                        <span className="font-medium text-slate-900">
                          {getEventLabel(event.event_type)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {event.case ? (
                        <Badge variant="outline">
                          #{event.case.case_id.toUpperCase()}
                        </Badge>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600">
                        {JSON.stringify(event.metadata).slice(0, 60)}
                        {JSON.stringify(event.metadata).length > 60 ? '...' : ''}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(event.timestamp), 'MMM d, yyyy HH:mm:ss')}
                      </div>
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
