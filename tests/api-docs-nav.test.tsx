// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

import { ApiDocsToolbar } from '@/components/api-docs-toolbar';
import { HeaderNav } from '@/components/header-nav';
import { SiteFooter } from '@/components/site-footer';

afterEach(() => {
  cleanup();
});

describe('API docs Markdown download', () => {
  it('offers a download link to the Markdown reference', () => {
    render(<ApiDocsToolbar />);

    const link = screen.getByRole('link', { name: /markdown/i });
    expect(link).toHaveAttribute('href', '/api/v1/openapi.md');
    expect(link).toHaveAttribute('download');
  });

  it('links to the raw OpenAPI JSON document', () => {
    render(<ApiDocsToolbar />);

    const link = screen.getByRole('link', { name: /openapi json/i });
    expect(link).toHaveAttribute('href', '/api/v1/openapi.json');
  });

  it('frames the Markdown download as the recommended option for AI agents', () => {
    render(<ApiDocsToolbar />);

    const link = screen.getByRole('link', { name: /markdown/i });
    expect(link).toHaveAccessibleName(/agentes/i);
  });

  it('shows the API base URL so developers can copy where to call', () => {
    render(<ApiDocsToolbar />);

    expect(screen.getByText(/\/api\/v1/)).toBeInTheDocument();
  });

  it('links to the MCP setup section further down the page', () => {
    render(<ApiDocsToolbar />);

    const link = screen.getByRole('link', { name: /conectar por mcp/i });
    expect(link).toHaveAttribute('href', '#mcp');
  });
});

describe('API docs navigation access', () => {
  it('exposes an /api-docs link in the desktop header nav', () => {
    render(<HeaderNav />);

    const link = screen.getByRole('link', { name: /^api$/i });
    expect(link).toHaveAttribute('href', '/api-docs');
  });

  it('exposes an /api-docs link in the footer', () => {
    render(<SiteFooter />);

    const links = screen.getAllByRole('link');
    expect(links.some((link) => link.getAttribute('href') === '/api-docs')).toBe(true);
  });
});
