"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { PROVIDERS, type Provider, type ModelConfig } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
  compact?: boolean;
}

export function ModelSelector({ value, onChange, compact }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const allModels = Object.values(PROVIDERS).flatMap((p) => p.models);
  const selected = allModels.find((m) => m.id === value);
  const selectedProvider = selected
    ? PROVIDERS[selected.provider]
    : null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 rounded-md border border-cc-border bg-cc-surface text-sm transition-colors hover:border-cc-border-hover",
          compact ? "px-2 py-1" : "px-3 py-2"
        )}
      >
        {selectedProvider && (
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: selectedProvider.color }}
          />
        )}
        <span className="text-cc-text truncate">
          {selected?.label || "Select model"}
        </span>
        <ChevronDown
          size={14}
          className={cn(
            "text-cc-text-dim transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-cc-surface border border-cc-border rounded-lg shadow-xl z-50 py-1 max-h-80 overflow-y-auto scrollbar-thin">
          {(Object.entries(PROVIDERS) as [Provider, typeof PROVIDERS[Provider]][]).map(
            ([key, provider]) => (
              <div key={key}>
                <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-cc-text-dim">
                  {provider.name}
                </div>
                {provider.models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      onChange(model.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2",
                      model.id === value
                        ? "bg-cc-accent/10 text-cc-accent"
                        : "text-cc-text hover:bg-white/5"
                    )}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: provider.color }}
                    />
                    <span className="truncate">{model.label}</span>
                    {model.capabilities.includes("fast") && (
                      <span className="ml-auto text-[10px] text-cc-text-dim font-mono">
                        fast
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
