import { Badge } from '@/components/ui/badge';
import type { DocumentStatusType } from '@/types';
import { CheckCircle2, Loader2, FileText, AlertCircle } from 'lucide-react';

interface DocumentStatusBadgeProps {
  status: DocumentStatusType;
  className?: string;
}

const statusConfig: Record<DocumentStatusType, { 
  label: string; 
  variant: 'default' | 'secondary' | 'outline' | 'destructive';
  icon: React.ReactNode;
  className: string;
}> = {
  uploaded: {
    label: 'Uploaded',
    variant: 'secondary',
    icon: <FileText className="w-3 h-3 mr-1" />,
    className: 'bg-slate-100 text-slate-700',
  },
  parsing: {
    label: 'Parsing',
    variant: 'default',
    icon: <Loader2 className="w-3 h-3 mr-1 animate-spin" />,
    className: 'bg-blue-100 text-blue-700',
  },
  extracted: {
    label: 'Extracted',
    variant: 'default',
    icon: <CheckCircle2 className="w-3 h-3 mr-1" />,
    className: 'bg-emerald-100 text-emerald-700',
  },
  error: {
    label: 'Error',
    variant: 'destructive',
    icon: <AlertCircle className="w-3 h-3 mr-1" />,
    className: 'bg-rose-100 text-rose-700',
  },
};

export function DocumentStatusBadge({ status, className = '' }: DocumentStatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge 
      variant={config.variant} 
      className={`flex items-center ${config.className} ${className}`}
    >
      {config.icon}
      {config.label}
    </Badge>
  );
}
