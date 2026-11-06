import { isUsingMockData } from "@/lib/config";

export function ExampleBanner() {
  if (!isUsingMockData()) return null;

  return (
    <div className="border-b border-amber-300 bg-amber-200 px-4 py-2 text-sm text-amber-950" role="status">
      <span className="mr-2 inline-flex rounded bg-amber-950 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-amber-100 uppercase">
        Ejemplo
      </span>
      <strong>Datos de ejemplo.</strong> El backend no está conectado. Clínicas, correos y cifras son ficticios y vuelven al estado inicial al recargar.
    </div>
  );
}
