import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { NeighborCase } from '@/types';
import { Scale, TrendingUp, TrendingDown } from 'lucide-react';

interface EvidenceCardProps {
  neighbor: NeighborCase;
  index: number;
  className?: string;
}

export function EvidenceCard({ neighbor, index, className = '' }: EvidenceCardProps) {
  const isRepaid = neighbor.outcome === 'repaid';
  
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="py-3 px-4 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Exhibit #{index + 1}</span>
            <Badge 
              variant={isRepaid ? 'default' : 'destructive'}
              className={`text-xs ${isRepaid ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100' : 'bg-rose-100 text-rose-800 hover:bg-rose-100'}`}
            >
              {isRepaid ? (
                <><TrendingUp className="w-3 h-3 mr-1" /> Repaid</>
              ) : (
                <><TrendingDown className="w-3 h-3 mr-1" /> Default</>
              )}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Scale className="w-3 h-3 text-slate-400" />
            <span className="text-sm font-medium text-slate-700">
              {(neighbor.similarity * 100).toFixed(1)}% match
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="mb-3">
          <Progress 
            value={neighbor.similarity * 100} 
            className="h-1.5"
          />
        </div>
        
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="text-center p-2 bg-slate-50 rounded">
            <div className="text-xs text-slate-500 mb-1">Age</div>
            <div className="font-medium text-slate-800">
              {(neighbor.payload_preview.age as number) || 'N/A'}
            </div>
          </div>
          <div className="text-center p-2 bg-slate-50 rounded">
            <div className="text-xs text-slate-500 mb-1">Credit Score</div>
            <div className="font-medium text-slate-800">
              {(neighbor.payload_preview.credit_score as number) || 'N/A'}
            </div>
          </div>
          <div className="text-center p-2 bg-slate-50 rounded">
            <div className="text-xs text-slate-500 mb-1">Income</div>
            <div className="font-medium text-slate-800">
              ${(((neighbor.payload_preview.annual_income as number) || 0) / 1000).toFixed(0)}k
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1.5">
          {neighbor.highlights.map((highlight, i) => (
            <span 
              key={i}
              className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full"
            >
              {highlight}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
