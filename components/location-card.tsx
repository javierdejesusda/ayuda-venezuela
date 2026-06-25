import Link from 'next/link';

import { ChevronRight, MapPin } from 'lucide-react';

import { CategoryChip, StatusBadge } from '@/components/status-badges';
import { ZonePhoto } from '@/components/zone-photo';
import { MAX_FOTOS, type LocationWithNeeds } from '@/lib/data/types';

/** Summary card linking to a single emergency zone. */
export function LocationCard({ location }: { location: LocationWithNeeds }) {
  const { summary } = location;
  const openNeeds = location.needs.filter((need) => need.status !== 'cubierto');
  const categories = Array.from(new Set(openNeeds.map((need) => need.categoria))).slice(0, 3);
  const place = [location.zona, location.ciudad, location.estado].filter(Boolean).join(', ');
  const fotos = (location.fotos ?? []).slice(0, MAX_FOTOS);

  return (
    <Link
      href={`/zona/${location.id}`}
      className="group block min-w-0 rounded-2xl border border-border bg-surface p-4 shadow-card transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lift focus-visible:border-brand-400 active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-ink">{location.nombre}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-ink-soft">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-faint" aria-hidden />
            <span className="truncate">{place}</span>
          </p>
        </div>
        <StatusBadge status={location.status} size="sm" />
      </div>

      {location.descripcion && (
        <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{location.descripcion}</p>
      )}

      {categories.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {categories.map((categoria) => (
            <CategoryChip key={categoria} categoria={categoria} size="sm" />
          ))}
          {openNeeds.length > categories.length && (
            <span className="text-xs text-ink-soft">+{openNeeds.length - categories.length} más</span>
          )}
        </div>
      )}

      {fotos.length > 0 && (
        // Decorative previews: the images carry alt="" so they don't pad the
        // card link's accessible name with "Foto 1 Foto 2 ..."; the list's
        // aria-label keeps the photo count available to screen readers.
        <ul className="mt-3 flex gap-1.5" aria-label={`${fotos.length} foto${fotos.length === 1 ? '' : 's'}`}>
          {fotos.map((foto, index) => (
            <li key={`${foto}-${index}`} className="w-16 shrink-0">
              <ZonePhoto src={foto} alt="" size={160} />
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs text-ink-soft">
        <span>
          <span className="tabular font-medium text-ink-soft">{summary.total}</span> necesidades
          {summary.urgentes > 0 && (
            <span className="text-danger"> · {summary.urgentes} urgentes</span>
          )}
        </span>
        <span className="inline-flex items-center gap-1 text-brand-600 transition-all group-hover:gap-1.5">
          Ver zona <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
