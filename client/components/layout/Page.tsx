import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface PageProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "full-width" | "narrow";
}

/**
 * Page layout primitive - provides consistent page structure with proper spacing
 * and responsive containers based on design tokens
 */
export function Page({
  children,
  className,
  variant = "default"
}: PageProps) {
  const containerClasses = {
    default: "container mx-auto px-4 sm:px-6 lg:px-8",
    "full-width": "w-full",
    narrow: "container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8"
  };

  return (
    <div className={cn(
      "min-h-screen font-body text-foreground bg-background",
      className
    )}>
      <div className={cn(
        "grid min-h-screen grid-rows-[auto_1fr_auto]",
        containerClasses[variant]
      )}>
        {children}
      </div>
    </div>
  );
}