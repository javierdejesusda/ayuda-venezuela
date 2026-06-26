// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Filters } from '@/components/filters';
import type { LocationFilters } from '@/lib/data/types';

const ciudadesByEstado: Record<string, string[]> = {
  Carabobo: ['Guacara', 'Valencia'],
  Aragua: ['Maracay'],
};

function renderFilters(
  value: LocationFilters = {},
  onChange = vi.fn(),
  extra: { ciudadesByEstado?: Record<string, string[]> } = {},
) {
  render(
    <Filters
      value={value}
      onChange={onChange}
      states={['Aragua', 'Carabobo']}
      resultCount={0}
      ciudadesByEstado={extra.ciudadesByEstado ?? ciudadesByEstado}
    />,
  );
  return { onChange };
}

describe('Filters ciudad select', () => {
  it('is disabled when no estado is selected', () => {
    renderFilters({});
    const select = screen.getByRole('combobox', { name: /ciudad/i });
    expect(select).toBeDisabled();
  });

  it('shows placeholder text when disabled', () => {
    renderFilters({});
    expect(screen.getByText('Selecciona un estado primero')).toBeInTheDocument();
  });

  it('is enabled and shows ciudades when an estado is selected', () => {
    renderFilters({ estado: 'Carabobo' });
    const select = screen.getByRole('combobox', { name: /ciudad/i });
    expect(select).not.toBeDisabled();
    expect(screen.getByText('Valencia')).toBeInTheDocument();
    expect(screen.getByText('Guacara')).toBeInTheDocument();
  });

  it('shows "Todas las ciudades" as the first option when estado is selected', () => {
    renderFilters({ estado: 'Carabobo' });
    const select = screen.getByRole('combobox', { name: /ciudad/i });
    const options = Array.from(select.querySelectorAll('option'));
    expect(options[0].textContent).toBe('Todas las ciudades');
    expect((options[0] as HTMLOptionElement).value).toBe('');
  });

  it('selecting a ciudad calls onChange with that ciudad', () => {
    const onChange = vi.fn();
    render(
      <Filters
        value={{ estado: 'Carabobo' }}
        onChange={onChange}
        states={['Carabobo']}
        resultCount={0}
        ciudadesByEstado={ciudadesByEstado}
      />,
    );
    const select = screen.getByRole('combobox', { name: /ciudad/i });
    fireEvent.change(select, { target: { value: 'Valencia' } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ ciudad: 'Valencia' }),
    );
  });

  it('selecting empty ciudad value calls onChange without ciudad (undefined)', () => {
    const onChange = vi.fn();
    render(
      <Filters
        value={{ estado: 'Carabobo', ciudad: 'Valencia' }}
        onChange={onChange}
        states={['Carabobo']}
        resultCount={0}
        ciudadesByEstado={ciudadesByEstado}
      />,
    );
    const select = screen.getByRole('combobox', { name: /ciudad/i });
    fireEvent.change(select, { target: { value: '' } });
    const called = onChange.mock.calls[0][0] as LocationFilters;
    expect(called.ciudad).toBeUndefined();
  });

  it('changing estado resets ciudad in the onChange payload', () => {
    const onChange = vi.fn();
    render(
      <Filters
        value={{ estado: 'Carabobo', ciudad: 'Valencia' }}
        onChange={onChange}
        states={['Aragua', 'Carabobo']}
        resultCount={0}
        ciudadesByEstado={ciudadesByEstado}
      />,
    );
    const estadoSelect = screen.getByRole('combobox', { name: /estado/i });
    fireEvent.change(estadoSelect, { target: { value: 'Aragua' } });
    const called = onChange.mock.calls[0][0] as LocationFilters;
    expect(called.estado).toBe('Aragua');
    expect(called.ciudad).toBeUndefined();
  });

  it('ciudad is included in hasFilters so the clear button appears', () => {
    renderFilters({ estado: 'Carabobo', ciudad: 'Valencia' });
    expect(screen.getByRole('button', { name: /limpiar/i })).toBeInTheDocument();
  });
});
