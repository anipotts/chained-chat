"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Lock, ArrowRight, Loader2 } from "lucide-react";

export function AccessGate() {
  const { login } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError("");

    const success = await login(code.trim());
    if (!success) {
      setError("Invalid access code");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-cc-surface border border-cc-border mb-4">
            <Lock size={20} className="text-cc-accent" />
          </div>
          <h1 className="text-xl font-semibold text-cc-text font-mono">
            chained.chat
          </h1>
          <p className="text-sm text-cc-text-muted mt-2">
            Enter your access code to continue
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="relative">
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError("");
              }}
              placeholder="Access code"
              autoFocus
              className="w-full bg-cc-surface border border-cc-border rounded-lg px-4 py-3 text-cc-text font-mono text-sm placeholder:text-cc-text-dim focus:outline-none focus:border-cc-accent/50 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md bg-cc-accent/10 text-cc-accent hover:bg-cc-accent/20 transition-colors disabled:opacity-30"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <ArrowRight size={16} />
              )}
            </button>
          </div>
          {error && (
            <p className="text-cc-red text-xs mt-2 font-mono">{error}</p>
          )}
        </form>
      </div>
    </div>
  );
}
