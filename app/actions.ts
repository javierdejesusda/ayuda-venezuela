'use server';

import { createHash } from 'node:crypto';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import type { z } from 'zod';

import { DuplicateFundraiserError } from '@/lib/data/fundraiser-url';
import {
  createFundraiserSchema,
  createLocationSchema,
  createNeedSchema,
  requestRemovalSchema,
  updateLocationStatusSchema,
  updateNeedStatusSchema,
} from '@/lib/data/schemas';
import { getStore } from '@/lib/data/store';

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/**
 * Shared rate-limit gate for anonymous writes. Hashes the caller IP with a
 * server-side salt (no raw IP is ever stored) and checks the sliding-window
 * quota. Requires BOTH a non-empty IP and a non-empty THROTTLE_SALT; either
 * missing skips the gate (fail-open) so no unsalted hash is persisted and
 * legitimate emergency submissions are never blocked on misconfiguration or a
 * throttle-layer outage.
 */
async function withinWriteQuota(): Promise<boolean> {
  try {
    const h = await headers();
    const fwd = h.get('x-forwarded-for') ?? '';
    const ip = fwd.split(',')[0]?.trim() ?? '';
    const salt = process.env.THROTTLE_SALT;
    if (ip && salt) {
      const keyHash = createHash('sha256').update(salt + ip).digest('hex');
      return await getStore().checkReportQuota(keyHash);
    }
    return true;
  } catch {
    return true;
  }
}

export async function createLocationAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createLocationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Revisa los datos del formulario.',
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  if (!(await withinWriteQuota())) {
    return {
      ok: false,
      error: 'Estás enviando reportes muy rápido. Espera un momento e intenta de nuevo.',
    };
  }

  try {
    const location = await getStore().createLocation(parsed.data);
    revalidatePath('/');
    return { ok: true, data: { id: location.id } };
  } catch {
    return { ok: false, error: 'No se pudo guardar la zona. Intenta de nuevo.' };
  }
}

export async function createFundraiserAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createFundraiserSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Revisa los datos del formulario.',
      fieldErrors: fieldErrors(parsed.error),
    };
  }
  try {
    const fundraiser = await getStore().createFundraiser(parsed.data);
    revalidatePath('/recaudaciones');
    return { ok: true, data: { id: fundraiser.id } };
  } catch (err) {
    if (err instanceof DuplicateFundraiserError) {
      return {
        ok: false,
        error: 'Revisa los datos del formulario.',
        fieldErrors: { url: 'Esta recaudacion ya esta publicada.' },
      };
    }
    return { ok: false, error: 'No se pudo guardar la recaudacion. Intenta de nuevo.' };
  }
}

export async function createNeedAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createNeedSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Revisa los datos.',
      fieldErrors: fieldErrors(parsed.error),
    };
  }
  try {
    const need = await getStore().createNeed(parsed.data);
    revalidatePath('/');
    revalidatePath(`/zona/${parsed.data.locationId}`);
    return { ok: true, data: { id: need.id } };
  } catch {
    return { ok: false, error: 'No se pudo agregar la necesidad.' };
  }
}

export async function updateNeedStatusAction(input: {
  id: string;
  status: string;
  locationId?: string;
}): Promise<ActionResult> {
  const parsed = updateNeedStatusSchema.safeParse({
    id: input?.id,
    status: input?.status,
  });
  if (!parsed.success) return { ok: false, error: 'Datos invalidos.' };
  try {
    const updated = await getStore().updateNeedStatus(parsed.data.id, parsed.data.status);
    if (!updated) return { ok: false, error: 'No se encontro la necesidad.' };
    revalidatePath('/');
    if (input.locationId) revalidatePath(`/zona/${input.locationId}`);
    return { ok: true, data: undefined };
  } catch {
    return { ok: false, error: 'No se pudo actualizar.' };
  }
}

export async function requestRemovalAction(
  input: unknown,
): Promise<ActionResult> {
  const parsed = requestRemovalSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Revisa los datos del formulario.',
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  if (!(await withinWriteQuota())) {
    return {
      ok: false,
      error: 'Estás enviando solicitudes muy rápido. Espera un momento e intenta de nuevo.',
    };
  }

  try {
    // No revalidatePath: the queue is private, nothing visible changes.
    await getStore().createRemovalRequest(parsed.data);
    return { ok: true, data: undefined };
  } catch {
    return { ok: false, error: 'No se pudo enviar la solicitud. Intenta de nuevo.' };
  }
}

export async function updateLocationStatusAction(input: {
  id: string;
  status: string;
}): Promise<ActionResult> {
  const parsed = updateLocationStatusSchema.safeParse({
    id: input?.id,
    status: input?.status,
  });
  if (!parsed.success) return { ok: false, error: 'Datos invalidos.' };
  try {
    const updated = await getStore().updateLocationStatus(
      parsed.data.id,
      parsed.data.status,
    );
    if (!updated) return { ok: false, error: 'No se encontro la zona.' };
    revalidatePath('/');
    revalidatePath(`/zona/${parsed.data.id}`);
    return { ok: true, data: undefined };
  } catch {
    return { ok: false, error: 'No se pudo actualizar.' };
  }
}
