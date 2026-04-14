import { GTProvider } from "gt-next";
import { DEFAULT_DASHBOARD_LANGUAGE } from "@convex/lib/dashboardLanguage";

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <GTProvider locale={DEFAULT_DASHBOARD_LANGUAGE} region="AU">
      {children}
    </GTProvider>
  );
}
