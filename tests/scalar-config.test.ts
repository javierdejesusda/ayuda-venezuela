import { describe, expect, it } from 'vitest';

import { scalarDocsConfig } from '@/lib/api/scalar-config';

describe('scalarDocsConfig', () => {
  it('points at the public OpenAPI document', () => {
    expect(scalarDocsConfig('light').url).toBe('/api/v1/openapi.json');
  });

  it('forces dark mode when the site theme is dark', () => {
    expect(scalarDocsConfig('dark').forceDarkModeState).toBe('dark');
  });

  it('forces light mode when the site theme is light', () => {
    expect(scalarDocsConfig('light').forceDarkModeState).toBe('light');
  });

  it('hides the built-in toggle so the docs cannot desync from the site', () => {
    expect(scalarDocsConfig('dark').hideDarkModeToggle).toBe(true);
    expect(scalarDocsConfig('light').hideDarkModeToggle).toBe(true);
  });
});
