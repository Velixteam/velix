import * as React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const classes = cn(
      "inline-flex flex-row gap-2 items-center justify-center font-medium transition-all duration-300 h-12 rounded-xl px-8 focus:outline-none focus:ring-2 focus:ring-velix-cyan/50",
      variant === 'primary' ? "bg-gradient-to-r from-velix-accent to-velix-cyan text-white shadow-[0_0_20px_rgba(34,211,238,0.25)] hover:shadow-[0_0_30px_rgba(34,211,238,0.45)]" : "bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10 hover:border-velix-cyan/30",
      className
    );
    return <button className={classes} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";
