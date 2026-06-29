import { describe, expect, it } from 'vitest';

import { createMemoryStore } from '@/lib/data/memory-store';

describe('memory store createRemovalRequest', () => {
  it('queues a request and exposes it via getRemovalRequests', async () => {
    const store = createMemoryStore({ locations: [], needs: [] });
    expect(store.getRemovalRequests()).toEqual([]);

    await store.createRemovalRequest({
      locationId: 'zona_1',
      motivo: 'Ya fue atendido o resuelto',
      contacto: '+58 412 000 0000',
    });

    const queue = store.getRemovalRequests();
    expect(queue).toHaveLength(1);
    expect(queue[0].id).toBeTruthy();
    expect(queue[0].createdAt).toBeTruthy();
    expect(queue[0]).toMatchObject({
      locationId: 'zona_1',
      motivo: 'Ya fue atendido o resuelto',
      contacto: '+58 412 000 0000',
    });
  });

  it('keeps contacto undefined when not provided', async () => {
    const store = createMemoryStore({ locations: [], needs: [] });
    await store.createRemovalRequest({
      locationId: 'zona_2',
      motivo: 'Otro motivo',
    });
    expect(store.getRemovalRequests()[0].contacto).toBeUndefined();
  });

  it('returns a copy so callers cannot mutate the internal queue', async () => {
    const store = createMemoryStore({ locations: [], needs: [] });
    await store.createRemovalRequest({ locationId: 'zona_3', motivo: 'Otro motivo' });
    store.getRemovalRequests().pop();
    expect(store.getRemovalRequests()).toHaveLength(1);
  });
});
