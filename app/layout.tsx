import type { Metadata } from "next";
import { Bebas_Neue, DM_Mono, DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-display" });
const dmMono = DM_Mono({ weight: ["300","400","500"], subsets: ["latin"], variable: "--font-mono" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "GCashFin — Financial Management System",
  description: "Professional GCash account & salary tracking system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${bebasNeue.variable} ${dmMono.variable} ${dmSans.variable} font-body bg-[#0a0a0a] text-[#f0f0f0] min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
