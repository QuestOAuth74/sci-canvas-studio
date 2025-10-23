import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground border-[3px] border-foreground neo-shadow hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[2px_2px_0px_0px_hsl(var(--foreground))] active:translate-x-[5px] active:translate-y-[5px] active:shadow-none before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/30 before:to-transparent before:pointer-events-none after:absolute after:inset-0 after:bg-gradient-to-br after:from-accent/20 after:via-transparent after:to-transparent after:pointer-events-none",
        destructive: "bg-gradient-to-br from-destructive via-destructive to-destructive/90 text-destructive-foreground border-[3px] border-foreground neo-shadow hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[2px_2px_0px_0px_hsl(var(--foreground))] active:translate-x-[5px] active:translate-y-[5px] active:shadow-none",
        outline: "border-[3px] border-foreground bg-background hover:bg-accent/10 neo-shadow hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[2px_2px_0px_0px_hsl(var(--foreground))]",
        secondary: "bg-gradient-to-br from-secondary via-secondary to-secondary/90 text-secondary-foreground border-[3px] border-foreground neo-shadow hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[2px_2px_0px_0px_hsl(var(--foreground))] active:translate-x-[5px] active:translate-y-[5px] active:shadow-none before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/30 before:to-transparent before:pointer-events-none",
        ghost: "hover:bg-accent/20 hover:border-2 hover:border-foreground/30 hover:neo-shadow-sm hover:translate-x-[2px] hover:translate-y-[2px]",
        link: "text-primary underline-offset-4 hover:underline hover:text-secondary transition-colors",
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
