import Link from "next/link";
import { Icon } from "@/components/icons";
import { cn } from "@/components/ui";
import {
  dashboardNavGroups,
  type DashboardNavGroup,
  type DashboardNavItem,
} from "@/lib/mock-data";

export function getSidebarItemClassName(active: boolean) {
  return cn(
    "group flex items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-[13px] font-medium",
    active
      ? "bg-[var(--panel-ink)] text-white"
      : "text-[var(--ink-muted)] transition-[background-color,color,box-shadow] duration-200 ease-out hover:bg-white/95 hover:text-[var(--panel-ink)] hover:shadow-[0_1px_3px_color-mix(in_srgb,var(--accent-strong)_8%,transparent),0_0_0_1px_color-mix(in_srgb,var(--line)_80%,transparent)]",
  );
}

function getSidebarSubItemClassName(active: boolean) {
  return cn(
    "dashboard-sidebar-sub-item group relative flex items-center rounded-lg px-3 py-1.5 pl-11 pr-11 text-[12px] font-medium transition-[background-color,color,box-shadow] duration-200 ease-out",
    active
      ? "dashboard-sidebar-sub-item-active bg-[var(--panel-ink)] text-white"
      : "text-[var(--ink-muted)] hover:bg-white/95 hover:text-[var(--panel-ink)] hover:shadow-[0_1px_3px_color-mix(in_srgb,var(--accent-strong)_8%,transparent),0_0_0_1px_color-mix(in_srgb,var(--line)_80%,transparent)]",
  );
}

function DashboardSidebarItemContent({
  item,
  active,
  label,
  flag,
}: Readonly<{
  item: DashboardNavItem;
  active: boolean;
  label: React.ReactNode;
  flag?: React.ReactNode;
}>) {
  return (
    <>
      <span className="flex min-w-0 flex-1 items-center gap-3">
        <Icon
          name={item.icon}
          className={cn(
            "size-[18px] shrink-0",
            active
              ? "text-white"
              : "text-[var(--ink-muted)] group-hover:text-[var(--panel-ink)]",
          )}
        />
        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            active
              ? "font-medium text-white"
              : "group-hover:text-[var(--panel-ink)]",
          )}
        >
          {label}
        </span>
      </span>
      {flag ? (
        <span
          className={cn(
            "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
            active
              ? "bg-white/15 text-white/90"
              : "bg-[var(--accent-soft)] text-[var(--accent-strong)] transition-colors group-hover:bg-[color-mix(in_srgb,var(--accent)_14%,white)] group-hover:text-[var(--accent-strong)]",
          )}
        >
          {flag}
        </span>
      ) : null}
    </>
  );
}

export function DashboardSidebarLinkItem({
  item,
  href,
  active,
  label,
  flag,
}: Readonly<{
  item: DashboardNavItem;
  href: string;
  active: boolean;
  label: React.ReactNode;
  flag?: React.ReactNode;
}>) {
  return (
    <Link href={href} className={getSidebarItemClassName(active)}>
      <DashboardSidebarItemContent
        item={item}
        active={active}
        label={label}
        flag={flag}
      />
    </Link>
  );
}

export function DashboardSidebarButtonItem({
  item,
  active,
  onClick,
  className,
  label,
  flag,
}: Readonly<{
  item: DashboardNavItem;
  active: boolean;
  onClick: () => void;
  className?: string;
  label: React.ReactNode;
  flag?: React.ReactNode;
}>) {
  return (
    <button
      type="button"
      className={cn(
        "w-full text-left",
        getSidebarItemClassName(active),
        className,
      )}
      onClick={onClick}
    >
      <DashboardSidebarItemContent
        item={item}
        active={active}
        label={label}
        flag={flag}
      />
    </button>
  );
}

export function DashboardSidebarStaticItem({
  item,
  active,
  className,
  label,
  flag,
}: Readonly<{
  item: DashboardNavItem;
  active: boolean;
  className?: string;
  label: React.ReactNode;
  flag?: React.ReactNode;
}>) {
  return (
    <div className={cn(getSidebarItemClassName(active), className)}>
      <DashboardSidebarItemContent
        item={item}
        active={active}
        label={label}
        flag={flag}
      />
    </div>
  );
}

export function DashboardSidebarGroup({
  header,
  children,
}: Readonly<{
  header?: React.ReactNode;
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col gap-0.5">
      {header ? (
        <p className="px-1.5 pb-1 pt-2 text-[11px] font-semibold tracking-[0.08em] text-[var(--ink-subtle)]">
          {header}
        </p>
      ) : null}
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

export function DashboardMainSidebarMenu({
  base,
  navActive,
  renderLabel,
  renderFlag,
  renderHeader,
}: Readonly<{
  base: string;
  navActive: (href: string) => boolean;
  renderLabel: (label: DashboardNavItem["label"]) => React.ReactNode;
  renderFlag?: (flag: NonNullable<DashboardNavItem["flag"]>) => React.ReactNode;
  renderHeader?: (header: NonNullable<DashboardNavGroup["header"]>) => React.ReactNode;
}>) {
  return (
    <nav className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 pb-4 pt-2">
      {dashboardNavGroups.map((group, groupIndex) => (
        <DashboardSidebarGroup
          key={group.header ?? `group-${groupIndex}`}
          header={group.header ? (renderHeader ? renderHeader(group.header) : group.header) : undefined}
        >
          {group.items.map((item) => {
            const activeSubItemIndex =
              item.subItems?.findIndex((subItem) => navActive(subItem.href)) ?? -1;
            const itemActive = navActive(item.href) && activeSubItemIndex === -1;
            const itemExpanded = itemActive || activeSubItemIndex !== -1;

            return (
              <div key={item.label} className="flex flex-col gap-0.5">
                <DashboardSidebarLinkItem
                  item={item}
                  href={`${base}${item.href}`}
                  active={itemActive}
                  label={renderLabel(item.label)}
                  flag={item.flag ? renderFlag?.(item.flag) ?? item.flag : undefined}
                />
                {item.subItems?.length && itemExpanded ? (
                  <div className="flex flex-col gap-0.5">
                    {item.subItems.map((subItem, subItemIndex) => (
                      <Link
                        key={subItem.href}
                        href={`${base}${subItem.href}`}
                        className={cn(getSidebarSubItemClassName(navActive(subItem.href)), {
                          "dashboard-sidebar-sub-item-trail":
                            activeSubItemIndex > 0 && subItemIndex < activeSubItemIndex,
                          "dashboard-sidebar-sub-item-active-connected":
                            activeSubItemIndex > 0 && subItemIndex === activeSubItemIndex,
                        })}
                      >
                        <span className="min-w-0 truncate">
                          {renderLabel(subItem.label)}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </DashboardSidebarGroup>
      ))}
    </nav>
  );
}
