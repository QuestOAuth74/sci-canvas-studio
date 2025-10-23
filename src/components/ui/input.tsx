import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border-[3px] border-foreground/30 bg-gradient-to-br from-background via-background to-muted/40 px-3 py-2 text-sm font-medium ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-bold placeholder:text-muted-foreground placeholder:font-normal focus-visible:outline-none focus-visible:ring-0 focus-visible:border-primary focus-visible:border-[3px] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-150 neo-shadow-sm focus-visible:translate-x-[3px] focus-visible:translate-y-[3px] focus-visible:shadow-none focus-visible:bg-accent/5",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
