import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Barlow Condensed — the broadcast grotesque: display, buttons, card names.
const barlowc = localFont({
  src: [
    { path: "./fonts/BarlowCondensed-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "./fonts/BarlowCondensed-SemiBoldItalic.ttf", weight: "600", style: "italic" },
    { path: "./fonts/BarlowCondensed-Bold.ttf", weight: "700", style: "normal" },
    { path: "./fonts/BarlowCondensed-ExtraBold.ttf", weight: "800", style: "normal" },
  ],
  variable: "--font-barlowc",
  display: "swap",
});

// Barlow — the readable body voice from the same superfamily.
const barlow = localFont({
  src: [
    { path: "./fonts/Barlow-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/Barlow-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/Barlow-SemiBold.ttf", weight: "600", style: "normal" },
  ],
  variable: "--font-barlow",
  display: "swap",
});

// JetBrains Mono — timing-screen numerals.
const jbmono = localFont({
  src: [
    { path: "./fonts/JetBrainsMono-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/JetBrainsMono-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/JetBrainsMono-Bold.ttf", weight: "700", style: "normal" },
    { path: "./fonts/JetBrainsMono-ExtraBold.ttf", weight: "800", style: "normal" },
  ],
  variable: "--font-jbmono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001"),
  title: {
    default: "gitone · your github, rated like f1",
    template: "%s · gitone",
  },
  description:
    "Turn any GitHub profile into an F1 26 driver card. EXP, RAC, AWA and PAC scored live from real commits, PRs and reviews, then raced head-to-head.",
  openGraph: {
    title: "gitone · your github, rated like f1",
    description:
      "GitHub profiles as F1 26 driver cards: EXP, RAC, AWA, PAC scored live from real commits, PRs and reviews.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#15151e",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${barlowc.variable} ${barlow.variable} ${jbmono.variable}`}>
      <head>
        <link rel="preconnect" href="https://avatars.githubusercontent.com" />
        <link rel="preconnect" href="https://flagcdn.com" />
        <link rel="dns-prefetch" href="https://api.github.com" />
        <link rel="preload" as="image" href="/drivers/torvalds.webp" fetchPriority="high" />
      </head>
      <body>{children}</body>
    </html>
  );
}
