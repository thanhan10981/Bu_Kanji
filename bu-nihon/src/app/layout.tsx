import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  variable: "--font-noto-jp",
  display: "swap",
});

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
      <body className={`${inter.variable} ${notoSansJP.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
