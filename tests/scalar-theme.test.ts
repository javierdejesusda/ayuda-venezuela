import { describe, expect, it } from 'vitest';

import { SCALAR_BRAND_CSS } from '@/lib/api/scalar-theme';

describe('SCALAR_BRAND_CSS', () => {
  it('still maps Scalar onto the site design tokens', () => {
    expect(SCALAR_BRAND_CSS).toContain('var(--color-brand-600)');
    expect(SCALAR_BRAND_CSS).toContain('var(--surface)');
  });

  it('hides the editor/deploy toolbar chrome (Developer Tools / Configure / Share / Deploy)', () => {
    expect(SCALAR_BRAND_CSS).toMatch(/\.api-reference-toolbar[\s\S]*?display:\s*none/);
  });

  it('hides the sidebar "Ask AI" button that sits next to search', () => {
    expect(SCALAR_BRAND_CSS).toContain('[role="search"] ~ *');
  });

  it('offsets the sticky sidebar below the site header instead of under it', () => {
    expect(SCALAR_BRAND_CSS).toContain('--refs-header-height');
  });
});
