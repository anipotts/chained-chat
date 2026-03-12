"use client";

import { X, GripVertical } from "lucide-react";
import { ModelSelector } from "./model-selector";

export interface AgentState {
  id: string;
  name: string;
  model: string;
  systemPrompt: string;
}

interface AgentCardProps {
  agent: AgentState;
  index: number;
  total: number;
  onChange: (agent: AgentState) => void;
  onRemove: () => void;
}

export function AgentCard({
  agent,
  index,
  total,
  onChange,
  onRemove,
}: AgentCardProps) {
  return (
    <div className="bg-cc-surface border border-cc-border rounded-lg p-3 animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <GripVertical size={14} className="text-cc-text-dim" />
        <span className="text-[10px] font-mono text-cc-text-dim uppercase tracking-wider">
          Agent {index + 1}
          {index > 0 && " (receives previous output)"}
        </span>
        {total > 1 && (
          <button
            onClick={onRemove}
            className="ml-auto p-1 rounded hover:bg-white/5 text-cc-text-dim hover:text-cc-red transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={agent.name}
            onChange={(e) => onChange({ ...agent, name: e.target.value })}
            placeholder="Agent name"
            className="flex-1 bg-transparent border-b border-cc-border text-sm text-cc-text placeholder:text-cc-text-dim focus:outline-none focus:border-cc-accent/50 pb-1 font-medium"
          />
          <ModelSelector
            value={agent.model}
            onChange={(model) => onChange({ ...agent, model })}
            compact
          />
        </div>

        <textarea
          value={agent.systemPrompt}
          onChange={(e) =>
            onChange({ ...agent, systemPrompt: e.target.value })
          }
          placeholder="System prompt (optional) - Instructions for this agent..."
          rows={2}
          className="w-full bg-cc-bg border border-cc-border rounded-md px-3 py-2 text-sm text-cc-text placeholder:text-cc-text-dim focus:outline-none focus:border-cc-accent/50 resize-none font-mono"
        />
      </div>
    </div>
  );
}
