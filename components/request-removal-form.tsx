'use client';

import React, { useState, useTransition } from 'react';

import { CheckCircle2, Send } from 'lucide-react';

import { requestRemovalAction } from '@/app/actions';
import { REMOVAL_REASONS, REMOVAL_REASON_LABELS } from '@/lib/data/types';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/form';

interface RequestRemovalFormProps {
  locationId: string;
}

interface FormValues {
  motivo: string;
  detalle: string;
  contacto: string;
}

interface FieldErrors {
  motivo?: string;
  detalle?: string;
  contacto?: string;
}

const INITIAL_VALUES: FormValues = {
  motivo: REMOVAL_REASONS[0],
  detalle: '',
  contacto: '',
};

export function RequestRemovalForm({ locationId }: RequestRemovalFormProps): React.JSX.Element {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ): void {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function resetForm(): void {
    setValues(INITIAL_VALUES);
    setFieldErrors({});
    setSubmitError(null);
  }

  function handleClose(): void {
    setOpen(false);
    resetForm();
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await requestRemovalAction({
        locationId,
        motivo: values.motivo,
        detalle: values.detalle.trim() || undefined,
        contacto: values.contacto.trim() || undefined,
      });

      if (result.ok) {
        // success early-returns the confirmation banner, replacing the form.
        setSuccess(true);
      } else {
        setSubmitError(result.error);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors as FieldErrors);
        }
      }
    });
  }

  if (success) {
    return (
      <section aria-label="Solicitud de retiro" className="pt-1">
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-xl border border-success/25 bg-success/10 px-4 py-3 text-sm text-tone-success-text"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p className="text-pretty">
            Gracias. Un moderador revisará esta solicitud. El reporte no se elimina
            automáticamente.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Solicitar que se quite el reporte" className="pt-1">
      <button
        type="button"
        onClick={() => (open ? handleClose() : setOpen(true))}
        aria-expanded={open}
        aria-controls={open ? 'rr-panel' : undefined}
        className="inline-flex min-h-[44px] items-center rounded-lg px-1 py-1 text-sm text-ink-faint underline-offset-4 transition-colors duration-150 hover:text-ink-soft hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
      >
        ¿Este reporte ya no aplica? Solicitar que se quite
      </button>

      {open && (
        <form
          id="rr-panel"
          onSubmit={handleSubmit}
          noValidate
          className="mt-3 space-y-4 rounded-xl border border-border bg-surface-2 p-4"
        >
          <p className="text-sm leading-relaxed text-ink-soft">
            Envía una solicitud privada para que un moderador la revise. Esto no elimina el
            reporte; solo nos avisa que podría sobrar.
          </p>

          <Field label="Motivo" htmlFor="rr-motivo" required error={fieldErrors.motivo}>
            <Select
              id="rr-motivo"
              name="motivo"
              value={values.motivo}
              onChange={handleChange}
              aria-invalid={fieldErrors.motivo ? true : undefined}
              aria-describedby={fieldErrors.motivo ? 'rr-motivo-error' : undefined}
              disabled={isPending}
            >
              {REMOVAL_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {REMOVAL_REASON_LABELS[reason]}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Detalle (opcional)"
            htmlFor="rr-detalle"
            hint="Cuéntanos brevemente por qué, si quieres."
            error={fieldErrors.detalle}
          >
            <Textarea
              id="rr-detalle"
              name="detalle"
              value={values.detalle}
              onChange={handleChange}
              placeholder="Ej. El edificio ya fue evacuado y la familia está a salvo."
              rows={3}
              maxLength={400}
              aria-invalid={fieldErrors.detalle ? true : undefined}
              aria-describedby={fieldErrors.detalle ? 'rr-detalle-error' : undefined}
              disabled={isPending}
            />
          </Field>

          <Field
            label="Contacto (opcional)"
            htmlFor="rr-contacto"
            hint="No se publica. Solo por si necesitamos confirmar contigo."
            error={fieldErrors.contacto}
          >
            <Input
              id="rr-contacto"
              name="contacto"
              type="text"
              value={values.contacto}
              onChange={handleChange}
              placeholder="Teléfono o correo"
              maxLength={120}
              aria-invalid={fieldErrors.contacto ? true : undefined}
              aria-describedby={fieldErrors.contacto ? 'rr-contacto-error' : undefined}
              disabled={isPending}
            />
          </Field>

          {submitError && (
            <div
              role="alert"
              className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-tone-danger-text"
            >
              {submitError}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" variant="outline" size="md" disabled={isPending}>
              <Send className="h-4 w-4" aria-hidden />
              {isPending ? 'Enviando...' : 'Enviar solicitud'}
            </Button>
            <Button type="button" variant="ghost" size="md" onClick={handleClose} disabled={isPending}>
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
