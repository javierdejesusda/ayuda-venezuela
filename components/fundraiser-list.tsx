'use client';

import { useState } from 'react';

import { Inbox } from 'lucide-react';

import { EmptyState } from '@/components/empty-state';
import { FundraiserCard } from '@/components/fundraiser-card';
import { PAGE_SIZE } from '@/lib/data/store';
import type { Fundraiser } from '@/lib/data/types';

/** Paginated grid of fundraiser cards with an inline "Ver más" load-more. */
export function FundraiserList({ fundraisers }: { fundraisers: Fundraiser[] }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  if (fundraisers.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="Aún no hay recaudaciones"
        description="Sé la primera persona en compartir una campaña de GoFundMe para ayudar a las víctimas del terremoto."
      />
    );
  }

  const visible = fundraisers.slice(0, visibleCount);
  const remaining = fundraisers.length - visibleCount;

  return (
    <div aria-live="polite">
      <ul role="list" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((fundraiser) => (
          <li key={fundraiser.id}>
            <FundraiserCard fundraiser={fundraiser} />
          </li>
        ))}
      </ul>
      {remaining > 0 && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
            className="rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink active:scale-[0.96] active:transition-transform"
          >
            {`Ver más (${remaining} restantes)`}
          </button>
        </div>
      )}
    </div>
  );
}
