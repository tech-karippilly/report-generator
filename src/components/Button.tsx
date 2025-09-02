import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

function variantClasses(variant: Variant, disabled?: boolean): string {
  const base = "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";
  if (disabled) return base;
  switch (variant) {
    case "primary":
      return `${base} text-white bg-blue-600 hover:bg-blue-700`;
    case "secondary":
      return `${base} text-gray-800 border border-gray-300 bg-white hover:bg-gray-50`;
    case "danger":
      return `${base} text-white bg-red-600 hover:bg-red-700`;
    case "ghost":
    default:
      return `${base} text-gray-700 hover:bg-gray-100`;
  }
}

export default function Button({ variant = "secondary", className = "", disabled, children, ...props }: PropsWithChildren<ButtonProps>) {
  return (
    <button className={`${variantClasses(variant, disabled)} ${className}`} disabled={disabled} {...props}>
      {children}
    </button>
  );
}


