// @vitest-environment jsdom
/**
 * Tests for the acepta_voluntarios checkbox added to ReportLocationForm: it
 * lets a citizen flag the location they are reporting as accepting volunteers.
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('next/dynamic', () => ({
  default: () => () => null,
}));

vi.mock('@/app/actions', () => ({
  createLocationAction: vi.fn(),
}));

vi.mock('@/app/geocode-actions', () => ({
  geocodeReverseAction: vi.fn(),
}));

vi.mock('@/lib/data/supabase-browser', () => ({
  getBrowserSupabase: () => null,
}));

import { createLocationAction } from '@/app/actions';
import ReportLocationForm from '@/components/report-location-form';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ReportLocationForm - acepta_voluntarios checkbox', () => {
  it('renders an "acepta voluntarios" checkbox', () => {
    render(<ReportLocationForm />);
    const checkbox = screen.getByRole('checkbox', { name: /recibe voluntarios/i });
    expect(checkbox).toBeTruthy();
  });

  it('defaults to unchecked', () => {
    render(<ReportLocationForm />);
    const checkbox = screen.getByRole('checkbox', { name: /recibe voluntarios/i }) as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it('passes acepta_voluntarios true to the action when checked', async () => {
    const mockAction = vi.mocked(createLocationAction);
    mockAction.mockResolvedValue({ ok: true, data: { id: 'zona_1' } });

    render(<ReportLocationForm />);
    fireEvent.click(screen.getByRole('checkbox', { name: /recibe voluntarios/i }));
    fireEvent.click(screen.getByRole('button', { name: /Publicar reporte/i }));

    await waitFor(() => expect(mockAction).toHaveBeenCalledTimes(1));
    expect(mockAction.mock.calls[0][0]).toMatchObject({ acepta_voluntarios: true });
  });

  it('passes acepta_voluntarios false to the action when left unchecked', async () => {
    const mockAction = vi.mocked(createLocationAction);
    mockAction.mockResolvedValue({ ok: true, data: { id: 'zona_2' } });

    render(<ReportLocationForm />);
    fireEvent.click(screen.getByRole('button', { name: /Publicar reporte/i }));

    await waitFor(() => expect(mockAction).toHaveBeenCalledTimes(1));
    expect(mockAction.mock.calls[0][0]).toMatchObject({ acepta_voluntarios: false });
  });
});
