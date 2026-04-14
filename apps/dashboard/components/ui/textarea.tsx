import * as React from "react"

import { cn, inputClasses } from "@/components/ui"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        inputClasses,
        "flex field-sizing-content min-h-16 py-3 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 disabled:cursor-not-allowed disabled:bg-[color-mix(in_srgb,var(--line)_35%,white)] disabled:opacity-60",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
