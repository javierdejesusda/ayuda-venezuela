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
 *
 * The `expand*` / `defaultOpenAllTags` flags open every section up front so the
 * reference reads top-to-bottom instead of hiding each endpoint, response, and
 * schema behind a "show more" click. `orderRequiredPropertiesFirst` surfaces the
 * fields that matter first. `documentDownloadType: 'none'` and
 * `showDeveloperTools: 'never'` strip Scalar's own download link and the
 * editor/deploy chrome, neither of which belongs on a public read-only API: the
 * branded header already owns the downloads.
 */
export function scalarDocsConfig(theme: Theme) {
  return {
    url: OPENAPI_URL,
    forceDarkModeState: (theme === 'dark' ? 'dark' : 'light') as 'dark' | 'light',
    hideDarkModeToggle: true,
    customCss: SCALAR_BRAND_CSS,
    defaultOpenAllTags: true,
    expandAllResponses: true,
    expandAllSchemaProperties: true,
    orderRequiredPropertiesFirst: true,
    documentDownloadType: 'none' as const,
    showDeveloperTools: 'never' as const,
  };
}
