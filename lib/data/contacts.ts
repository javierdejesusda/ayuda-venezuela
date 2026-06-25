/**
 * Pure helpers for the per-state emergency contact directory. No I/O, no React.
 */
import {
  CONTACT_CATEGORIES,
  type ContactCategory,
  type EmergencyContact,
} from './types';

export interface ContactGroup {
  category: ContactCategory;
  contacts: EmergencyContact[];
}

/**
 * Groups contacts by category in the canonical CONTACT_CATEGORIES order,
 * preserving each contact's original order within its group and dropping
 * categories that have no contacts.
 */
export function groupContactsByCategory(
  contacts: EmergencyContact[],
): ContactGroup[] {
  return CONTACT_CATEGORIES.map((category) => ({
    category,
    contacts: contacts.filter((contact) => contact.category === category),
  })).filter((group) => group.contacts.length > 0);
}
