import { Trash2 } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/format";
import { OUTCOME_LABEL, type Contact } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ContactCard({
  contact,
  color,
  onDelete,
  overlay = false,
  landing = false,
  landTick = 0,
}: {
  contact: Contact;
  color: string;
  onDelete?: () => void;
  overlay?: boolean;
  landing?: boolean;
  landTick?: number;
}) {
  const sent = formatDate(contact.sent_at);
  const followup = formatDateTime(contact.next_followup_at);

  return (
    <article
      key={landing ? landTick : "rest"}
      className={cn(
        "relative overflow-hidden rounded-xl border border-black/5 bg-white px-3 py-2.5 pr-10 shadow-sm",
        !overlay && "casino-card",
        landing && "chip-land",
        overlay && "rotate-2 shadow-2xl",
      )}
      style={{ borderLeftWidth: 4, borderLeftColor: color }}
    >
      {onDelete ? (
        <button
          type="button"
          data-no-drag
          draggable={false}
          className="absolute top-2 right-2 rounded-md p-1 text-stone-400 hover:bg-rose-50 hover:text-rose-700 focus-visible:ring-2 focus-visible:ring-rose-700 focus-visible:outline-none"
          aria-label={`Eliminar a ${contact.name}`}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ) : null}

      <h3 className="text-[15px] leading-snug font-semibold text-ink">{contact.name}</h3>
      {contact.clinic ? <p className="mt-0.5 text-sm font-medium text-stone-800">{contact.clinic}</p> : null}
      {contact.company ? <p className="text-xs text-stone-500">{contact.company}</p> : null}
      <p className="mt-1 truncate text-xs text-stone-600">{contact.email}</p>
      {contact.subject ? (
        <p className="mt-1.5 line-clamp-2 text-sm text-stone-700">
          <span className="font-semibold text-stone-500">Asunto: </span>
          {contact.subject}
        </p>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-700">
          {contact.email_format_name ?? "Sin formato"}
        </span>
        {contact.outcome ? (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-bold tracking-wide uppercase",
              contact.outcome === "descartado" ? "bg-stone-800 text-white" : "bg-rose-700 text-white",
            )}
          >
            {OUTCOME_LABEL[contact.outcome]}
          </span>
        ) : null}
      </div>

      <p className="mt-2 text-xs text-stone-500">{sent ? `Fecha de contacto: ${sent}` : "Sin fecha de contacto"}</p>
      {followup ? (
        <p className="mt-1.5 rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-950">
          Seguimiento programado: {followup}
        </p>
      ) : null}
    </article>
  );
}
