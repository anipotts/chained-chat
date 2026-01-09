import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "chained.chat - Compare AI Models Side by Side",
  description: "One prompt. All models. See the difference. Compare responses from GPT-4, Claude, Gemini, and Grok simultaneously.",
  keywords: ["AI", "LLM", "GPT-4", "Claude", "Gemini", "Grok", "comparison", "chatbot"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
