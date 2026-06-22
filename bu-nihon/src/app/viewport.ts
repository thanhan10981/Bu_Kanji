import type { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",          // iOS safe-area support
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#dfeaf6" },
    { media: "(prefers-color-scheme: dark)",  color: "#0d1117" },
  ],
};
