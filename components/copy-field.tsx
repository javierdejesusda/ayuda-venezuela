'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

interface CopyFieldProps {
  value: string;
  label: string;
  /** Renders `value` as a wrapping, multi-line block instead of a truncated single line. */
  multiline?: boolean;
}

/**
 * A code row with a copy-to-clipboard button. Shared by the MCP setup
 * sections on the Asistente and API docs pages, which both need to hand a
 * user a URL, CLI command, or config snippet they can copy in one tap.
 */
export function CopyField({ value, label, multiline = false }: CopyFieldProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can be unavailable (insecure context / denied permission);
      // the value is still visible to select and copy manually.
    }
  }

  return (
    <div className="flex items-center gap-1 rounded-xl border border-border bg-surface-2 py-1 pl-3 pr-1">
      {multiline ? (
        <pre className="flex-1 overflow-x-auto py-1.5 font-mono text-xs text-ink-soft sm:text-sm">
          {value}
        </pre>
      ) : (
        <code className="flex-1 truncate font-mono text-xs text-ink-soft sm:text-sm">{value}</code>
      )}
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? `${label} copiado` : `Copiar ${label}`}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center self-start rounded-lg text-ink-faint transition-[background-color,color,transform] duration-150 hover:bg-surface hover:text-ink active:scale-[0.92]"
      >
        <span className="relative inline-flex h-4 w-4 items-center justify-center">
          <Copy
            aria-hidden
            className={`absolute h-4 w-4 transition-[opacity,transform] duration-200 ${
              copied ? 'scale-50 opacity-0' : 'scale-100 opacity-100'
            }`}
          />
          <Check
            aria-hidden
            className={`absolute h-4 w-4 text-brand-600 transition-[opacity,transform] duration-200 ${
              copied ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
            }`}
          />
        </span>
      </button>
    </div>
  );
}
