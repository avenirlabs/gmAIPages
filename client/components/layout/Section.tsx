import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface SectionProps {
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "hero" | "content" | "feature";
  as?: "section" | "div" | "main" | "article" | "aside";
}

/**
 * Section layout primitive - provides consistent vertical rhythm and spacing
 * based on design tokens with configurable sizes and semantic variants
 */
export function Section({
  children,
  className,
  size = "md",
  variant = "default",
  as: Component = "section"
}: SectionProps) {
  const sizeClasses = {
    sm: "py-8 md:py-12",          // 32px-48px vertical padding
    md: "py-12 md:py-16",         // 48px-64px vertical padding
    lg: "py-16 md:py-20",         // 64px-80px vertical padding
    xl: "py-20 md:py-24"          // 80px-96px vertical padding
  };

  const variantClasses = {
    default: "space-y-6",                                    // Standard content spacing
    hero: "text-center space-y-6 md:space-y-8",            // Hero sections with centered text
    content: "prose prose-lg max-w-none space-y-4",        // Long-form content
    feature: "grid gap-8 md:gap-12"                        // Feature grids with consistent gaps
  };

  return (
    <Component className={cn(
      sizeClasses[size],
      variantClasses[variant],
      className
    )}>
      {children}
    </Component>
  );
}