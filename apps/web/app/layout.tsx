import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Moodial",
  description: "开源、自部署优先的 AI 情绪日记应用"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
