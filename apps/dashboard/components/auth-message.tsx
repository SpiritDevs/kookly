import type { ReactNode } from "react";
import { cn } from "@/components/ui";

export function AuthMessage({
  children,
  tone = "neutral",
}: Readonly<{
  children: ReactNode;
  tone?: "neutral" | "danger";
}>) {
  return (
    <p
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm leading-6",
        tone === "neutral" &&
          "border-[var(--line)] bg-white/70 text-[var(--ink-muted)]",
        tone === "danger" &&
          "border-[color-mix(in_srgb,var(--danger,#d43d3d)_22%,var(--line))] bg-[color-mix(in_srgb,var(--danger,#d43d3d)_7%,white)] text-[var(--danger,#a42b2b)]",
      )}
    >
      {children}
    </p>
  );
}
