// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

import { HeaderNav } from '@/components/header-nav';
import { SiteFooter } from '@/components/site-footer';

afterEach(() => {
  cleanup();
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
