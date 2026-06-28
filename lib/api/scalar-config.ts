import { SCALAR_BRAND_CSS } from '@/lib/api/scalar-theme';
import type { Theme } from '@/lib/theme';

/** Public OpenAPI document the reference renders. */
const OPENAPI_URL = '/api/v1/openapi.json';

/**
 * Scalar API reference configuration bound to the site theme. `forceDarkModeState`
 * pins the docs to the active theme and `hideDarkModeToggle` removes Scalar's own
 * switch, so the reference can never drift from the rest of the site. `customCss`
 * maps Scalar's palette onto the site design tokens so the reference reads as a
 * branded part of this site in both light and dark.
 */
export function scalarDocsConfig(theme: Theme) {
  return {
    url: OPENAPI_URL,
    forceDarkModeState: (theme === 'dark' ? 'dark' : 'light') as 'dark' | 'light',
    hideDarkModeToggle: true,
    customCss: SCALAR_BRAND_CSS,
  };
}
