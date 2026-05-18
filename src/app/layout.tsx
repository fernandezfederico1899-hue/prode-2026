import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { NavMobile } from "@/components/common/nav-mobile";
import { NavDesktop } from "@/components/common/nav-desktop";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const bebas = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Prode 2026",
  description: "Prode privado del Mundial 2026",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${bebas.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NavDesktop />
          <main className="flex-1 pb-20 md:pb-0">{children}</main>
          <NavMobile />
        </ThemeProvider>
      </body>
    </html>
  );
}
