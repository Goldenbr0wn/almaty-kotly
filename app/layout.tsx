import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "КотелСервис Алматы",
  description: "Ремонт, обслуживание и подбор газовых котлов в Алматы"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
