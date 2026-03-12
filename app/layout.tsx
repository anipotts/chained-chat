import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "ChainedChat",
  description: "Chain multiple AI models together in a single conversation",
  keywords: ["AI", "ChatGPT", "Claude", "Gemini", "AI chaining", "LLM"],
  authors: [{ name: "Ani Potts" }],
  metadataBase: new URL("https://chained.chat"),
  openGraph: {
    title: "ChainedChat",
    description: "Chain multiple AI models together in a single conversation",
    url: "https://chained.chat",
    siteName: "ChainedChat",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ChainedChat",
    description: "Chain multiple AI models together in a single conversation",
    creator: "@anipotts",
  },
  icons: {
    icon: "/cc_logo_dark.png",
    apple: "/cc_logo_dark.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css"
        />
      </head>
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
