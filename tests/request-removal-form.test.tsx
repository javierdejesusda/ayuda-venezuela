// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RequestRemovalForm } from '@/components/request-removal-form';

const { requestRemovalAction } = vi.hoisted(() => ({
  requestRemovalAction: vi.fn(),
}));

vi.mock('@/app/actions', () => ({ requestRemovalAction }));

function openForm(): void {
  fireEvent.click(screen.getByRole('button', { name: /solicitar que se quite/i }));
}

beforeEach(() => {
  requestRemovalAction.mockReset();
  requestRemovalAction.mockResolvedValue({ ok: true, data: undefined });
});

afterEach(() => {
  cleanup();
});

describe('RequestRemovalForm', () => {
  it('renders only the quiet disclosure trigger when closed', () => {
    render(<RequestRemovalForm locationId="zona_test" />);
    const trigger = screen.getByRole('button', { name: /solicitar que se quite/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByLabelText(/motivo/i)).not.toBeInTheDocument();
  });

  it('reveals the reason, detail and contact fields when opened', () => {
    render(<RequestRemovalForm locationId="zona_test" />);
    openForm();
    const trigger = screen.getByRole('button', { name: /solicitar que se quite/i });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByLabelText(/motivo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/detalle/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contacto/i)).toBeInTheDocument();
  });

  it('submits the locationId and reason and shows a success confirmation', async () => {
    render(<RequestRemovalForm locationId="zona_test" />);
    openForm();
    fireEvent.click(screen.getByRole('button', { name: /enviar solicitud/i }));

    await waitFor(() =>
      expect(requestRemovalAction).toHaveBeenCalledWith(
        expect.objectContaining({ locationId: 'zona_test', motivo: 'resuelto' }),
      ),
    );
    expect(await screen.findByRole('status')).toHaveTextContent(/gracias|revisar/i);
  });

  it('shows the error message when the action fails', async () => {
    requestRemovalAction.mockResolvedValueOnce({
      ok: false,
      error: 'Estás enviando solicitudes muy rápido. Espera un momento e intenta de nuevo.',
    });
    render(<RequestRemovalForm locationId="zona_test" />);
    openForm();
    fireEvent.click(screen.getByRole('button', { name: /enviar solicitud/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/muy r[aá]pido/i);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('closes the form without submitting when cancelled', () => {
    render(<RequestRemovalForm locationId="zona_test" />);
    openForm();
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(screen.queryByLabelText(/motivo/i)).not.toBeInTheDocument();
    expect(requestRemovalAction).not.toHaveBeenCalled();
  });
});
