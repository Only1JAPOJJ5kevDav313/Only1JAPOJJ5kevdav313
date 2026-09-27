import { Workflow } from 'lucide-react';
import { cn } from '@/lib/utils';

const TYPES = {
  advanced: { label: 'Advanced ATC', className: 'text-purple-400' },
  pfatc: { label: 'PFATC', className: 'text-blue-400' },
  standard: { label: 'Standard', className: 'text-emerald-400' },
} as const;

export default function SessionTypeLabel({
  isAdvancedATC,
  isPFATC,
  className,
}: {
  isAdvancedATC?: boolean;
  isPFATC?: boolean;
  className?: string;
}) {
  const type = isAdvancedATC ? 'advanced' : isPFATC ? 'pfatc' : 'standard';
  return (
    <span
      className={cn(
        'flex items-center gap-2 text-sm font-medium',
        TYPES[type].className,
        className
      )}
    >
      <Workflow className="size-4 shrink-0" />
      {TYPES[type].label}
    </span>
  );
}
