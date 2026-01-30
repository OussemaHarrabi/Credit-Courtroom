import { Badge } from '@/components/ui/badge';
import type { CaseStatusType } from '@/types';
import { 
  FileEdit, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock
} from 'lucide-react';

interface CaseStatusBadgeProps {
  status: CaseStatusType;
  className?: string;
}

const statusConfig: Record<CaseStatusType, { 
  label: string; 
  variant: 'default' | 'secondary' | 'outline' | 'destructive';
  icon: React.ReactNode;
}> = {
  draft: {
    label: 'Draft',
    variant: 'secondary',
    icon: <FileEdit className="w-3 h-3 mr-1" />,
  },
  ready: {
    label: 'Ready',
    variant: 'outline',
    icon: <Clock className="w-3 h-3 mr-1" />,
  },
  running: {
    label: 'Running',
    variant: 'default',
    icon: <Loader2 className="w-3 h-3 mr-1 animate-spin" />,
  },
  decided: {
    label: 'Decided',
    variant: 'default',
    icon: <CheckCircle2 className="w-3 h-3 mr-1" />,
  },
  failed: {
    label: 'Failed',
    variant: 'destructive',
    icon: <XCircle className="w-3 h-3 mr-1" />,
  },
};

export function CaseStatusBadge({ status, className = '' }: CaseStatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge variant={config.variant} className={`flex items-center ${className}`}>
      {config.icon}
      {config.label}
    </Badge>
  );
}
