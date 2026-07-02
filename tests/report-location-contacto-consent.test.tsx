// @vitest-environment jsdom
/**
 * The contact name/phone a reporter enters is shown on the public zona page so
 * people can reach whoever needs help. The form must (1) warn clearly that this
 * data becomes public and (2) require an explicit consent before any contact
 * info is submitted - while never blocking a report that carries no contact
 * info, since a legitimate emergency report must always go through.
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/app/actions', () => ({ createLocationAction: vi.fn() }));
vi.mock('@/app/geocode-actions', () => ({ geocodeReverseAction: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/components/location-picker', () => ({
  default: () => <div data-testid="location-picker" />,
}));
vi.mock('@/lib/data/supabase-browser', () => ({ getBrowserSupabase: () => null }));

import { createLocationAction } from '@/app/actions';
import ReportLocationForm from '@/components/report-location-form';

function fillRequired(): void {
  fireEvent.change(document.querySelector('#nombre') as HTMLInputElement, {
    target: { value: 'Edificio Rita' },
  });
  fireEvent.change(document.querySelector('#estado') as HTMLSelectElement, {
    target: { value: 'Carabobo' },
  });
  fireEvent.change(document.querySelector('#ciudad') as HTMLInputElement, {
    target: { value: 'Valencia' },
  });
}

function submit(): void {
  fireEvent.click(screen.getByRole('button', { name: /Publicar reporte/i }));
}

beforeEach(() => {
  vi.mocked(createLocationAction).mockResolvedValue({ ok: true, data: { id: 'z1' } });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ReportLocationForm contact PII notice and consent', () => {
  it('warns that contact data will be public and visible to anyone', () => {
    render(<ReportLocationForm />);
    const text = (document.body.textContent ?? '').toLowerCase();
    expect(text).toMatch(/p[úu]blic/);
    expect(text).toContain('cualquier');
  });

  it('renders a consent checkbox for the contact data', () => {
    render(<ReportLocationForm />);
    expect(screen.getByRole('checkbox', { name: /p[úu]blico/i })).toBeTruthy();
  });

  it('submits without consent when no contact info is entered', async () => {
    render(<ReportLocationForm />);
    fillRequired();
    submit();
    await waitFor(() => expect(createLocationAction).toHaveBeenCalledTimes(1));
  });

  it('blocks submission when contact info is entered without consent', async () => {
    render(<ReportLocationForm />);
    fillRequired();
    fireEvent.change(document.querySelector('#contactoNombre') as HTMLInputElement, {
      target: { value: 'Juan Pérez' },
    });
    submit();

    await screen.findByRole('alert');
    expect(createLocationAction).not.toHaveBeenCalled();
  });

  it('submits contact info once consent is given', async () => {
    render(<ReportLocationForm />);
    fillRequired();
    fireEvent.change(document.querySelector('#contactoNombre') as HTMLInputElement, {
      target: { value: 'Juan Pérez' },
    });
    fireEvent.change(document.querySelector('#contactoTelefono') as HTMLInputElement, {
      target: { value: '0414-1234567' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: /p[úu]blico/i }));
    submit();

    await waitFor(() => expect(createLocationAction).toHaveBeenCalledTimes(1));
    expect(vi.mocked(createLocationAction).mock.calls[0][0]).toMatchObject({
      contactoNombre: 'Juan Pérez',
      contactoTelefono: '0414-1234567',
    });
  });
});
