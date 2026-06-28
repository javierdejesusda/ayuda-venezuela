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

  it('opens every endpoint section so nothing stays collapsed behind a click', () => {
    expect(scalarDocsConfig('light').defaultOpenAllTags).toBe(true);
  });

  it('expands schema properties and responses so there is no "show more" to chase', () => {
    const config = scalarDocsConfig('light');
    expect(config.expandAllSchemaProperties).toBe(true);
    expect(config.expandAllResponses).toBe(true);
  });

  it('lists required properties first so the important fields read top-down', () => {
    expect(scalarDocsConfig('light').orderRequiredPropertiesFirst).toBe(true);
  });

  it('drops the built-in download link because the toolbar already offers downloads', () => {
    expect(scalarDocsConfig('light').documentDownloadType).toBe('none');
  });

  it('removes the developer-tools chrome that does not belong on a public read-only API', () => {
    expect(scalarDocsConfig('light').showDeveloperTools).toBe('never');
  });
});
