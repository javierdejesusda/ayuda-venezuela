// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { FundraiserList } from '@/components/fundraiser-list';
import { PAGE_SIZE } from '@/lib/data/store';
import type { Fundraiser } from '@/lib/data/types';

function makeFundraiser(id: string): Fundraiser {
  const ts = '2026-06-25T00:00:00.000Z';
  return {
    id,
    titulo: `Campaña ${id}`,
    descripcion: 'Descripción de ejemplo suficientemente larga para pasar la validación.',
    url: `https://www.gofundme.com/f/${id}`,
    createdAt: ts,
    updatedAt: ts,
  };
}

function makeFundraisers(n: number): Fundraiser[] {
  return Array.from({ length: n }, (_, i) => makeFundraiser(`f${i + 1}`));
}

afterEach(() => {
  cleanup();
});

describe('FundraiserList', () => {
  it('renders empty state when the list is empty', () => {
    render(<FundraiserList fundraisers={[]} />);
    expect(screen.getByText(/aún no hay recaudaciones/i)).toBeInTheDocument();
  });

  it('shows all cards and no "Ver más" button when count fits in one page', () => {
    const fundraisers = makeFundraisers(5);
    render(<FundraiserList fundraisers={fundraisers} />);
    expect(screen.getAllByRole('article')).toHaveLength(5);
    expect(screen.queryByRole('button', { name: /más/i })).toBeNull();
  });

  it('shows only the first PAGE_SIZE items when total exceeds page size', () => {
    const fundraisers = makeFundraisers(PAGE_SIZE + 5);
    render(<FundraiserList fundraisers={fundraisers} />);
    expect(screen.getAllByRole('article')).toHaveLength(PAGE_SIZE);
  });

  it('shows "Ver más (N restantes)" when total exceeds page size', () => {
    const fundraisers = makeFundraisers(PAGE_SIZE + 7);
    render(<FundraiserList fundraisers={fundraisers} />);
    const btn = screen.getByRole('button', { name: /más/i });
    expect(btn).toBeInTheDocument();
    expect(btn.textContent).toContain('7 restantes');
  });

  it('button label uses the accented "más" with tilde', () => {
    const fundraisers = makeFundraisers(PAGE_SIZE + 1);
    render(<FundraiserList fundraisers={fundraisers} />);
    const btn = screen.getByRole('button', { name: /más/i });
    expect(btn.textContent).toContain('más');
  });

  it('clicking "Ver más" reveals the remaining items', () => {
    const fundraisers = makeFundraisers(PAGE_SIZE + 3);
    render(<FundraiserList fundraisers={fundraisers} />);
    fireEvent.click(screen.getByRole('button', { name: /más/i }));
    expect(screen.getAllByRole('article')).toHaveLength(PAGE_SIZE + 3);
  });

  it('hides "Ver más" button once all items are visible', () => {
    const fundraisers = makeFundraisers(PAGE_SIZE + 3);
    render(<FundraiserList fundraisers={fundraisers} />);
    fireEvent.click(screen.getByRole('button', { name: /más/i }));
    expect(screen.queryByRole('button', { name: /más/i })).toBeNull();
  });

  it('results container has aria-live polite', () => {
    render(<FundraiserList fundraisers={makeFundraisers(3)} />);
    expect(document.querySelector('[aria-live="polite"]')).toBeInTheDocument();
  });
});
