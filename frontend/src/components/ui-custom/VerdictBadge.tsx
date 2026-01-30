import { Badge } from '@/components/ui/badge';
import type { VerdictType } from '@/types';
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';

interface VerdictBadgeProps {
  verdict: VerdictType | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const verdictConfig: Record<VerdictType, { 
  label: string; 
  variant: 'default' | 'secondary' | 'outline' | 'destructive';
  icon: React.ReactNode;
  bgColor: string;
}> = {
  approve: {
    label: 'Approve',
    variant: 'default',
    icon: <CheckCircle2 className="mr-1" />,
    bgColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  reject: {
    label: 'Reject',
    variant: 'destructive',
    icon: <XCircle className="mr-1" />,
    bgColor: 'bg-rose-100 text-rose-800 border-rose-200',
  },
  manual_review: {
    label: 'Manual Review',
    variant: 'secondary',
    icon: <HelpCircle className="mr-1" />,
    bgColor: 'bg-amber-100 text-amber-800 border-amber-200',
  },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-2',
};

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export function VerdictBadge({ verdict, size = 'md', className = '' }: VerdictBadgeProps) {
  if (!verdict) {
    return (
      <Badge variant="outline" className={`${sizeClasses[size]} ${className}`}>
        Pending
      </Badge>
    );
  }

  const config = verdictConfig[verdict];
  
  return (
    <Badge 
      variant={config.variant} 
      className={`flex items-center font-medium ${config.bgColor} ${sizeClasses[size]} ${className}`}
    >
      <span className={iconSizes[size]}>{config.icon}</span>
      {config.label}
    </Badge>
  );
}
