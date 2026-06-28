import type { Theme } from '@/lib/theme';

/** Public OpenAPI document the reference renders. */
const OPENAPI_URL = '/api/v1/openapi.json';

/**
 * Scalar API reference configuration bound to the site theme. `forceDarkModeState`
 * pins the docs to the active theme and `hideDarkModeToggle` removes Scalar's own
 * switch, so the reference can never drift from the rest of the site.
 */
export function scalarDocsConfig(theme: Theme) {
  return {
    url: OPENAPI_URL,
    forceDarkModeState: (theme === 'dark' ? 'dark' : 'light') as 'dark' | 'light',
    hideDarkModeToggle: true,
  };
}
