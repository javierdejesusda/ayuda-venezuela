// @vitest-environment jsdom
/**
 * Tests for the "Acepta voluntarios" filter toggle, shown only in ayuda mode so
 * people looking to help can narrow the list/map to locations that accept them.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Filters } from '@/components/filters';
import type { LocationFilters } from '@/lib/data/types';

function renderFilters(value: LocationFilters, onChange = vi.fn(), mode: 'ayuda' | 'danos' = 'ayuda') {
  render(
    <Filters
      value={value}
      onChange={onChange}
      states={['Carabobo']}
      resultCount={0}
      mode={mode}
    />,
  );
  return { onChange };
}

afterEach(() => {
  cleanup();
});

describe('Filters - acepta voluntarios toggle', () => {
  it('shows the "Acepta voluntarios" toggle in ayuda mode', () => {
    renderFilters({ soloConPedidos: true }, vi.fn(), 'ayuda');
    expect(screen.getByRole('button', { name: /acepta voluntarios/i })).toBeInTheDocument();
  });

  it('does not show the toggle in danos mode', () => {
    renderFilters({}, vi.fn(), 'danos');
    expect(screen.queryByRole('button', { name: /acepta voluntarios/i })).toBeNull();
  });

  it('clicking the toggle calls onChange with soloVoluntarios true', () => {
    const { onChange } = renderFilters({ soloConPedidos: true }, vi.fn(), 'ayuda');
    fireEvent.click(screen.getByRole('button', { name: /acepta voluntarios/i }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ soloVoluntarios: true }));
  });

  it('clicking an active toggle clears soloVoluntarios', () => {
    const { onChange } = renderFilters(
      { soloConPedidos: true, soloVoluntarios: true },
      vi.fn(),
      'ayuda',
    );
    fireEvent.click(screen.getByRole('button', { name: /acepta voluntarios/i }));
    const called = onChange.mock.calls[0][0] as LocationFilters;
    expect(called.soloVoluntarios).toBeUndefined();
  });

  it('marks the toggle pressed when soloVoluntarios is active', () => {
    renderFilters({ soloConPedidos: true, soloVoluntarios: true }, vi.fn(), 'ayuda');
    const toggle = screen.getByRole('button', { name: /acepta voluntarios/i });
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
  });
});
