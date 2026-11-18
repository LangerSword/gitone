import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Titillium Web — F1's own typeface — as the display + body voice.
const titillium = localFont({
  src: [
    { path: "./fonts/TitilliumWeb-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/TitilliumWeb-Italic.ttf", weight: "400", style: "italic" },
    { path: "./fonts/TitilliumWeb-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "./fonts/TitilliumWeb-Bold.ttf", weight: "700", style: "normal" },
    { path: "./fonts/TitilliumWeb-Black.ttf", weight: "900", style: "normal" },
  ],
  variable: "--font-titillium",
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
  themeColor: "#08090b",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${titillium.variable} ${jbmono.variable}`}>
      <head>
        <link rel="preconnect" href="https://avatars.githubusercontent.com" />
        <link rel="preconnect" href="https://flagcdn.com" />
        <link rel="dns-prefetch" href="https://api.github.com" />
      </head>
      <body>{children}</body>
    </html>
  );
}
