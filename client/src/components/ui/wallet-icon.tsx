import React from "react";
import { Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface WalletIconProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function WalletIcon({ className, size = "md" }: WalletIconProps) {
  const sizeMap = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-10 w-10",
    xl: "h-16 w-16",
  };

  return (
    <div className={cn("rounded-full bg-primary-100 p-3 text-primary-700", className)}>
      <Wallet className={sizeMap[size]} />
    </div>
  );
}