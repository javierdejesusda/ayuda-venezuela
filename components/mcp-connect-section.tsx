'use client';

import { ExternalLink, Plug } from 'lucide-react';

import { CopyField } from '@/components/copy-field';
import { buttonClasses } from '@/components/ui/button';
import { SITE_URL } from '@/lib/constants';

/** Remote MCP endpoint exposing the same public data as read-only tools. */
const MCP_URL = `${SITE_URL}/api/mcp`;

interface ClientGuide {
  name: string;
  instructions: string;
  /** Deep link straight to where the user adds a custom connector. */
  connectorsUrl: string;
}

/**
 * The two connector-style clients this server is known to work with. Both
 * connect to the MCP URL from their own cloud infrastructure (not from the
 * user's device), so it must be a publicly reachable URL — hence the
 * production `SITE_URL`, never localhost. `connectorsUrl` links straight into
 * each product's "add custom connector" screen (Claude: Customize > Connectors;
 * ChatGPT: Settings > Apps > Connectors > Advanced, which requires Developer
 * mode and a Plus/Pro/Team/Enterprise/Edu plan).
 */
const CLIENTS: ClientGuide[] = [
  {
    name: 'Claude',
    instructions: 'Pulsa "+" → "Agregar conector personalizado" y pega la URL de arriba.',
    connectorsUrl: 'https://claude.ai/customize/connectors',
  },
  {
    name: 'ChatGPT',
    instructions:
      'Activa "Modo desarrollador" y crea un conector con la URL de arriba. Requiere plan Plus o superior.',
    connectorsUrl: 'https://chatgpt.com/apps#settings/Connectors/Advanced',
  },
];

/**
 * Setup for connecting Claude and ChatGPT to the MCP server as a custom
 * connector — no code or terminal required. Lives on the Asistente page,
 * next to the chat, as the non-developer path to the same data.
 */
export function McpConnectSection() {
  return (
    <section className="rounded-2xl border border-border bg-surface p-4 sm:p-6">
      <div className="flex items-center gap-2">
        <Plug className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />
        <h2 className="font-display text-lg font-semibold text-ink">Usa este asistente desde Claude o ChatGPT</h2>
      </div>
      <p className="mt-1 text-pretty text-sm text-ink-soft">
        Conecta estos mismos datos a tu cuenta de Claude o ChatGPT como un &quot;conector&quot; —
        sin instalar nada ni escribir código.
      </p>

      <div className="mt-4">
        <CopyField value={MCP_URL} label="URL del servidor MCP" />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {CLIENTS.map((client) => (
          <div key={client.name} className="rounded-2xl border border-border bg-surface-2 p-4 sm:p-5">
            <h3 className="font-display text-sm font-semibold text-ink">{client.name}</h3>
            <p className="mt-1 text-sm text-ink-soft">{client.instructions}</p>
            <a
              href={client.connectorsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses('outline', 'sm', 'mt-3 w-full')}
            >
              Abrir conectores de {client.name}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
