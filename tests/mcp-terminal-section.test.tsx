// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { McpTerminalSection } from '@/components/mcp-terminal-section';

afterEach(() => {
  cleanup();
});

describe('McpTerminalSection', () => {
  it('exposes an #mcp anchor for the toolbar jump link', () => {
    const { container } = render(<McpTerminalSection />);

    expect(container.querySelector('#mcp')).toBeInTheDocument();
  });

  it('shows the MCP server URL', () => {
    render(<McpTerminalSection />);

    expect(screen.getAllByText(/\/api\/mcp/).length).toBeGreaterThan(0);
  });

  it('offers a Claude Code CLI command', () => {
    render(<McpTerminalSection />);

    expect(screen.getByRole('heading', { name: /claude code/i })).toBeInTheDocument();
    expect(screen.getByText(/claude mcp add --transport http/)).toBeInTheDocument();
  });

  it('offers an mcp.json config snippet using mcp-remote', () => {
    render(<McpTerminalSection />);

    expect(screen.getAllByText(/mcp-remote/).length).toBeGreaterThan(0);
    expect(screen.getByText(/"mcpServers"/)).toBeInTheDocument();
  });

  it('offers copy buttons for the URL and each snippet', () => {
    render(<McpTerminalSection />);

    expect(screen.getByRole('button', { name: /copiar url del servidor mcp/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copiar comando de claude code/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copiar configuraci[oó]n json/i })).toBeInTheDocument();
  });
});
