import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/lib/auth-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CRM для директора",
  description: "CRM система для управления заявками, мастерами и кассой",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={cn('text-base antialiased', inter.className)}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
