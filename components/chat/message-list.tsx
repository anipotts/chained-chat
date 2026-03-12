"use client";

import { useRef, useEffect } from "react";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { getProviderConfig } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { User, ChevronDown, ChevronUp, Bot } from "lucide-react";
import { useState } from "react";

export interface AgentStepDisplay {
  agentIndex: number;
  agentName: string;
  model: string;
  content: string;
  thinking: string;
  isStreaming: boolean;
  isDone: boolean;
}

export interface MessageDisplay {
  id: string;
  role: "user" | "chain";
  content: string;
  agentSteps?: AgentStepDisplay[];
  images?: string[];
}

interface MessageListProps {
  messages: MessageDisplay[];
}

export function MessageList({ messages }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-thin">
      {messages.map((msg) => (
        <div key={msg.id} className="animate-fade-in">
          {msg.role === "user" ? (
            <UserMessage content={msg.content} images={msg.images} />
          ) : (
            <ChainMessage steps={msg.agentSteps || []} />
          )}
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}

function UserMessage({
  content,
  images,
}: {
  content: string;
  images?: string[];
}) {
  return (
    <div className="flex gap-3 max-w-3xl mx-auto">
      <div className="shrink-0 w-7 h-7 rounded-md bg-cc-surface border border-cc-border flex items-center justify-center mt-0.5">
        <User size={14} className="text-cc-text-muted" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-cc-text whitespace-pre-wrap">{content}</p>
        {images && images.length > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {images.map((url, i) => (
              <img
                key={i}
                src={url}
                alt="attachment"
                className="max-w-[200px] max-h-[200px] rounded-md border border-cc-border object-cover"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ChainMessage({ steps }: { steps: AgentStepDisplay[] }) {
  return (
    <div className="max-w-3xl mx-auto space-y-3">
      {steps.map((step) => (
        <AgentStep key={step.agentIndex} step={step} />
      ))}
    </div>
  );
}

function AgentStep({ step }: { step: AgentStepDisplay }) {
  const [showThinking, setShowThinking] = useState(false);
  const provider = getProviderConfig(step.model);

  return (
    <div className="flex gap-3">
      <div className="shrink-0 flex flex-col items-center gap-1 mt-0.5">
        <div
          className="w-7 h-7 rounded-md border border-cc-border flex items-center justify-center"
          style={{ backgroundColor: provider.color + "15" }}
        >
          <Bot size={14} style={{ color: provider.color }} />
        </div>
        {step.isStreaming && (
          <div
            className="w-1.5 h-1.5 rounded-full animate-pulse-slow"
            style={{ backgroundColor: provider.color }}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-cc-text">
            {step.agentName || `Agent ${step.agentIndex + 1}`}
          </span>
          <span className="text-[10px] font-mono text-cc-text-dim">
            {provider.name}
          </span>
          {step.isDone && (
            <span className="text-[10px] font-mono text-cc-green">done</span>
          )}
        </div>

        {step.thinking && (
          <button
            onClick={() => setShowThinking(!showThinking)}
            className="flex items-center gap-1 text-[11px] text-cc-text-dim hover:text-cc-text-muted transition-colors mb-2"
          >
            {showThinking ? (
              <ChevronUp size={12} />
            ) : (
              <ChevronDown size={12} />
            )}
            <span className="font-mono">thinking</span>
          </button>
        )}

        {showThinking && step.thinking && (
          <div className="mb-3 pl-3 border-l border-cc-border text-xs text-cc-text-dim font-mono whitespace-pre-wrap leading-relaxed">
            {step.thinking}
          </div>
        )}

        <MarkdownRenderer
          content={step.content}
          isStreaming={step.isStreaming}
        />
      </div>
    </div>
  );
}
