"use client";

import { useState } from "react";
import { Plus, ArrowDown, Zap } from "lucide-react";
import { AgentCard, type AgentState } from "./agent-card";
import { MAX_AGENTS, DEFAULT_MODELS, DEFAULT_PRESETS, type ChainPreset } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ChainBuilderProps {
  agents: AgentState[];
  onAgentsChange: (agents: AgentState[]) => void;
}

let agentCounter = 0;

function createAgent(overrides?: Partial<AgentState>): AgentState {
  agentCounter++;
  return {
    id: `agent-${agentCounter}-${Date.now()}`,
    name: overrides?.name || "",
    model: overrides?.model || DEFAULT_MODELS.openai,
    systemPrompt: overrides?.systemPrompt || "",
    ...overrides,
  };
}

export function ChainBuilder({ agents, onAgentsChange }: ChainBuilderProps) {
  const [showPresets, setShowPresets] = useState(agents.length === 0);

  const addAgent = () => {
    if (agents.length >= MAX_AGENTS) return;
    const providers = ["openai", "anthropic", "google"] as const;
    const nextProvider = providers[agents.length % 3];
    onAgentsChange([
      ...agents,
      createAgent({ model: DEFAULT_MODELS[nextProvider] }),
    ]);
    setShowPresets(false);
  };

  const removeAgent = (index: number) => {
    onAgentsChange(agents.filter((_, i) => i !== index));
  };

  const updateAgent = (index: number, agent: AgentState) => {
    const updated = [...agents];
    updated[index] = agent;
    onAgentsChange(updated);
  };

  const loadPreset = (preset: ChainPreset) => {
    const newAgents = preset.agents.map((a) =>
      createAgent({
        name: a.name,
        model: a.model,
        systemPrompt: a.systemPrompt,
      })
    );
    onAgentsChange(newAgents);
    setShowPresets(false);
  };

  if (showPresets && agents.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-cc-text-dim uppercase tracking-wider">
            Quick Start
          </span>
          <button
            onClick={() => {
              addAgent();
              setShowPresets(false);
            }}
            className="text-xs text-cc-accent hover:text-cc-accent/80 transition-colors font-mono"
          >
            blank chain
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {DEFAULT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => loadPreset(preset)}
              className="text-left p-3 rounded-lg border border-cc-border bg-cc-surface hover:border-cc-border-hover transition-colors group"
            >
              <div className="flex items-center gap-2 mb-1">
                <Zap size={12} className="text-cc-accent" />
                <span className="text-sm font-medium text-cc-text">
                  {preset.name}
                </span>
              </div>
              <p className="text-xs text-cc-text-muted leading-relaxed">
                {preset.description}
              </p>
              <div className="flex items-center gap-1 mt-2">
                {preset.agents.map((a, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-mono text-cc-text-dim bg-cc-bg px-1.5 py-0.5 rounded"
                  >
                    {a.name}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-mono text-cc-text-dim uppercase tracking-wider">
          Chain ({agents.length}/{MAX_AGENTS})
        </span>
        {agents.length > 0 && (
          <button
            onClick={() => {
              onAgentsChange([]);
              setShowPresets(true);
            }}
            className="text-xs text-cc-text-dim hover:text-cc-text transition-colors font-mono"
          >
            reset
          </button>
        )}
      </div>

      {agents.map((agent, i) => (
        <div key={agent.id}>
          {i > 0 && (
            <div className="flex items-center justify-center py-1">
              <ArrowDown size={14} className="text-cc-text-dim" />
            </div>
          )}
          <AgentCard
            agent={agent}
            index={i}
            total={agents.length}
            onChange={(updated) => updateAgent(i, updated)}
            onRemove={() => removeAgent(i)}
          />
        </div>
      ))}

      {agents.length < MAX_AGENTS && agents.length > 0 && (
        <button
          onClick={addAgent}
          className="w-full py-2 border border-dashed border-cc-border rounded-lg text-sm text-cc-text-muted hover:border-cc-border-hover hover:text-cc-text transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={14} />
          Add agent
        </button>
      )}
    </div>
  );
}
