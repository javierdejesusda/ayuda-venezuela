'use client';

import { useState } from 'react';

import type { StateContacts } from '@/lib/data/types';
import { groupContactsByCategory } from '@/lib/data/contacts';
import { contactCategoryMeta } from '@/lib/status';
import { Label, Select } from '@/components/ui/form';
import { ContactCard } from '@/components/contact-card';

interface ContactsExplorerProps {
  states: StateContacts[];
}

const ALL_VALUE = '__todos__';

export function ContactsExplorer({ states }: ContactsExplorerProps) {
  const [selected, setSelected] = useState<string>(states[0]?.state ?? ALL_VALUE);

  const activeStates: StateContacts[] =
    selected === ALL_VALUE
      ? states
      : states.filter((s) => s.state === selected);

  return (
    <section aria-label="Directorio por estado">
      {/* State picker */}
      <div className="mb-5">
        <Label htmlFor="estado-select" className="mb-1.5">
          Estado
        </Label>
        <Select
          id="estado-select"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value={ALL_VALUE}>Todos los estados</option>
          {states.map((s) => (
            <option key={s.state} value={s.state}>
              {s.state}
            </option>
          ))}
        </Select>
      </div>

      {/* State sections */}
      <div className="space-y-8">
        {activeStates.map((stateData) => {
          const groups = groupContactsByCategory(stateData.contacts);

          return (
            <div key={stateData.state}>
              {/* State heading */}
              <div className="mb-4 flex flex-wrap items-baseline gap-2">
                <h2 className="text-lg font-semibold text-ink">{stateData.state}</h2>
                {stateData.areaCode && (
                  <span className="text-sm text-ink-faint">
                    Código de área: {stateData.areaCode}
                  </span>
                )}
              </div>

              {stateData.contacts.length === 0 ? (
                <p className="text-sm text-ink-faint">
                  No hay contactos registrados para este estado.
                </p>
              ) : (
                /* Category groups */
                <div className="space-y-6">
                  {groups.map((group) => {
                    const meta = contactCategoryMeta[group.category];
                    const CategoryIcon = meta.icon;
                    const headingId = `cat-${stateData.state}-${group.category}`;

                    return (
                      <div key={`${stateData.state}-${group.category}`}>
                        {/* Category subheading */}
                        <div className="mb-3 flex items-center gap-2 border-b border-border pb-2">
                          <CategoryIcon
                            className="h-4 w-4 shrink-0 text-ink-faint"
                            aria-hidden
                          />
                          <h3
                            id={headingId}
                            className="eyebrow text-ink-soft"
                          >
                            {meta.label}
                          </h3>
                          <span className="tabular-nums text-xs text-ink-faint">
                            {group.contacts.length}
                          </span>
                        </div>

                        {/* Contact cards grid */}
                        <ul
                          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
                          role="list"
                          aria-labelledby={headingId}
                        >
                          {group.contacts.map((contact, idx) => (
                            <li
                              key={`${stateData.state}-${group.category}-${contact.organization}-${idx}`}
                            >
                              <ContactCard contact={contact} />
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
