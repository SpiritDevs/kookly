import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import type { ClassValue } from "clsx";

import { cn as cnMerge } from "@/lib/utils";

export function cn(...inputs: ClassValue[]) {
  return cnMerge(inputs);
}

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "md" | "sm";

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    "inline-flex cursor-pointer items-center justify-center rounded-lg border transition duration-200",
    "focus-visible:outline-none focus-visible:ring-0",
    "disabled:cursor-not-allowed",
    size === "md"
      ? "min-h-12 px-5 text-sm font-medium"
      : "min-h-10 px-4 text-sm font-medium",
    variant === "primary" &&
      "border-[var(--panel-ink)] bg-[var(--panel-ink)] !text-white shadow-none hover:border-[color-mix(in_srgb,var(--panel-ink)_88%,black)] hover:bg-[color-mix(in_srgb,var(--panel-ink)_88%,black)] hover:!text-white focus-visible:!text-white disabled:border-[color-mix(in_srgb,var(--line)_80%,white)] disabled:bg-[color-mix(in_srgb,var(--line)_70%,white)] disabled:!text-[var(--ink-muted)] disabled:shadow-none disabled:opacity-100",
    variant === "secondary" &&
      "border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_86%,white)] text-[var(--panel-ink)] hover:border-[var(--accent)] hover:bg-white",
    variant === "ghost" &&
      "border-[var(--line)] bg-transparent text-[var(--ink-muted)] hover:border-[var(--panel-ink)] hover:text-[var(--panel-ink)] disabled:cursor-not-allowed disabled:opacity-55",
    className,
  );
}

export function Panel({
  children,
  className,
}: Readonly<{
  children: ReactNode;
  className?: string;
}>) {
  return (
    <section
      className={cn(
        "rounded-[32px] border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_88%,white)] p-6 shadow-[var(--shadow-xl)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: Readonly<{
  children: ReactNode;
  tone?: "neutral" | "accent" | "success";
}>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]",
        tone === "neutral" &&
          "border border-[var(--line)] bg-white/70 text-[var(--ink-muted)]",
        tone === "accent" &&
          "bg-[var(--accent-soft)] text-[var(--accent-strong)]",
        tone === "success" &&
          "bg-[color-mix(in_srgb,var(--success)_16%,white)] text-[var(--success)]",
      )}
    >
      {children}
    </span>
  );
}

export function Field({
  label,
  hint,
  children,
}: Readonly<{
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
}>) {
  return (
    <label className="grid gap-2">
      <span className="flex items-center justify-between gap-4 text-sm font-medium text-[var(--panel-ink)]">
        <span>{label}</span>
        {hint ? (
          <span className="text-xs font-normal text-[var(--ink-muted)]">
            {hint}
          </span>
        ) : null}
      </span>
      {children}
    </label>
  );
}

export const inputFocusedClasses =
  "border-[var(--accent)] bg-white ring-2 ring-[color-mix(in_srgb,var(--accent)_18%,white)]";

export const inputClasses =
  "min-h-12 w-full rounded-lg border border-[var(--line)] bg-white/75 px-4 text-sm text-[var(--panel-ink)] outline-none transition-[border-color,background-color,box-shadow] duration-200 ease-out placeholder:text-[color-mix(in_srgb,var(--ink-muted)_70%,white)] focus:border-[var(--accent)] focus:bg-white focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent)_18%,white)]";

export const TextInput = forwardRef<
  HTMLInputElement,
  ComponentPropsWithoutRef<"input">
>(function TextInput(props, ref) {
  return (
    <input {...props} ref={ref} className={cn(inputClasses, props.className)} />
  );
});

export function SelectInput(props: ComponentPropsWithoutRef<"select">) {
  return <select {...props} className={cn(inputClasses, props.className)} />;
}
