"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  Plus,
  MessageSquare,
  LogOut,
  X,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Session {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface SidebarProps {
  currentSessionId: string | null;
  onSelectSession: (id: string | null) => void;
  onNewChat: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({
  currentSessionId,
  onSelectSession,
  onNewChat,
  isOpen,
  onClose,
}: SidebarProps) {
  const { accessCode, logout } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    if (!accessCode) return;
    fetch(`/api/sessions?code=${encodeURIComponent(accessCode)}`)
      .then((r) => r.json())
      .then(setSessions)
      .catch(() => {});
  }, [accessCode, currentSessionId]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed lg:relative inset-y-0 left-0 z-50 w-64 bg-cc-bg border-r border-cc-border flex flex-col transition-transform duration-200",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-cc-border">
          <span className="font-mono text-sm font-semibold text-cc-accent">
            chained.chat
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                onNewChat();
                onClose();
              }}
              className="p-1.5 rounded-md hover:bg-cc-surface text-cc-text-muted hover:text-cc-text transition-colors"
              title="New chat"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-cc-surface text-cc-text-muted hover:text-cc-text transition-colors lg:hidden"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-0.5">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => {
                onSelectSession(session.id);
                onClose();
              }}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md text-sm transition-colors group",
                session.id === currentSessionId
                  ? "bg-cc-surface text-cc-text"
                  : "text-cc-text-muted hover:bg-cc-surface hover:text-cc-text"
              )}
            >
              <div className="flex items-center gap-2">
                <MessageSquare size={14} className="shrink-0 opacity-50" />
                <span className="truncate">{session.title}</span>
              </div>
              <span className="text-[10px] text-cc-text-dim ml-6">
                {formatDate(session.updated_at)}
              </span>
            </button>
          ))}
          {sessions.length === 0 && (
            <p className="text-xs text-cc-text-dim text-center py-8">
              No conversations yet
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-cc-border">
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-cc-text-muted hover:bg-cc-surface hover:text-cc-text transition-colors"
          >
            <LogOut size={14} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
