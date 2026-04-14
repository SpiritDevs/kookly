import type { Metadata } from "next";
import { Roboto, Geist } from "next/font/google";
import localFont from "next/font/local";
import { DEFAULT_DASHBOARD_LANGUAGE } from "@convex/lib/dashboardLanguage";
import { DevReactGrabLoader } from "@/components/dev-react-grab-loader";
import { getLocaleDirection } from "@/lib/mock-data";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const roboto = Roboto({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dashboard-sans",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-dashboard-mono",
});

export const metadata: Metadata = {
  title: "Kookly Dashboard",
  description:
    "Operational command center for teams running high-velocity scheduling.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang={DEFAULT_DASHBOARD_LANGUAGE}
      dir={getLocaleDirection(DEFAULT_DASHBOARD_LANGUAGE)} className={cn("font-sans", geist.variable)}
    >
      <body
        className={`${roboto.variable} ${geistMono.variable} font-[family-name:var(--font-dashboard-sans)] antialiased`}
      >
        {process.env.NODE_ENV === "development" && <DevReactGrabLoader />}
        {children}
      </body>
    </html>
  );
}
