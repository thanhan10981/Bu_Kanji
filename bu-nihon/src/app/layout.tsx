import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/providers/Providers";

export const metadata: Metadata = {
  title: "Bú Kanji – Học Tiếng Nhật Toàn Diện",
  description:
    "Nền tảng học tiếng Nhật toàn diện: Kanji, Từ vựng, Ngữ pháp, Shadowing, Pitch Accent và Kaiwa. Lộ trình JLPT N5 đến N1.",
  keywords: "học tiếng nhật, kanji, jlpt, từ vựng tiếng nhật, ngữ pháp tiếng nhật, shadowing, pitch accent",
  openGraph: {
    title: "Bú Kanji – Học Tiếng Nhật Toàn Diện",
    description: "Nền tảng học tiếng Nhật toàn diện với 2500+ Kanji, 10000+ Từ vựng và Ngữ pháp N5-N1.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#dfeaf6" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1117" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
