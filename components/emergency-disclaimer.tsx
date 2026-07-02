import { TriangleAlert } from 'lucide-react';
import Link from 'next/link';

import { cn, telHref } from '@/lib/utils';

/**
 * Static liability notice: Apoyo Venezuela is a community tool, not an official
 * emergency service, and its information may be unverified. Kept calm rather
 * than alarmist, and never dismissible - this is safety information. Reused in
 * the footer's compact note and placed near flows where people act on reports.
 */
export function EmergencyDisclaimer({ className }: { className?: string }) {
  return (
    <aside
      aria-label="Aviso: no es un servicio oficial de emergencia"
      className={cn(
        'flex items-start gap-2.5 rounded-xl border border-warning/25 bg-warning/10 p-3.5',
        className,
      )}
    >
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
      <p className="text-xs leading-relaxed text-ink-soft">
        Apoyo Venezuela es una herramienta comunitaria,{' '}
        <span className="font-semibold text-ink">no un servicio oficial de emergencia</span>. La
        información la aporta la comunidad y puede ser inexacta o no estar verificada: verifícala
        antes de actuar. Ante una emergencia que ponga en riesgo la vida, consulta los{' '}
        <Link
          href="/telefonos"
          className="font-medium text-brand-600 underline underline-offset-2 hover:text-brand-700"
        >
          números de emergencia
        </Link>{' '}
        o llama al{' '}
        <a
          href={telHref('911')}
          className="font-semibold text-danger underline underline-offset-2"
        >
          911
        </a>
        .
      </p>
    </aside>
  );
}
