import type { Metadata } from "next";
import { DM_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const dmMono = DM_Mono({ weight: ["300", "400", "500"], subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "GCashFin",
  description: "Professional GCash account & salary tracking system",
  icons: { icon: "/favicon.ico", shortcut: "/favicon.ico", apple: "/favicon.ico" },
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `try{if(localStorage.getItem('gcashfin-theme')==='dark'){document.documentElement.classList.add('dark')}}catch{}`
        }} />
      </head>
      <body className={`${dmMono.variable} bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-100 antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
