'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

/**
 * The API base URL shown in the docs header as a copyable chip. Developers' first
 * question is "where do I call?", so this puts the base URL one tap from the
 * clipboard. The copy affordance cross-fades Copy -> Check on success and resets
 * itself, and the outer/inner radii are concentric (rounded-xl shell, p-1 padding,
 * rounded-lg button).
 */
export function ApiBaseUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can be unavailable (insecure context / denied permission);
      // the URL is still visible to select and copy manually.
    }
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-xl border border-border bg-surface py-1 pl-3 pr-1">
      <code className="font-mono text-xs text-ink-soft sm:text-sm">{url}</code>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? 'Base URL copiada' : 'Copiar base URL'}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint transition-[background-color,color,transform] duration-150 hover:bg-surface-2 hover:text-ink active:scale-[0.92]"
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
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? 'Base URL copiada' : ''}
      </span>
    </span>
  );
}
