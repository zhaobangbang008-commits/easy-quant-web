import type { Metadata } from "next";
// ⚠️ 关键点：下面这行就是引入样式的“电缆”，之前可能断了
import "./globals.css"; 

export const metadata: Metadata = {
  title: "牢A救星",
  description: "AI Quantitative Trading Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
      </body>
    </html>
  );
}