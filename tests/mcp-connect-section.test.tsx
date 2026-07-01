// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { McpConnectSection } from '@/components/mcp-connect-section';

afterEach(() => {
  cleanup();
});

describe('McpConnectSection', () => {
  it('shows the MCP server URL', () => {
    render(<McpConnectSection />);

    expect(screen.getByText(/\/api\/mcp/)).toBeInTheDocument();
  });

  it('offers a button to copy the MCP server URL', () => {
    render(<McpConnectSection />);

    expect(screen.getByRole('button', { name: /copiar url del servidor mcp/i })).toBeInTheDocument();
  });

  it('links straight to the Claude connectors screen', () => {
    render(<McpConnectSection />);

    expect(screen.getByRole('heading', { name: /^claude$/i })).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /abrir conectores de claude/i });
    expect(link).toHaveAttribute('href', 'https://claude.ai/customize/connectors');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('links straight to the ChatGPT connectors screen', () => {
    render(<McpConnectSection />);

    expect(screen.getByRole('heading', { name: /^chatgpt$/i })).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /abrir conectores de chatgpt/i });
    expect(link).toHaveAttribute('href', 'https://chatgpt.com/apps#settings/Connectors/Advanced');
    expect(link).toHaveAttribute('target', '_blank');
  });
});
