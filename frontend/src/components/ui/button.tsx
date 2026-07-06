import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border text-sm font-semibold tracking-normal shadow-soft transition-all duration-200 ease-out focus-visible:outline-none disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-45 active:translate-y-px active:shadow-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-brand/60 bg-brand text-brand-foreground hover:-translate-y-0.5 hover:bg-brand/90 hover:shadow-brand-glow",
        brand: "border-brand/60 bg-brand text-brand-foreground hover:-translate-y-0.5 hover:bg-brand/90 hover:shadow-brand-glow",
        destructive:
          "border-destructive/70 bg-destructive text-destructive-foreground hover:-translate-y-0.5 hover:bg-destructive/90",
        outline:
          "border-foreground/18 bg-white/86 text-foreground hover:-translate-y-0.5 hover:border-brand/40 hover:bg-accent/55 hover:text-accent-foreground",
        secondary:
          "border-secondary/60 bg-secondary text-secondary-foreground hover:-translate-y-0.5 hover:bg-secondary/90",
        ghost:
          "border-transparent bg-transparent shadow-none text-foreground hover:border-foreground/12 hover:bg-white/75 hover:shadow-soft",
        link:
          "border-transparent bg-transparent p-0 text-brand shadow-none underline-offset-4 hover:underline active:translate-y-0 active:shadow-none",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-7 text-[15px]",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
