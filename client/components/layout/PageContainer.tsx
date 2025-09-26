import React from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;          // extra classes for <main>
  contentClassName?: string;   // extra classes for the inner content wrapper
};

export default function PageContainer({ children, className, contentClassName }: Props) {
  return (
    <main className={cn("min-h-[60vh] py-8", className)}>
      <div className="container mx-auto px-4">
        <div className={cn("prose prose-lg max-w-none text-[#333] leading-7 md:leading-8", contentClassName)}>
          {children}
        </div>
      </div>
    </main>
  );
}
