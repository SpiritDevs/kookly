import { GTProvider } from "gt-next";
import { DEFAULT_DASHBOARD_LANGUAGE } from "@convex/lib/dashboardLanguage";
import { ConvexProviderBoundary } from "@/components/convex-provider-boundary";

export default function RegisterLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <GTProvider locale={DEFAULT_DASHBOARD_LANGUAGE} region="AU">
      <ConvexProviderBoundary fallback={null}>{children}</ConvexProviderBoundary>
    </GTProvider>
  );
}
