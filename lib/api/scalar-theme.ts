/**
 * Brand theme for the Scalar API reference, injected through the config's
 * `customCss`. Scalar declares its default palette on `.light-mode` and
 * `.dark-mode` (specificity 0,1,0) and stamps those classes on the document
 * body plus individual cards, not on `.scalar-app`. We re-declare the variables
 * on the same elements with a doubled-class selector (`.dark-mode.dark-mode`,
 * specificity 0,2,0) so our rules win everywhere Scalar resets them. Every value
 * points at a site token (defined in app/globals.css), and those tokens flip
 * with the `data-theme` attribute on <html>, so a single declaration block
 * serves both forced themes correctly. HTTP method colors (GET, POST) are left
 * at Scalar defaults so the verb badges stay legible.
 */
export const SCALAR_BRAND_CSS = `
.light-mode.light-mode,
.dark-mode.dark-mode {
  --scalar-color-1: var(--ink);
  --scalar-color-2: var(--ink-soft);
  --scalar-color-3: var(--ink-faint);
  --scalar-color-accent: var(--color-brand-600);

  --scalar-background-1: var(--surface);
  --scalar-background-2: var(--surface-2);
  --scalar-background-3: var(--surface-3);
  --scalar-background-accent: color-mix(in srgb, var(--color-brand-600) 12%, transparent);

  --scalar-border-color: var(--border);
  --scalar-link-color: var(--color-brand-600);
  --scalar-link-color-hover: var(--color-brand-700);

  --scalar-font: var(--font-sans);
  --scalar-font-code: ui-monospace, "SFMono-Regular", "SF Mono", Menlo, Consolas, monospace;

  --scalar-radius: 0.5rem;
  --scalar-radius-lg: 0.75rem;
  --scalar-radius-xl: 1rem;

  --scalar-sidebar-background-1: var(--surface);
  --scalar-sidebar-color-1: var(--ink);
  --scalar-sidebar-color-2: var(--ink-soft);
  --scalar-sidebar-border-color: var(--border);
  --scalar-sidebar-item-hover-background: var(--surface-2);
  --scalar-sidebar-item-hover-color: var(--ink);
  --scalar-sidebar-item-active-background: color-mix(in srgb, var(--color-brand-600) 12%, transparent);
  --scalar-sidebar-color-active: var(--color-brand-600);
  --scalar-sidebar-search-background: var(--surface-2);
  --scalar-sidebar-search-border-color: var(--border);
  --scalar-sidebar-search-color: var(--ink-faint);
}

.scalar-app h1,
.scalar-app h2,
.scalar-app h3 {
  font-family: var(--font-display);
  letter-spacing: -0.02em;
}
`;
