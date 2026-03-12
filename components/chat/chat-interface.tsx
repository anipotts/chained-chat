"use client";

import { useState, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "./sidebar";
import { MessageList, type MessageDisplay, type AgentStepDisplay } from "./message-list";
import { InputArea } from "./input-area";
import { ChainBuilder } from "@/components/chain/chain-builder";
import { type AgentState } from "@/components/chain/agent-card";
import { Menu, X } from "lucide-react";
import { DEFAULT_MODELS } from "@/lib/constants";

export function ChatInterface() {
  const { accessCode } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chainOpen, setChainOpen] = useState(true);
  const [agents, setAgents] = useState<AgentState[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const handleNewChat = useCallback(() => {
    setSessionId(null);
    setMessages([]);
    setAgents([]);
    setChainOpen(true);
  }, []);

  const handleSelectSession = useCallback(
    async (id: string | null) => {
      if (!id) {
        handleNewChat();
        return;
      }
      setSessionId(id);
      setMessages([]);
      // TODO: Load session messages from API
    },
    [handleNewChat]
  );

  const handleSubmit = useCallback(
    async (input: string, images: string[]) => {
      if (!accessCode || agents.length === 0) return;

      setIsLoading(true);

      // Add user message
      const userMsgId = `user-${Date.now()}`;
      const chainMsgId = `chain-${Date.now()}`;

      setMessages((prev) => [
        ...prev,
        {
          id: userMsgId,
          role: "user",
          content: input,
          images: images.length > 0 ? images : undefined,
        },
        {
          id: chainMsgId,
          role: "chain",
          content: "",
          agentSteps: agents.map((a, i) => ({
            agentIndex: i,
            agentName: a.name || `Agent ${i + 1}`,
            model: a.model,
            content: "",
            thinking: "",
            isStreaming: false,
            isDone: false,
          })),
        },
      ]);

      // Close chain config on mobile
      setChainOpen(false);

      try {
        abortRef.current = new AbortController();
        const res = await fetch("/api/chat/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            accessCode,
            userInput: input,
            agents: agents.map((a) => ({
              name: a.name || `Agent ${agents.indexOf(a) + 1}`,
              model: a.model,
              systemPrompt: a.systemPrompt,
            })),
            images: images.length > 0 ? images : undefined,
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) throw new Error("Stream failed");

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) throw new Error("No reader");

        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const event = JSON.parse(line.slice(6));

              if (event.type === "session" && event.sessionId) {
                setSessionId(event.sessionId);
              }

              if (event.type === "agent_start") {
                setMessages((prev) =>
                  prev.map((msg) => {
                    if (msg.id !== chainMsgId) return msg;
                    return {
                      ...msg,
                      agentSteps: msg.agentSteps?.map((step) => {
                        if (step.agentIndex === event.agentIndex) {
                          return { ...step, isStreaming: true };
                        }
                        if (step.agentIndex < event.agentIndex) {
                          return { ...step, isStreaming: false, isDone: true };
                        }
                        return step;
                      }),
                    };
                  })
                );
              }

              if (event.type === "text") {
                setMessages((prev) =>
                  prev.map((msg) => {
                    if (msg.id !== chainMsgId) return msg;
                    return {
                      ...msg,
                      agentSteps: msg.agentSteps?.map((step) => {
                        if (step.agentIndex === event.agentIndex) {
                          return {
                            ...step,
                            content: step.content + event.content,
                          };
                        }
                        return step;
                      }),
                    };
                  })
                );
              }

              if (event.type === "thinking") {
                setMessages((prev) =>
                  prev.map((msg) => {
                    if (msg.id !== chainMsgId) return msg;
                    return {
                      ...msg,
                      agentSteps: msg.agentSteps?.map((step) => {
                        if (step.agentIndex === event.agentIndex) {
                          return {
                            ...step,
                            thinking: step.thinking + event.content,
                          };
                        }
                        return step;
                      }),
                    };
                  })
                );
              }

              if (event.type === "done") {
                setMessages((prev) =>
                  prev.map((msg) => {
                    if (msg.id !== chainMsgId) return msg;
                    return {
                      ...msg,
                      agentSteps: msg.agentSteps?.map((step) => ({
                        ...step,
                        isStreaming: false,
                        isDone: true,
                      })),
                    };
                  })
                );
              }

              if (event.type === "error") {
                setMessages((prev) =>
                  prev.map((msg) => {
                    if (msg.id !== chainMsgId) return msg;
                    return {
                      ...msg,
                      agentSteps: msg.agentSteps?.map((step) => {
                        if (step.isStreaming) {
                          return {
                            ...step,
                            content:
                              step.content +
                              `\n\n**Error:** ${event.content}`,
                            isStreaming: false,
                          };
                        }
                        return step;
                      }),
                    };
                  })
                );
              }
            } catch {}
          }
        }
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error("Stream error:", err);
        }
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [accessCode, agents, sessionId]
  );

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar
        currentSessionId={sessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-cc-border bg-cc-bg">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-md hover:bg-cc-surface text-cc-text-muted hover:text-cc-text transition-colors lg:hidden"
          >
            <Menu size={18} />
          </button>
          <span className="text-sm font-mono text-cc-text-muted truncate">
            {sessionId ? "Chat" : "New Chat"}
          </span>
        </div>

        {/* Chain builder panel */}
        {chainOpen && (
          <div className="border-b border-cc-border bg-cc-bg p-4 overflow-y-auto max-h-[45vh] scrollbar-thin">
            <div className="max-w-3xl mx-auto">
              <ChainBuilder agents={agents} onAgentsChange={setAgents} />
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.length > 0 ? (
          <MessageList messages={messages} />
        ) : (
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="text-center">
              <h2 className="text-lg font-mono font-semibold text-cc-text mb-2">
                Chain AI models together
              </h2>
              <p className="text-sm text-cc-text-muted max-w-md">
                Configure your agent chain above, then send a message. Each
                agent processes the output of the previous one.
              </p>
            </div>
          </div>
        )}

        {/* Input */}
        <InputArea
          onSubmit={handleSubmit}
          isLoading={isLoading}
          showChainToggle
          isChainOpen={chainOpen}
          onToggleChain={() => setChainOpen(!chainOpen)}
          agentCount={agents.length}
        />
      </div>
    </div>
  );
}
