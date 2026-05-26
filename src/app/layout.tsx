import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "PLATA | Gestión Financiera Personal",
  description: "Control de ingresos, gastos e inversiones con estética bancaria premium.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PLATA",
  },
  formatDetection: {
    telephone: false,
  },
};

import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full font-sans bg-[#09090b] text-zinc-100 selection:bg-teal-500/30 selection:text-teal-200">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
