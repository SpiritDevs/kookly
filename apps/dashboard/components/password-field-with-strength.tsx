"use client";

import { useGT, useMessages } from "gt-next";
import {
  useId,
  useMemo,
  useState,
  type ChangeEventHandler,
  type ReactNode,
} from "react";
import {
  getPasswordStrength,
  PASSWORD_STRENGTH_LABELS,
  type PasswordStrengthLevel,
} from "@/lib/password-strength";
import { cn, Field, TextInput } from "@/components/ui";

/** Distinct steps: warm → amber → fresh green → teal so each strength reads clearly. */
const SEGMENT_FILL: Record<Exclude<PasswordStrengthLevel, 0>, string> = {
  1: "bg-[oklch(0.52_0.19_27)]",
  2: "bg-[oklch(0.62_0.15_72)]",
  3: "bg-[oklch(0.68_0.13_145)]",
  4: "bg-[var(--success)]",
};

export function PasswordFieldWithStrength({
  label,
  hint,
  placeholder,
  className,
  inputClassName,
  name,
  value,
  defaultValue,
  onChange,
  autoComplete = "new-password",
  required,
  disabled,
}: Readonly<{
  label?: ReactNode;
  hint?: ReactNode;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
}>) {
  const gt = useGT();
  const m = useMessages();
  const [localValue, setLocalValue] = useState(defaultValue ?? "");
  const meterId = useId();
  const resolvedValue = value ?? localValue;
  const resolvedLabel = label ?? gt("Password");
  const resolvedPlaceholder = placeholder ?? gt("Create a strong password");
  const level = useMemo(() => getPasswordStrength(resolvedValue), [resolvedValue]);

  const fillClass =
    level === 0 ? null : SEGMENT_FILL[level as Exclude<PasswordStrengthLevel, 0>];

  return (
    <Field label={resolvedLabel} hint={hint}>
      <div className={cn("grid gap-2", className)}>
        <TextInput
          type="password"
          name={name}
          placeholder={resolvedPlaceholder}
          autoComplete={autoComplete}
          value={resolvedValue}
          onChange={(event) => {
            if (value === undefined) {
              setLocalValue(event.target.value);
            }

            onChange?.(event);
          }}
          aria-describedby={level > 0 ? meterId : undefined}
          required={required}
          disabled={disabled}
          className={cn(
            "rounded-2xl border-[var(--line)] bg-white/90 shadow-[inset_0_1px_0_color-mix(in_srgb,white_80%,transparent)]",
            inputClassName,
          )}
        />

        <div className="grid gap-1.5 pt-0.5">
          <div
            className="flex gap-1"
            role="meter"
            aria-valuemin={0}
            aria-valuemax={4}
            aria-valuenow={level}
            aria-valuetext={
              level === 0
                ? gt("No password entered")
                : m(PASSWORD_STRENGTH_LABELS[level])
            }
            aria-label={gt("Password strength")}
          >
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 min-w-0 flex-1 rounded-full bg-[color-mix(in_srgb,var(--line)_65%,white)] transition-colors duration-200 ease-out",
                  i < level && fillClass,
                )}
              />
            ))}
          </div>
          <p
            id={meterId}
            className={cn(
              "min-h-[1.125rem] font-[family-name:var(--font-dashboard-mono)] text-[11px] font-medium uppercase tracking-[0.16em] transition-colors duration-200",
              level === 0 && "text-[var(--ink-muted)]",
              level === 1 && "text-[oklch(0.42_0.16_27)]",
              level === 2 && "text-[oklch(0.48_0.13_68)]",
              level === 3 && "text-[oklch(0.54_0.11_150)]",
              level === 4 && "text-[var(--success)]",
            )}
            aria-live="polite"
          >
            {level === 0
              ? gt("Strength will appear as you type")
              : m(
                  PASSWORD_STRENGTH_LABELS[
                    level as Exclude<PasswordStrengthLevel, 0>
                  ],
                )}
          </p>
        </div>
      </div>
    </Field>
  );
}
