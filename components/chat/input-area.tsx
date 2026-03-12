"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Image, X, Loader2, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface InputAreaProps {
  onSubmit: (input: string, images: string[]) => void;
  isLoading: boolean;
  showChainToggle?: boolean;
  isChainOpen?: boolean;
  onToggleChain?: () => void;
  agentCount?: number;
}

export function InputArea({
  onSubmit,
  isLoading,
  showChainToggle,
  isChainOpen,
  onToggleChain,
  agentCount = 0,
}: InputAreaProps) {
  const [input, setInput] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [input]);

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return;
    onSubmit(input.trim(), images);
    setInput("");
    setImages([]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setImages((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  return (
    <div className="border-t border-cc-border bg-cc-bg p-3 sm:p-4">
      <div className="max-w-3xl mx-auto">
        {/* Image previews */}
        {images.length > 0 && (
          <div className="flex gap-2 mb-2 flex-wrap">
            {images.map((url, i) => (
              <div key={i} className="relative group">
                <img
                  src={url}
                  alt="upload"
                  className="w-16 h-16 rounded-md border border-cc-border object-cover"
                />
                <button
                  onClick={() => setImages(images.filter((_, j) => j !== i))}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-cc-red text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                agentCount > 0
                  ? `Message ${agentCount} chained agent${agentCount > 1 ? "s" : ""}...`
                  : "Type a message..."
              }
              rows={1}
              disabled={isLoading}
              className="w-full bg-cc-surface border border-cc-border rounded-lg px-4 py-3 pr-20 text-sm text-cc-text placeholder:text-cc-text-dim focus:outline-none focus:border-cc-accent/50 resize-none transition-colors disabled:opacity-50"
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="p-1.5 rounded-md text-cc-text-dim hover:text-cc-text hover:bg-white/5 transition-colors disabled:opacity-30"
                title="Upload image"
              >
                <Image size={16} />
              </button>
              {showChainToggle && (
                <button
                  onClick={onToggleChain}
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    isChainOpen
                      ? "text-cc-accent bg-cc-accent/10"
                      : "text-cc-text-dim hover:text-cc-text hover:bg-white/5"
                  )}
                  title="Configure chain"
                >
                  <Settings2 size={16} />
                </button>
              )}
              <button
                onClick={handleSubmit}
                disabled={isLoading || !input.trim()}
                className="p-1.5 rounded-md bg-cc-accent/10 text-cc-accent hover:bg-cc-accent/20 transition-colors disabled:opacity-30"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
