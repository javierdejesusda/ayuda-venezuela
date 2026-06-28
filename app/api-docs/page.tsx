import type { Metadata } from 'next';

import { ApiDocsToolbar } from '@/components/api-docs-toolbar';
import { ApiReferenceEmbed } from '@/components/api-reference-embed';

export const metadata: Metadata = {
  title: 'API publica',
  description:
    'Documentacion interactiva de la API publica de solo lectura de Apoyo Venezuela: zonas, ' +
    'pedidos de ayuda, campanas y estadisticas.',
};

export default function ApiDocsPage() {
  return (
    <>
      <ApiDocsToolbar />
      <ApiReferenceEmbed />
    </>
  );
}
