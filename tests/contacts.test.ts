import { describe, expect, it } from 'vitest';

import { groupContactsByCategory } from '@/lib/data/contacts';
import type { EmergencyContact } from '@/lib/data/types';

const contact = (over: Partial<EmergencyContact>): EmergencyContact => ({
  organization: 'Org',
  category: 'hotline',
  phones: ['911'],
  verified: true,
  ...over,
});

describe('groupContactsByCategory', () => {
  it('returns an empty array for no contacts', () => {
    expect(groupContactsByCategory([])).toEqual([]);
  });

  it('groups contacts by category and drops empty categories', () => {
    const groups = groupContactsByCategory([
      contact({ organization: 'A', category: 'hospital' }),
      contact({ organization: 'B', category: 'bomberos' }),
      contact({ organization: 'C', category: 'hospital' }),
    ]);
    expect(groups.map((g) => g.category)).toEqual(['bomberos', 'hospital']);
    expect(groups.find((g) => g.category === 'hospital')?.contacts.map((c) => c.organization)).toEqual([
      'A',
      'C',
    ]);
  });

  it('orders groups by the canonical CONTACT_CATEGORIES order', () => {
    const groups = groupContactsByCategory([
      contact({ category: 'otro' }),
      contact({ category: 'apoyo_psicologico' }),
      contact({ category: 'hotline' }),
    ]);
    expect(groups.map((g) => g.category)).toEqual(['hotline', 'apoyo_psicologico', 'otro']);
  });

  it('preserves the original order of contacts within a category', () => {
    const first = contact({ organization: 'first', category: 'rescate' });
    const second = contact({ organization: 'second', category: 'rescate' });
    const groups = groupContactsByCategory([first, second]);
    expect(groups[0].contacts).toEqual([first, second]);
  });
});
