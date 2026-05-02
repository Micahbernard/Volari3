import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import SmoothScrollProvider from "@/providers/SmoothScrollProvider";
import ThemeProvider from "@/providers/ThemeProvider";
import CustomCursor from "@/components/CustomCursor";
import Navbar from "@/components/Navbar";
import WebGLBackground from "@/components/WebGLBackground";
import PageTransitionProvider from "@/providers/PageTransitionProvider";
import AbyssFog from "@/components/AbyssFog";
import VoidTendrils from "@/components/VoidTendrils";
import { Toaster } from "@/components/ui/toaster";

// ── Typography ──
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
  style: ["normal", "italic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// ── Metadata ──
export const metadata: Metadata = {
  title: "Volari — Digital Experiences Studio",
  description:
    "Premium digital experiences for brands that demand excellence. Web design, development, and creative technology by Volari.",
  keywords: [
    "Volari",
    "web design",
    "creative agency",
    "digital experiences",
    "premium web development",
  ],
  openGraph: {
    title: "Volari — Digital Experiences Studio",
    description:
      "Premium digital experiences for brands that demand excellence.",
    type: "website",
  },
};

// ── Root Layout ──
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${playfair.variable} ${geistMono.variable} antialiased`}
      suppressHydrationWarning
      data-theme="void"
    >
      <body className="min-h-screen text-v-chalk">
        <ThemeProvider>
          <SmoothScrollProvider>
            {/* WebGL fluid background — fixed -z-1 */}
            <WebGLBackground />

            {/* Abyss fog layers — atmospheric depth */}
            <AbyssFog />

            {/* Void tendrils — floating shadow particles */}
            <VoidTendrils />

            {/* Navigation — fixed z-50 */}
            <Navbar />

            {/* Custom cursor — fixed, above everything */}
            <CustomCursor />

            {/* Page content */}
            <main className="relative z-10">
              <PageTransitionProvider>{children}</PageTransitionProvider>
            </main>
          </SmoothScrollProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
