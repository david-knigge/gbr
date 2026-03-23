import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "accent";
type Size = "sm" | "md" | "lg" | "xl";

const variantClasses: Record<Variant, string> = {
  primary: "bg-teal text-white hover:bg-teal-dark active:bg-teal-dark shadow-sm",
  secondary: "bg-white text-foreground border-2 border-card-border hover:border-muted active:bg-gray-50",
  ghost: "text-muted hover:text-foreground hover:bg-black/5",
  accent: "bg-primary text-white hover:bg-primary-light active:bg-primary-dark shadow-sm",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-4 py-2 text-sm rounded-lg",
  md: "px-5 py-2.5 text-sm rounded-lg",
  lg: "px-6 py-3 text-base rounded-lg",
  xl: "px-8 py-4 text-base rounded-lg",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center font-semibold transition-all
        disabled:opacity-40 disabled:pointer-events-none
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
