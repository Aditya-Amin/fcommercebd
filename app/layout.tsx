import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { PlanProvider } from "@/context/PlanContext";
import { ToastProvider } from "@/context/ToastContext";
import { SteadfastProvider } from "@/context/SteadfastContext";
import { TemplateProvider } from "@/context/TemplateContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

export const metadata: Metadata = {
  title: "FcommerceBD — Run your Facebook business on autopilot",
  description:
    "All-in-one SaaS for Facebook sellers in Bangladesh. Manage products, orders, AI content, SMS marketing, and delivery — in one dashboard.",
  other: {
    "google": "notranslate",
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect width='24' height='24' rx='6' fill='%233362FF'/><text x='50%25' y='58%25' text-anchor='middle' font-family='Inter,Arial' font-size='14' font-weight='700' fill='white'>F</text></svg>"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} translate="no">
      <body className="font-sans antialiased" suppressHydrationWarning>
        <AuthProvider>
          <PlanProvider>
            <SteadfastProvider>
              <TemplateProvider>
                <ToastProvider>{children}</ToastProvider>
              </TemplateProvider>
            </SteadfastProvider>
          </PlanProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
