import { FileDown } from 'lucide-react';

/**
 * Header strip above the API reference. Explains the API in one line and offers
 * the full reference as a Markdown download, handy as context for code agents.
 */
export function ApiDocsToolbar() {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface-2 px-4 py-3">
      <div className="min-w-0">
        <h1 className="font-display text-lg font-semibold text-ink">Documentación de la API</h1>
        <p className="mt-0.5 text-pretty text-sm text-ink-soft">
          API pública de solo lectura. Descarga la referencia en Markdown para usarla como contexto
          con agentes de código.
        </p>
      </div>
      <a
        href="/api/v1/openapi.md"
        download="apoyo-venezuela-api.md"
        className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl border border-border-strong bg-surface px-4 text-sm font-medium text-ink transition-[background-color,transform] duration-150 hover:bg-surface-2 active:scale-[0.96]"
      >
        <FileDown className="h-4 w-4 text-brand-600" aria-hidden />
        Descargar Markdown
      </a>
    </div>
  );
}
