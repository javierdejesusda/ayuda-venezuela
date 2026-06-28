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
