import {
  Camera,
  FileCheck,
  Flag,
  Globe,
  MapPin,
  Phone,
  ShieldCheck,
  TriangleAlert,
  UserX,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/page-header';
import { toneClasses, type Tone } from '@/lib/status';
import { cn, telHref } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Privacidad y uso de datos',
  description:
    'Cómo trata Apoyo Venezuela la información que compartes: sin cuentas, sin rastreo personal y con reglas claras sobre qué es público.',
};

function SectionHeading({
  id,
  icon: Icon,
  title,
  subtitle,
  tone = 'brand',
}: {
  id: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  title: string;
  subtitle?: string;
  tone?: Tone;
}) {
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
        <h2 id={id} className="text-xl font-semibold text-ink">
          {title}
        </h2>
        {subtitle && <p className="mt-0.5 text-sm text-ink-soft">{subtitle}</p>}
      </div>
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-border bg-surface p-4 md:p-5', className)}>
      <div className="space-y-3 text-sm leading-relaxed text-ink-soft">{children}</div>
    </div>
  );
}

export default function PrivacidadPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-12 py-6">
      <PageHeader
        icon={ShieldCheck}
        eyebrow="Privacidad"
        title="Privacidad y uso de datos"
        description="Cómo trata Apoyo Venezuela la información que compartes. Sin cuentas, sin rastreo personal y con reglas claras sobre qué es público."
      >
        <p className="text-xs text-ink-faint">Última actualización: 2 de julio de 2026.</p>
      </PageHeader>

      <section aria-labelledby="cuenta-heading">
        <SectionHeading
          id="cuenta-heading"
          icon={UserX}
          title="Sin cuenta y sin rastreo"
          subtitle="No hay inicio de sesión ni perfiles de usuario"
          tone="brand"
        />
        <Card>
          <p>
            Apoyo Venezuela no tiene inicio de sesión ni cuentas de usuario. No pedimos tu nombre,
            tu correo ni tu teléfono para usar la aplicación, y no creamos perfiles de las personas
            que la visitan.
          </p>
          <p>
            Para saber cuántas personas usan el sitio empleamos{' '}
            <span className="font-medium text-ink">analítica sin cookies</span> (Cloudflare Web
            Analytics): no rastrea a personas individuales, no usa cookies de publicidad y no vende
            datos a terceros.
          </p>
        </Card>
      </section>

      <section aria-labelledby="publico-heading">
        <SectionHeading
          id="publico-heading"
          icon={Globe}
          title="Los reportes son públicos"
          subtitle="Lo que publicas es visible para cualquier persona"
          tone="warning"
        />
        <Card>
          <p>
            Todo lo que incluyes en un reporte (la ubicación, el estado estructural, las
            necesidades, la descripción y las fotos) es{' '}
            <span className="font-medium text-ink">público</span>. Cualquier persona puede verlo en
            el sitio y también a través de nuestra API de datos abierta.
          </p>
          <p>No publiques información que no quieras que sea visible para cualquier persona.</p>
        </Card>
      </section>

      <section aria-labelledby="contacto-heading">
        <SectionHeading
          id="contacto-heading"
          icon={Phone}
          title="Datos de contacto"
          subtitle="Opcionales, y visibles en la página del reporte"
          tone="warning"
        />
        <Card>
          <p>
            Los campos de nombre y teléfono de contacto son opcionales. Si los completas, se
            muestran en la página pública del reporte para que quienes pueden ayudar se comuniquen
            directamente. Por eso quedan visibles para cualquier persona.
          </p>
          <p>
            Antes de enviarlos, el formulario te pide confirmar que entiendes que serán públicos.
            Incluye datos de otra persona solo si tienes su permiso.
          </p>
        </Card>
      </section>

      <section aria-labelledby="ubicacion-heading">
        <SectionHeading
          id="ubicacion-heading"
          icon={MapPin}
          title="Ubicación en el mapa"
          subtitle="Marcar un punto exacto es opcional"
          tone="brand"
        />
        <Card>
          <p>
            Marcar un punto exacto en el mapa es opcional. Si no lo marcas, la zona se muestra solo
            con la ubicación en texto que escribas (estado, ciudad y sector). Si marcas un punto,
            el reporte aparece en el mapa del sitio en ese lugar.
          </p>
          <p>
            En nuestra <span className="font-medium text-ink">API pública de datos</span>, las
            coordenadas se redondean a unos 110 metros (3 decimales), para que la información
            abierta no exponga una dirección exacta.
          </p>
        </Card>
      </section>

      <section aria-labelledby="fotos-heading">
        <SectionHeading
          id="fotos-heading"
          icon={Camera}
          title="Fotos"
          subtitle="Quitamos los metadatos antes de publicarlas"
          tone="brand"
        />
        <Card>
          <p>
            Antes de subir una foto, la aplicación elimina los{' '}
            <span className="font-medium text-ink">metadatos</span> del archivo, por ejemplo la
            ubicación GPS que las cámaras de los teléfonos suelen incrustar en formato EXIF. Así,
            una foto publicada no revela el lugar exacto donde fue tomada.
          </p>
        </Card>
      </section>

      <section aria-labelledby="correcciones-heading">
        <SectionHeading
          id="correcciones-heading"
          icon={FileCheck}
          title="Correcciones con fuente"
          subtitle="Información neutral y verificable"
          tone="success"
        />
        <Card>
          <p>
            Apoyo Venezuela es una iniciativa ciudadana{' '}
            <span className="font-medium text-ink">sin afiliación política</span>. Las correcciones
            a los datos deben ir acompañadas de una fuente verificable, para mantener la información
            confiable y neutral.
          </p>
        </Card>
      </section>

      <section aria-labelledby="retiro-heading">
        <SectionHeading
          id="retiro-heading"
          icon={Flag}
          title="Cómo pedir que se quite un reporte"
          subtitle="Revisado por un moderador, sin borrado público"
          tone="neutral"
        />
        <Card>
          <p>
            Si un reporte ya no aplica o contiene información que no debería estar publicada, abre
            la página del reporte y usa la opción{' '}
            <span className="font-medium text-ink">
              «¿Este reporte ya no aplica? Solicitar que se quite»
            </span>
            . Un moderador revisa cada solicitud.
          </p>
          <p>
            Los reportes no se eliminan de forma automática y no existe un botón de borrado público,
            para que nadie pueda quitar el reporte de otra persona.
          </p>
        </Card>
      </section>

      <section aria-label="No es un servicio oficial de emergencia">
        <Card className="border-warning/25 bg-warning/10">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warning/15 text-warning">
              <TriangleAlert className="h-4 w-4" aria-hidden />
            </span>
            <div className="space-y-2">
              <p>
                Apoyo Venezuela es una herramienta comunitaria,{' '}
                <span className="font-medium text-ink">no un servicio oficial de emergencia</span>.
                La información la aporta la comunidad y puede estar incompleta o sin verificar:
                confírmala antes de actuar.
              </p>
              <p>
                Ante una emergencia que ponga en riesgo la vida, consulta los{' '}
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
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
