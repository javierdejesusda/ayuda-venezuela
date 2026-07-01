import type { Metadata } from 'next';

import { ApiDocsToolbar } from '@/components/api-docs-toolbar';
import { ApiReferenceEmbed } from '@/components/api-reference-embed';
import { McpTerminalSection } from '@/components/mcp-terminal-section';

export const metadata: Metadata = {
  title: 'API publica',
  description:
    'Documentacion interactiva de la API publica de solo lectura de Apoyo Venezuela: zonas, ' +
    'pedidos de ayuda, campanas y estadisticas.',
};

export default function ApiDocsPage() {
  // Break out of the centered max-w-5xl main column and cancel its top padding so
  // the masthead sits flush under the sticky header and the whole docs surface
  // (header band + Scalar reference) spans the full viewport as one piece.
  return (
    <div className="relative left-1/2 right-1/2 -mx-[50vw] -mt-4 w-screen">
      <ApiDocsToolbar />
      <ApiReferenceEmbed />
      <McpTerminalSection />
    </div>
  );
}
