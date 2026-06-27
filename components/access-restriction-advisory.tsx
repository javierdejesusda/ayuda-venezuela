import { ShieldAlert } from 'lucide-react';

/**
 * Official government travel restriction for La Guaira state (effective 26 Jun 2026).
 * Copy locked to verified facts only - do not add claims beyond what is stated here.
 */
export function AccessRestrictionAdvisory() {
  return (
    <aside
      aria-label="Restricción de acceso a La Guaira"
      className="rounded-xl border border-danger/30 bg-danger/10 p-4"
    >
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden />
        <div className="min-w-0 space-y-2">
          <p className="font-display text-sm font-semibold text-ink">
            Acceso restringido a La Guaira: se requiere permiso especial
          </p>
          <p className="text-sm text-ink-soft">
            Desde el 26 de junio de 2026, el gobierno venezolano restringió el ingreso al estado
            La Guaira. Para acceder, debes registrarte en el Poliedro de Caracas y obtener el
            código QR habilitado como salvoconducto. Las autoridades exhortan a quienes no tengan
            una función asignada de rescate o asistencia a abstenerse de trasladarse al litoral.
          </p>
          <p className="text-xs text-ink-faint">
            Según anuncio de las autoridades venezolanas (26 jun 2026). Verifica el protocolo
            vigente antes de desplazarte.
          </p>
        </div>
      </div>
    </aside>
  );
}
