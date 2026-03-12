"use client";

import { useAuth } from "@/lib/auth-context";
import { AccessGate } from "@/components/access-gate";
import { ChatInterface } from "@/components/chat/chat-interface";

export default function Home() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <AccessGate />;
  }

  return <ChatInterface />;
}
