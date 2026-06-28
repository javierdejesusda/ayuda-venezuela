import { Braces, FileDown, FileJson2 } from 'lucide-react';

/** Small metadata pill shown in the header badge row. */
const BADGES = ['v1.0.0', 'OpenAPI 3.1', 'Solo lectura'] as const;

/**
 * Branded header above the API reference. States what the API is in one line and
 * offers the full reference as a Markdown download (handy as context for code
 * agents) and as raw OpenAPI JSON. Uses the civic brand blue, never the
 * emergency semaphore colors, so it reads as a developer surface.
 */
export function ApiDocsToolbar() {
  return (
    <div className="relative mb-4 overflow-hidden rounded-2xl border border-border bg-surface-2 p-5">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-brand-600 via-brand-400 to-transparent opacity-70"
      />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Braces className="h-5 w-5" aria-hidden />
            </span>
            <h1 className="text-balance font-display text-xl font-semibold tracking-tight text-ink">
              API de Apoyo Venezuela
            </h1>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {BADGES.map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-medium text-ink-soft"
              >
                {badge}
              </span>
            ))}
          </div>

          <p className="mt-3 max-w-2xl text-pretty text-sm text-ink-soft">
            API pública de solo lectura. Descarga la referencia en Markdown para usarla como contexto
            con agentes de código, o consulta el documento OpenAPI en JSON.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/v1/openapi.md"
            download="apoyo-venezuela-api.md"
            className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-medium text-white transition-[background-color,transform] duration-150 hover:bg-brand-700 active:scale-[0.96]"
          >
            <FileDown className="h-4 w-4" aria-hidden />
            Descargar Markdown
          </a>
          <a
            href="/api/v1/openapi.json"
            className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl border border-border-strong bg-surface px-4 text-sm font-medium text-ink transition-[background-color,transform] duration-150 hover:bg-surface-2 active:scale-[0.96]"
          >
            <FileJson2 className="h-4 w-4 text-brand-600" aria-hidden />
            OpenAPI JSON
          </a>
        </div>
      </div>
    </div>
  );
}
