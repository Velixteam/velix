import * as React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const classes = cn(
      "inline-flex flex-row gap-2 items-center justify-center font-medium transition-all duration-300 h-12 rounded-xl px-8 focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/50",
      variant === 'primary' ? "bg-[#2563EB] text-white hover:bg-[#1E3A8A] shadow-[0_0_15px_rgba(37,99,235,0.2)] hover:shadow-[0_0_25px_rgba(34,211,238,0.4)]" : "bg-[#1E293B] text-slate-200 border border-slate-700 hover:bg-[#0F172A] hover:border-[#2563EB]",
      className
    );
    return <button className={classes} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";
