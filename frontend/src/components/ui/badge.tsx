import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "count" | "retain";
}

export function Badge({ className, variant = "count", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center leading-none px-1.5 py-px text-[10px]",
        variant === "count" && "rounded-full bg-[#4d4d4d] text-[#969696]",
        variant === "retain" && "rounded-[3px] bg-[#cca700] text-[#221a05] font-bold",
        className,
      )}
      {...props}
    />
  );
}
