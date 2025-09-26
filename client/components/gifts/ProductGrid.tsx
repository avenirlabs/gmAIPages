import React from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export default function ProductGrid({ children, className }: Props) {
  return (
    <div
      className={cn(
        // responsive grid with comfortable gaps & full-bleed within the container
        "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6",
        className
      )}
    >
      {children}
    </div>
  );
}