import type { Metadata, Viewport } from "next";
import { Noto_Sans_TC, Noto_Serif_TC } from "next/font/google";
import "./globals.css";

const notoSansTC = Noto_Sans_TC({
  variable: "--font-noto-sans",
  weight: ["400", "500", "700"],
  preload: false,
});

const notoSerifTC = Noto_Serif_TC({
  variable: "--font-noto-serif",
  weight: ["400", "600", "700"],
  preload: false,
});

export const metadata: Metadata = {
  title: "國語生字學習系統",
  description: "國小國語生字學習系統",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body
        className={`${notoSansTC.variable} ${notoSerifTC.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
