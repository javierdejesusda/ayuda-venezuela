// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

import { HeaderNav } from '@/components/header-nav';
import { SiteFooter } from '@/components/site-footer';
import RedIniciativasPage, { CATEGORY_ICONS } from '@/app/red-de-iniciativas/page';
import { CENTRAL_PLATFORM, INITIATIVE_CATEGORIES } from '@/lib/data/red-iniciativas';

afterEach(() => {
  cleanup();
});

describe('RedIniciativasPage', () => {
  it('renders a level-1 heading for the section', () => {
    render(<RedIniciativasPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: /iniciativas/i }),
    ).toBeTruthy();
  });

  it('features the central platform as a link', () => {
    render(<RedIniciativasPage />);

    const links = screen.getAllByRole('link');
    const central = links.find((l) => l.getAttribute('href') === CENTRAL_PLATFORM.url);
    expect(central).toBeTruthy();
  });

  it('maps an icon for every category slug', () => {
    for (const category of INITIATIVE_CATEGORIES) {
      expect(CATEGORY_ICONS).toHaveProperty(category.slug);
    }
  });

  it('renders a heading for every category', () => {
    render(<RedIniciativasPage />);

    for (const category of INITIATIVE_CATEGORIES) {
      expect(
        screen.getByRole('heading', { name: category.title }),
      ).toBeTruthy();
    }
  });

  it('renders every initiative link with safe external-link attributes', () => {
    render(<RedIniciativasPage />);

    const allUrls = INITIATIVE_CATEGORIES.flatMap((c) => c.urls);
    for (const url of allUrls) {
      const matches = screen
        .getAllByRole('link')
        .filter((l) => l.getAttribute('href') === url);
      expect(matches.length).toBeGreaterThan(0);
      for (const link of matches) {
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      }
    }
  });
});

describe('Red de Iniciativas navigation', () => {
  it('exposes the section in the desktop header nav', () => {
    render(<HeaderNav />);

    const link = screen.getByRole('link', { name: /iniciativas/i });
    expect(link).toHaveAttribute('href', '/red-de-iniciativas');
  });

  it('exposes the section in the footer', () => {
    render(<SiteFooter />);

    const links = screen.getAllByRole('link');
    expect(
      links.some((l) => l.getAttribute('href') === '/red-de-iniciativas'),
    ).toBe(true);
  });
});
