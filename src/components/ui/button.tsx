import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/85 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/85 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
        outline: "border border-border bg-background hover:bg-muted hover:border-foreground/20 hover:-translate-y-0.5 active:translate-y-0",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/70 hover:-translate-y-0.5 active:translate-y-0",
        ghost: "hover:bg-muted/60 rounded-lg",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/70",
        glass: "bg-white/70 backdrop-blur-md border border-border/50 text-foreground hover:bg-white/90 hover:-translate-y-0.5 active:translate-y-0",
        sticky: "bg-accent text-accent-foreground shadow-sm hover:bg-accent/85 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
        ink: "bg-foreground text-background shadow-sm hover:bg-foreground/85 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
        pencil: "border border-dashed border-border bg-background text-muted-foreground hover:bg-muted hover:border-foreground/30 hover:-translate-y-0.5 active:translate-y-0",
        bubble: "bg-primary/8 text-foreground border border-primary/15 hover:bg-primary/15 hover:border-primary/30 hover:-translate-y-0.5 active:translate-y-0",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-13 px-10 text-base",
        icon: "h-11 w-11",
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
