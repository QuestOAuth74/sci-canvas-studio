import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-sm",
  {
    variants: {
      variant: {
        default: "border-transparent bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-gradient-to-r from-destructive to-rose-400 text-destructive-foreground shadow-md shadow-destructive/20",
        outline: "text-foreground border-2 border-border hover:bg-muted",
        gradient: "border-transparent bg-gradient-to-r from-primary via-accent to-cyan-400 text-white shadow-lg shadow-primary/25 hover:shadow-xl",
        "gradient-purple": "border-transparent bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-purple-500/25",
        "gradient-blue": "border-transparent bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/25",
        "gradient-green": "border-transparent bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/25",
        "gradient-orange": "border-transparent bg-gradient-to-r from-orange-500 to-amber-400 text-white shadow-lg shadow-orange-500/25",
        bubble: "border-2 border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
