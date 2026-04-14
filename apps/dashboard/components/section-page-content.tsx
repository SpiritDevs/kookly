"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SectionPageContent({
  title,
  heading,
  description,
}: Readonly<{
  title: string;
  heading: string;
  description: string;
}>) {
  return (
    <Card className="flex h-full min-h-0 min-w-0 flex-1 rounded-lg border border-[color-mix(in_srgb,var(--line)_65%,white)] bg-[color-mix(in_srgb,var(--panel)_88%,white)] py-0 shadow-sm">
      <CardHeader className="border-b border-[color-mix(in_srgb,var(--line)_55%,white)] py-5">
        <CardTitle className="text-[15px] text-[var(--panel-ink)]">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 items-center justify-center py-10">
        <div className="max-w-sm text-center">
          <p className="text-sm font-medium text-[var(--panel-ink)]">
            {heading}
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
