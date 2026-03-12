"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { Copy, Check } from "lucide-react";
import { useState, useCallback } from "react";

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

export function MarkdownRenderer({
  content,
  isStreaming,
}: MarkdownRendererProps) {
  return (
    <div
      className={`markdown-content ${isStreaming ? "streaming-cursor" : ""}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const code = String(children).replace(/\n$/, "");

            if (match) {
              return <CodeBlock language={match[1]} code={code} />;
            }

            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div className="relative group my-3">
      <div className="flex items-center justify-between px-3 py-1.5 bg-cc-surface border border-cc-border rounded-t-md">
        <span className="text-xs font-mono text-cc-text-dim">{language}</span>
        <button
          onClick={handleCopy}
          className="text-cc-text-dim hover:text-cc-text transition-colors p-1"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: "0 0 6px 6px",
          border: "1px solid #262626",
          borderTop: "none",
          background: "#141414",
          fontSize: "0.8125rem",
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
