import React from "react";
import { cn } from "@/lib/utils";
import { cva, VariantProps } from "class-variance-authority";

const glowVariants = cva("absolute w-full", {
  variants: {
    variant: {
      top: "top-0",
      above: "-top-[128px]",
      bottom: "bottom-0",
      below: "-bottom-[128px]",
      center: "top-[50%] -translate-y-1/2",
    },
  },
  defaultVariants: {
    variant: "top",
  },
});

const Glow = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof glowVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(glowVariants({ variant }), className)}
    {...props}
  >
    <div
      className="absolute inset-0 blur-[120px] opacity-50"
      style={{
        background:
          "radial-gradient(ellipse 50% 80% at 50% 50%, hsl(var(--brand)), transparent)",
      }}
    />
    <div
      className="absolute inset-0 blur-[80px] opacity-30"
      style={{
        background:
          "radial-gradient(ellipse 40% 60% at 50% 50%, hsl(var(--brand-foreground)), transparent)",
      }}
    />
  </div>
));
Glow.displayName = "Glow";

export { Glow };
