'use client';

import dynamic from 'next/dynamic';

import '@scalar/api-reference-react/style.css';

import { useTheme } from '@/components/theme-provider';
import { scalarDocsConfig } from '@/lib/api/scalar-config';

// ssr:false keeps Scalar out of the server render and, crucially, mounts it
// inside React's tree so it unmounts cleanly on client navigation (the old
// CDN-script version leaked its DOM and stayed visible after leaving the page).
const ApiReferenceReact = dynamic(
  () => import('@scalar/api-reference-react').then((mod) => mod.ApiReferenceReact),
  {
    ssr: false,
    loading: () => (
      <p className="px-4 py-16 text-center text-sm text-ink-soft">Cargando documentación...</p>
    ),
  },
);

/**
 * Interactive API reference. Forced to the site theme and remounted on a theme
 * switch (via key) so light/dark always matches the rest of the site.
 */
export function ApiReferenceEmbed() {
  const { theme } = useTheme();

  return (
    // The parent page owns the full-bleed breakout; keep a min height so the
    // loading state and short documents do not collapse the surface.
    <div className="min-h-[calc(100vh-12rem)]">
      <ApiReferenceReact key={theme} configuration={scalarDocsConfig(theme)} />
    </div>
  );
}
