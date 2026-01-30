import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import type { FraudSignals } from '@/types';
import { Shield, AlertTriangle, Smartphone, Globe, Store, Users } from 'lucide-react';

interface FraudNetworkPanelProps {
  fraudSignals: FraudSignals | null;
  loading?: boolean;
}

const getSeverityColor = (value: number, thresholds: { low: number; high: number }) => {
  if (value <= thresholds.low) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (value <= thresholds.high) return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-rose-600 bg-rose-50 border-rose-200';
};

export function FraudNetworkPanel({ fraudSignals, loading = false }: FraudNetworkPanelProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!fraudSignals) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-slate-500" />
            Fraud Network Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">
            <p>No fraud signals available</p>
            <p className="text-sm text-slate-400 mt-1">
              Fraud analysis will be computed when the debate starts
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const metrics = [
    {
      label: 'Shared Devices',
      value: fraudSignals.shared_device_count,
      icon: Smartphone,
      thresholds: { low: 0, high: 2 },
      description: 'Devices shared with other applicants',
    },
    {
      label: 'Shared IPs',
      value: fraudSignals.shared_ip_count,
      icon: Globe,
      thresholds: { low: 1, high: 3 },
      description: 'IP addresses shared with other applicants',
    },
    {
      label: 'Shared Merchants',
      value: fraudSignals.shared_merchant_count,
      icon: Store,
      thresholds: { low: 2, high: 4 },
      description: 'Merchants with transaction overlaps',
    },
    {
      label: 'Known Fraud Neighbors',
      value: fraudSignals.known_fraud_neighbor_count,
      icon: Users,
      thresholds: { low: 0, high: 1 },
      description: 'Neighbors with default/fraud outcomes',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-slate-600" />
            Fraud Network Analysis
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            Neo4j Graph
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Fraud Cluster Score */}
        <div className="p-4 bg-slate-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-slate-500" />
              <span className="font-medium text-slate-700">Fraud Cluster Score</span>
            </div>
            <span className={`text-2xl font-bold ${
              fraudSignals.fraud_cluster_score <= 0.3 ? 'text-emerald-600' :
              fraudSignals.fraud_cluster_score <= 0.6 ? 'text-amber-600' : 'text-rose-600'
            }`}>
              {(fraudSignals.fraud_cluster_score * 100).toFixed(0)}%
            </span>
          </div>
          <Progress 
            value={fraudSignals.fraud_cluster_score * 100} 
            className="h-2"
          />
          <p className="text-xs text-slate-500 mt-2">
            Composite score based on graph connectivity patterns
          </p>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 gap-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            const severityClass = getSeverityColor(metric.value, metric.thresholds);
            
            return (
              <div 
                key={metric.label}
                className={`p-4 rounded-lg border ${severityClass}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{metric.label}</span>
                </div>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs opacity-80 mt-1">{metric.description}</p>
              </div>
            );
          })}
        </div>

        {/* Fraud Flags */}
        {fraudSignals.fraud_flags.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-2">Fraud Flags</h4>
            <div className="flex flex-wrap gap-2">
              {fraudSignals.fraud_flags.map((flag, index) => (
                <Badge 
                  key={index}
                  variant="outline"
                  className="bg-rose-50 text-rose-700 border-rose-200"
                >
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {flag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {fraudSignals.fraud_flags.length === 0 && (
          <div className="flex items-center gap-2 text-emerald-600">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">No fraud flags detected</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
