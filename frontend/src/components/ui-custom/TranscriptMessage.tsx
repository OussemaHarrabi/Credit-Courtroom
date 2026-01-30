import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { DebateMessage } from '@/types';
import { Shield, Scale, Gavel, MessageSquare, Clock, Network } from 'lucide-react';
import { format } from 'date-fns';

interface TranscriptMessageProps {
  message: DebateMessage;
  isLatest?: boolean;
  className?: string;
}

// Detect if message references fraud graph evidence
const containsFraudReference = (content: string): boolean => {
  const fraudKeywords = [
    'shared device',
    'shared ip',
    'shared merchant',
    'fraud cluster',
    'fraud neighbor',
    'neo4j',
    'network',
    'graph',
    'suspicious cluster',
    'defaulter',
  ];
  const lowerContent = content.toLowerCase();
  return fraudKeywords.some(keyword => lowerContent.includes(keyword));
};

const roleConfig = {
  RISK: {
    label: 'Risk Agent',
    icon: <Shield className="w-4 h-4" />,
    bgColor: 'bg-rose-50 border-rose-200',
    avatarColor: 'bg-rose-100 text-rose-700',
    textColor: 'text-rose-900',
  },
  ADVOCATE: {
    label: 'Advocate Agent',
    icon: <Scale className="w-4 h-4" />,
    bgColor: 'bg-emerald-50 border-emerald-200',
    avatarColor: 'bg-emerald-100 text-emerald-700',
    textColor: 'text-emerald-900',
  },
  MODERATOR: {
    label: 'Moderator',
    icon: <MessageSquare className="w-4 h-4" />,
    bgColor: 'bg-slate-50 border-slate-200',
    avatarColor: 'bg-slate-100 text-slate-700',
    textColor: 'text-slate-900',
  },
  JUDGE: {
    label: 'Judge',
    icon: <Gavel className="w-4 h-4" />,
    bgColor: 'bg-amber-50 border-amber-200',
    avatarColor: 'bg-amber-100 text-amber-700',
    textColor: 'text-amber-900',
  },
};

const stageLabels: Record<string, string> = {
  opening: 'Opening Arguments',
  rebuttal: 'Rebuttal',
  counter: 'Counter Arguments',
  final: 'Final Arguments',
  verdict: 'Verdict',
  done: 'Complete',
};

export function TranscriptMessage({ message, isLatest = false, className = '' }: TranscriptMessageProps) {
  const config = roleConfig[message.role];
  const hasFraudReference = containsFraudReference(message.content);
  
  return (
    <div className={`flex gap-4 ${isLatest ? 'animate-in fade-in slide-in-from-bottom-2' : ''} ${className}`}>
      <Avatar className={`w-10 h-10 ${config.avatarColor} border-2`}>
        <AvatarFallback className={config.avatarColor}>
          {config.icon}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`font-semibold text-sm ${config.textColor}`}>
            {config.label}
          </span>
          <span className="text-xs text-slate-400">•</span>
          <span className="text-xs text-slate-500">
            {stageLabels[message.stage] || message.stage}
          </span>
          <span className="text-xs text-slate-400">•</span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {format(new Date(message.timestamp), 'HH:mm:ss')}
          </span>
          {hasFraudReference && (
            <>
              <span className="text-xs text-slate-400">•</span>
              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                <Network className="w-3 h-3 mr-1" />
                Neo4j
              </Badge>
            </>
          )}
        </div>
        
        <Card className={`${config.bgColor} border ${hasFraudReference ? 'ring-1 ring-purple-200' : ''}`}>
          <CardContent className="p-4">
            <p className={`text-sm leading-relaxed whitespace-pre-wrap ${config.textColor}`}>
              {message.content}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
