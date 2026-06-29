import { describe, expect, it } from 'vitest';

import { openApiToMarkdown } from '@/lib/api/openapi-markdown';
import { openApiDocument } from '@/lib/api/openapi';

const md = openApiToMarkdown(openApiDocument);

describe('openApiToMarkdown', () => {
  it('opens with the API title and states the version', () => {
    expect(md).toContain('# Ayuda Venezuela API');
    expect(md).toContain('1.0.0');
  });

  it('links back to the machine-readable spec', () => {
    expect(md).toContain('/api/v1/openapi.json');
  });

  it('documents every path and its method', () => {
    expect(md).toContain('GET /api/v1/zonas');
    expect(md).toContain('GET /api/v1/zonas/{id}');
    expect(md).toContain('GET /api/v1/pedidos');
    expect(md).toContain('GET /api/v1/campanas');
    expect(md).toContain('GET /api/v1/estadisticas');
  });

  it('lists query parameters by name', () => {
    expect(md).toContain('estado');
    expect(md).toContain('limit');
    expect(md).toContain('cursor');
  });

  it('documents the schemas and their fields', () => {
    expect(md).toContain('## Esquemas');
    expect(md).toContain('### Zona');
    expect(md).toContain('personasAtrapadas');
    expect(md).toContain('aceptaVoluntarios');
  });

  it('expands enum values from the domain constants', () => {
    expect(md).toContain('derrumbe');
  });

  it('preserves the contact privacy note', () => {
    expect(md.toLowerCase()).toContain('detalle');
  });

  it('marks a 404 response where one is documented', () => {
    expect(md).toContain('404');
  });
});

const mdAbs = openApiToMarkdown(openApiDocument, 'https://apoyovenezuela.com');

describe('openApiToMarkdown self-contained output', () => {
  it('embeds an absolute base URL and full endpoint URLs', () => {
    expect(mdAbs).toContain('https://apoyovenezuela.com');
    expect(mdAbs).toContain('https://apoyovenezuela.com/api/v1/zonas');
  });

  it('documents how to use the API (auth, pagination, error envelope)', () => {
    expect(mdAbs.toLowerCase()).toContain('autenticacion');
    expect(mdAbs).toContain('nextCursor');
    expect(mdAbs).toContain('"error"');
  });

  it('shows a runnable curl example', () => {
    expect(mdAbs).toContain('curl "https://apoyovenezuela.com/api/v1/zonas');
  });

  it('shows an example JSON response carrying the data envelope', () => {
    expect(mdAbs).toContain('```json');
    expect(mdAbs).toContain('"data"');
  });

  it('documents parameter defaults', () => {
    expect(mdAbs).toContain('| Default |');
  });

  it('fully populates nested example values (no truncated nulls)', () => {
    // Pedido lives nested inside Zona.pedidos; its example fields must resolve,
    // not bottom out at null from a too-shallow recursion guard.
    expect(mdAbs).not.toContain('"id": null');
    expect(mdAbs).toContain('"categoria": "rescate"');
  });
});
