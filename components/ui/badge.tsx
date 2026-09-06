import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide transition-colors focus:outline-none',
  {
    variants: {
      variant: {
        default: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300',
        secondary: 'border-white/10 bg-white/[0.06] text-slate-300',
        destructive: 'border-red-500/40 bg-red-500/15 text-red-300',
        warning: 'border-amber-500/35 bg-amber-500/10 text-amber-300',
        success: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300',
        info: 'border-sky-500/35 bg-sky-500/10 text-sky-300',
        outline: 'border-white/12 text-slate-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
