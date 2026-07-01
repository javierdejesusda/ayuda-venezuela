import { Braces, FileDown, FileJson2, Plug } from 'lucide-react';

import { ApiBaseUrl } from '@/components/api-base-url';
import { buttonClasses } from '@/components/ui/button';
import { SITE_URL } from '@/lib/constants';

/** Metadata pills shown under the title. */
const BADGES = ['v1.0.0', 'OpenAPI 3.1', 'Solo lectura'] as const;

/** Absolute base URL every endpoint hangs off of. */
const BASE_URL = `${SITE_URL}/api/v1`;

/** Remote MCP endpoint exposing the same data as tools for AI agents. */
const MCP_URL = `${SITE_URL}/api/mcp`;

/**
 * Masthead for the API reference. A full-bleed band that sits flush above the
 * Scalar reference (no floating card, no gap) so the page reads as one surface.
 * It states what the API is, exposes the base URL one tap from the clipboard, and
 * offers the full reference as a Markdown download (the recommended context for AI
 * agents) and as raw OpenAPI JSON. Civic brand blue only, never the emergency
 * semaphore colors, so it reads as a developer surface.
 */
export function ApiDocsToolbar() {
  return (
    <header className="relative border-b border-border bg-surface">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-brand-600 via-brand-400 to-transparent"
      />
      <div className="flex flex-col gap-6 px-4 py-7 sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:gap-10 lg:px-8">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/20 bg-brand-50 py-1 pl-2 pr-2.5 text-tone-brand-text dark:border-brand-400/25 dark:bg-brand-500/10">
            <Braces className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="eyebrow">API pública</span>
          </p>

          <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            API de Apoyo Venezuela
          </h1>

          <p className="mt-2 max-w-xl text-pretty text-sm text-ink-soft">
            Referencia interactiva de solo lectura sobre zonas afectadas, pedidos de ayuda, campañas
            y estadísticas. Toda la documentación está abajo, ya expandida.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {BADGES.map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-ink-soft"
              >
                {badge}
              </span>
            ))}
            <ApiBaseUrl url={BASE_URL} />
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto">
          <a
            href="/api/v1/openapi.md"
            download="apoyo-venezuela-api.md"
            className="group flex items-center gap-3 rounded-xl bg-brand-600 px-4 py-2.5 text-left text-white shadow-sm transition-[background-color,transform] duration-150 hover:bg-brand-700 active:scale-[0.96]"
          >
            <FileDown className="h-5 w-5 shrink-0" aria-hidden />
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">Descargar Markdown</span>
              <span className="text-xs text-white/80">Mejor contexto para agentes de IA</span>
            </span>
          </a>
          <a
            href="/api/v1/openapi.json"
            className={buttonClasses('outline', 'md', 'w-full justify-center')}
          >
            <FileJson2 className="h-4 w-4 text-brand-600" aria-hidden />
            OpenAPI JSON
          </a>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs text-ink-soft">
            <Plug className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />
            <span>
              Servidor MCP para agentes de IA:{' '}
              <code className="break-all text-ink">{MCP_URL}</code>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
