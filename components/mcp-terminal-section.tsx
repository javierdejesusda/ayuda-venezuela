'use client';

import { SquareTerminal } from 'lucide-react';

import { CopyField } from '@/components/copy-field';
import { SITE_URL } from '@/lib/constants';

/** Remote MCP endpoint exposing the same public data as read-only tools. */
const MCP_URL = `${SITE_URL}/api/mcp`;

const CLI_COMMAND = `claude mcp add --transport http apoyo-venezuela ${MCP_URL}`;

const CONFIG_JSON = `{
  "mcpServers": {
    "apoyo-venezuela": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "${MCP_URL}"]
    }
  }
}`;

/**
 * Setup instructions for wiring the MCP server into terminal- and
 * config-file-driven clients (Claude Code, Cursor, Windsurf, custom agents).
 * Placed below the Scalar reference (jumped to via `#mcp` from the toolbar)
 * so the REST reference stays the page's main focus.
 */
export function McpTerminalSection() {
  return (
    <section id="mcp" className="scroll-mt-24 border-b border-border bg-surface px-4 py-7 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2">
        <SquareTerminal className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />
        <h2 className="font-display text-lg font-semibold text-ink">Conectar por MCP</h2>
      </div>
      <p className="mt-1 text-pretty text-sm text-ink-soft">
        La misma API, expuesta como herramientas MCP de solo lectura vía HTTP streamable, para
        agentes y clientes que se configuran por terminal o archivo de configuración.
      </p>

      <div className="mt-4">
        <CopyField value={MCP_URL} label="URL del servidor MCP" />
      </div>

      <div className="mt-5 flex flex-col gap-4">
        <div className="rounded-2xl border border-border bg-surface-2 p-4 sm:p-5">
          <h3 className="font-display text-sm font-semibold text-ink">Claude Code (CLI)</h3>
          <p className="mt-1 text-sm text-ink-soft">
            Soporta HTTP streamable de forma nativa, sin puente adicional.
          </p>
          <div className="mt-2">
            <CopyField value={CLI_COMMAND} label="comando de Claude Code" multiline />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface-2 p-4 sm:p-5">
          <h3 className="font-display text-sm font-semibold text-ink">
            Cursor, Windsurf, Claude Desktop...
          </h3>
          <p className="mt-1 text-sm text-ink-soft">
            Agrega esta entrada a tu <code className="text-ink">mcp.json</code>. Usa{' '}
            <code className="text-ink">mcp-remote</code> como puente para clientes sin soporte HTTP
            nativo:
          </p>
          <div className="mt-2">
            <CopyField value={CONFIG_JSON} label="configuración JSON" multiline />
          </div>
        </div>
      </div>
    </section>
  );
}
