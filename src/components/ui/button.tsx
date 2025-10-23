import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-b from-primary to-primary/90 text-primary-foreground border-2 border-foreground neo-shadow-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:to-transparent before:pointer-events-none",
        destructive: "bg-gradient-to-b from-destructive to-destructive/90 text-destructive-foreground border-2 border-foreground neo-shadow-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none",
        outline: "border-2 border-foreground bg-background hover:bg-muted neo-shadow-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none",
        secondary: "bg-gradient-to-b from-secondary to-secondary/90 text-secondary-foreground border-2 border-foreground neo-shadow-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none",
        ghost: "hover:bg-muted/50 hover:border-2 hover:border-foreground/20",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
