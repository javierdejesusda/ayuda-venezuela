import {
  Building2,
  ExternalLink,
  Globe,
  HandCoins,
  HardHat,
  Hospital,
  Megaphone,
  Network,
  Package,
  PawPrint,
  ClipboardList,
  Siren,
  Stethoscope,
  Tent,
  Truck,
  UserSearch,
  Users,
  Utensils,
  type LucideIcon,
} from 'lucide-react';
import type { Metadata } from 'next';

import { PageHeader } from '@/components/page-header';
import {
  CENTRAL_PLATFORM,
  COORDINATION_TEAM,
  INITIATIVE_CATEGORIES,
  INITIATIVE_LEAD,
} from '@/lib/data/red-iniciativas';
import { toneClasses, type Tone } from '@/lib/status';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Red de Iniciativas',
  description:
    'Las iniciativas tecnológicas organizadas para apoyar la respuesta al sismo de junio de 2026 en Venezuela, reunidas por tipo de ayuda.',
};

/**
 * Lucide icon per category slug; kept here so the data layer stays UI-free.
 * Exported so a test can assert every category has a mapped icon (the render
 * falls back to a generic globe, which would otherwise hide a missing entry).
 */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'personas-desaparecidas': UserSearch,
  'danos-estructurales': Building2,
  'apoyo-presencial-rescate': Siren,
  'inspeccion-habitabilidad': HardHat,
  'centros-de-acopio': Package,
  'insumos-por-zona': ClipboardList,
  'donaciones-y-pagos': HandCoins,
  'centros-de-alimentacion': Utensils,
  'refugios-y-alojamiento': Tent,
  'pacientes-en-hospitales': Hospital,
  mascotas: PawPrint,
  'logistica-y-transporte': Truck,
  'apoyo-medico-psicologico': Stethoscope,
};

/** Strip the protocol and any trailing slash for compact link display. */
function stripProtocol(url: string) {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-border bg-surface p-4 md:p-5', className)}>
      {children}
    </div>
  );
}

/** Icon chip, heading and description used to title each page section. */
function SectionHeader({
  icon: Icon,
  title,
  description,
  id,
  tone = 'brand',
  level = 'h3',
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  id?: string;
  tone?: Tone;
  level?: 'h2' | 'h3';
}) {
  const Heading = level;
  return (
    <div className="mb-4 flex items-start gap-3">
      <span
        className={cn(
          'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
          toneClasses(tone).solid,
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div>
        <Heading
          id={id}
          className={cn('font-semibold text-ink', level === 'h2' ? 'text-xl' : 'text-lg')}
        >
          {title}
        </Heading>
        <p className="mt-0.5 text-sm text-ink-soft">{description}</p>
      </div>
    </div>
  );
}

/** A row of accessible, thumb-sized links to external initiatives. */
function InitiativeLinks({ urls }: { urls: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {urls.map((url) => (
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm font-medium text-brand-600 transition-colors hover:border-brand-300 hover:bg-brand-50"
        >
          <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="max-w-[220px] truncate">{stripProtocol(url)}</span>
          <ExternalLink className="h-3 w-3 shrink-0 text-ink-faint" aria-hidden />
        </a>
      ))}
    </div>
  );
}

export default function RedIniciativasPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-12 py-6">
      <PageHeader
        icon={Network}
        eyebrow="Red de Iniciativas"
        title="Red de Iniciativas"
        description="En menos de 48 horas, decenas de iniciativas tecnológicas se organizaron para apoyar la respuesta al sismo de junio de 2026. Las reunimos por tipo de ayuda para que encuentres el canal correcto."
      />

      <section aria-labelledby="plataforma-central-heading">
        <Card className="border-brand-600/25 bg-brand-50/60 dark:bg-brand-600/10">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Network className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 space-y-2">
              <p className="eyebrow text-tone-brand-text">Plataforma central</p>
              <h2 id="plataforma-central-heading" className="text-xl font-semibold text-ink">
                Todas las iniciativas en un solo lugar
              </h2>
              <p className="text-sm text-ink-soft">
                {CENTRAL_PLATFORM.name} reúne y enlaza cada esfuerzo de esta red. Iniciativa
                liderada por <strong className="text-ink">{INITIATIVE_LEAD}</strong>.
              </p>
              <a
                href={CENTRAL_PLATFORM.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
              >
                <Globe className="h-4 w-4 shrink-0" aria-hidden />
                {stripProtocol(CENTRAL_PLATFORM.url)}
                <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
              </a>
            </div>
          </div>
        </Card>
      </section>

      <section aria-labelledby="categorias-heading" className="space-y-8">
        <h2 id="categorias-heading" className="sr-only">
          Iniciativas por tipo de ayuda
        </h2>
        {INITIATIVE_CATEGORIES.map((category) => {
          const Icon = CATEGORY_ICONS[category.slug] ?? Globe;
          return (
            <div key={category.slug} id={category.slug} className="scroll-mt-24">
              <SectionHeader
                icon={Icon}
                title={category.title}
                description={category.description}
              />
              <Card>
                <InitiativeLinks urls={category.urls} />
              </Card>
            </div>
          );
        })}
      </section>

      <section aria-labelledby="equipo-heading">
        <SectionHeader
          icon={Users}
          title="Equipo coordinador"
          description="Las personas que sostienen la infraestructura compartida de la red."
          id="equipo-heading"
          tone="neutral"
          level="h2"
        />
        <Card>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            {COORDINATION_TEAM.map((role) => (
              <div key={role.area} className="flex flex-col">
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                  {role.area}
                </dt>
                <dd className="text-sm text-ink">{role.people.join(', ')}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </section>

      <section aria-label="Nota de cierre">
        <Card className="border-border bg-surface-2">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-900/30">
              <Megaphone className="h-4 w-4" aria-hidden />
            </span>
            <div className="space-y-2 text-sm text-ink-soft leading-relaxed">
              <p>
                Comparte esta red. Cada persona que la recibe puede sumarse al esfuerzo o
                apoyar a quienes más lo necesitan.
              </p>
              <p>
                Verifica la información en cada canal antes de actuar o compartirla. Estos
                enlaces llevan a sitios externos administrados por cada iniciativa.
              </p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
