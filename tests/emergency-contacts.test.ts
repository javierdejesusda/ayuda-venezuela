import { describe, expect, it } from 'vitest';

import { stateContacts } from '@/lib/data/emergency-contacts';
import { CONTACT_CATEGORIES, type ContactCategory } from '@/lib/data/types';

describe('stateContacts data integrity', () => {
  it('every contact has a valid category and well-formed fields', () => {
    for (const state of stateContacts) {
      expect(state.state.length).toBeGreaterThan(0);
      for (const contact of state.contacts) {
        expect(CONTACT_CATEGORIES).toContain(contact.category);
        expect(contact.organization.trim().length).toBeGreaterThan(0);
        expect(Array.isArray(contact.phones)).toBe(true);
        for (const phone of contact.phones) {
          expect(phone.trim().length).toBeGreaterThan(0);
        }
        expect(typeof contact.verified).toBe('boolean');
      }
    }
  });

  it('does not repeat the same phone twice inside one contact', () => {
    for (const state of stateContacts) {
      for (const contact of state.contacts) {
        expect(new Set(contact.phones).size).toBe(contact.phones.length);
      }
    }
  });

  it('Distrito Capital carries the expanded Caracas directory across categories', () => {
    const dc = stateContacts.find((s) => s.state === 'Distrito Capital');
    expect(dc).toBeDefined();
    const categories = new Set<ContactCategory>(dc!.contacts.map((c) => c.category));
    const expected: ContactCategory[] = [
      'hospital',
      'medico',
      'policia',
      'rescate',
      'bomberos',
      'apoyo_psicologico',
    ];
    for (const category of expected) {
      expect(categories.has(category)).toBe(true);
    }
    expect(dc!.contacts.length).toBeGreaterThan(50);
  });
});
