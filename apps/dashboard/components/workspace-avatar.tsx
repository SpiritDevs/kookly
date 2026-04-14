import { cn } from "@/components/ui";

const DEFAULT_BRAND = "#bef264";

export function pickBrandColor(value: string | null | undefined): string {
  if (!value) {
    return DEFAULT_BRAND;
  }
  const t = value.trim();
  if (
    /^#[0-9a-fA-F]{3}$/.test(t) ||
    /^#[0-9a-fA-F]{6}$/.test(t) ||
    /^#[0-9a-fA-F]{8}$/.test(t)
  ) {
    return t;
  }
  return DEFAULT_BRAND;
}

export function workspaceInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "WS";
  }

  if (parts.length === 1) {
    return (parts[0] ?? "WS").slice(0, 2).toUpperCase();
  }

  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

export function WorkspaceAvatar({
  name,
  logoUrl,
  brandColor,
  className,
}: Readonly<{
  name: string;
  logoUrl: string | null;
  brandColor: string | null;
  className?: string;
}>) {
  const bg = pickBrandColor(brandColor);

  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- Convex / UploadThing URLs; domains vary by env
      <img
        src={logoUrl}
        alt=""
        className={cn("size-8 shrink-0 rounded-lg object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold text-zinc-950",
        className,
      )}
      style={{ backgroundColor: bg }}
    >
      {workspaceInitials(name)}
    </div>
  );
}
