import type { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'API publica',
  description:
    'Documentacion interactiva de la API publica de solo lectura de Apoyo Venezuela: zonas, ' +
    'pedidos de ayuda, campanas y estadisticas.',
};

/**
 * Interactive API reference. Scalar reads the OpenAPI document served at
 * /api/v1/openapi.json (via the data-url attribute) and renders the full docs.
 */
export default function ApiDocsPage() {
  return (
    <>
      <script id="api-reference" data-url="/api/v1/openapi.json" />
      <Script
        src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"
        strategy="afterInteractive"
      />
    </>
  );
}
