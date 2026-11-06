"use client";

import { ExternalLink, MailX } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getEmail } from "@/lib/api";
import { formatDateTime, safeHttpUrl } from "@/lib/format";
import { getPhaseConfig } from "@/lib/phases";
import { OUTCOME_LABEL, type Contact, type Outcome, type SentEmail } from "@/lib/types";

export function EmailPanel({
  contact,
  onClose,
  onOutcome,
}: {
  contact: Contact | null;
  onClose: () => void;
  onOutcome: (outcome: Outcome | null) => Promise<void>;
}) {
  const [email, setEmail] = useState<SentEmail | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [outcomeError, setOutcomeError] = useState<string | null>(null);
  const contactId = contact?.id ?? null;
  const [requestId, setRequestId] = useState<string | null>(contactId);

  if (contactId !== requestId) {
    setRequestId(contactId);
    setStatus(contactId ? "loading" : "idle");
    setEmail(null);
    setError(null);
    setOutcomeError(null);
  }

  useEffect(() => {
    if (!contactId) return;
    let cancelled = false;
    getEmail(contactId)
      .then((result) => {
        if (cancelled) return;
        setEmail(result);
        setStatus("ready");
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setStatus("error");
        setError(reason instanceof Error ? reason.message : "No se pudo leer el correo.");
      });
    return () => {
      cancelled = true;
    };
  }, [contactId]);

  async function choose(outcome: Outcome | null) {
    setSaving(true);
    setOutcomeError(null);
    try {
      await onOutcome(outcome);
    } catch (reason) {
      setOutcomeError(reason instanceof Error ? reason.message : "No se pudo actualizar el cierre.");
    } finally {
      setSaving(false);
    }
  }

  const zohoUrl = safeHttpUrl(email?.sent_email_url ?? null);
  const sentLabel = formatDateTime(email?.sent_at ?? null);
  const phase = contact ? getPhaseConfig(contact.phase) : null;

  return (
    <Dialog
      open={Boolean(contact)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        {contact ? (
          <>
            <DialogHeader>
              <DialogTitle>{contact.name}</DialogTitle>
              <DialogDescription>
                {[contact.clinic, contact.company, contact.email].filter(Boolean).join(" · ")}
              </DialogDescription>
            </DialogHeader>

            {phase ? (
              <p className="mb-4 text-sm">
                <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ backgroundColor: phase.color }} />
                {phase.label}
                {contact.outcome ? ` · ${OUTCOME_LABEL[contact.outcome]}` : ""}
              </p>
            ) : null}

            {status === "loading" ? <p className="text-sm text-stone-500">Cargando el correo…</p> : null}
            {status === "error" ? (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">
                {error}
              </p>
            ) : null}
            {status === "ready" && !email ? (
              <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-8 text-center">
                <MailX className="mx-auto h-6 w-6 text-stone-400" aria-hidden />
                <p className="mt-2 font-semibold text-ink">Sin correo enviado</p>
                <p className="mt-1 text-sm text-stone-500">Este contacto todavía no tiene un correo guardado.</p>
              </div>
            ) : null}
            {status === "ready" && email ? (
              <div className="space-y-4">
                <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                  {email.from_address ? (
                    <div>
                      <dt className="text-xs font-semibold tracking-wide text-stone-500 uppercase">De</dt>
                      <dd className="break-all">{email.from_address}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="text-xs font-semibold tracking-wide text-stone-500 uppercase">Formato</dt>
                    <dd>{email.email_format_name ?? "Sin formato"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold tracking-wide text-stone-500 uppercase">Fecha de contacto</dt>
                    <dd>{sentLabel ?? "Sin fecha"}</dd>
                  </div>
                  {contact.next_followup_at ? (
                    <div>
                      <dt className="text-xs font-semibold tracking-wide text-stone-500 uppercase">Follow-up</dt>
                      <dd>{formatDateTime(contact.next_followup_at)}</dd>
                    </div>
                  ) : null}
                </dl>
                <div>
                  <h3 className="font-display text-xl leading-snug text-ink">{email.subject}</h3>
                  <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap text-stone-800">{email.body}</p>
                </div>
              </div>
            ) : null}

            <DialogFooter>
              {zohoUrl ? (
                <Button asChild>
                  <a href={zohoUrl} target="_blank" rel="noopener noreferrer">
                    Abrir en Zoho
                    <ExternalLink className="h-4 w-4" aria-hidden />
                  </a>
                </Button>
              ) : null}
              {contact.outcome === "descartado" ? (
                <Button variant="outline" disabled={saving} onClick={() => void choose(null)}>
                  Quitar descarte
                </Button>
              ) : (
                <Button variant="outline" disabled={saving} onClick={() => void choose("descartado")}>
                  Marcar como descartado
                </Button>
              )}
            </DialogFooter>
            {contact.outcome === "rebotado" ? (
              <p className="mt-3 text-sm text-rose-800">Rebotado viene de la columna Esito. Esa columna es de solo lectura.</p>
            ) : null}
            {outcomeError ? (
              <p className="mt-3 text-sm text-rose-700" role="alert">
                {outcomeError}
              </p>
            ) : null}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
