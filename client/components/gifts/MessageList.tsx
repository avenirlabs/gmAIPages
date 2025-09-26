import React from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export default function MessageList({ children, className }: Props) {
  // Keeps messages readable; results grid can be full width below.
  return (
    <div className={cn("max-w-[78ch] mx-auto space-y-6", className)}>
      {children}
    </div>
  );
}