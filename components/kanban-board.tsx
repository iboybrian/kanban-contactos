"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CoinRain } from "@/components/coin-rain";
import { ContactCard } from "@/components/contact-card";
import { DeleteContactDialog } from "@/components/delete-contact-dialog";
import { EmailPanel } from "@/components/email-panel";
import { KanbanColumn } from "@/components/kanban-column";
import { ApiError, SheetConflictError, clearDiscard, deleteContact, getContacts, updateContactPhase } from "@/lib/api";
import { clearGoogleSession } from "@/lib/google-session";
import { playChip, playJackpot, playRemove } from "@/lib/casino-audio";
import { BoardPointerSensor, BoardTouchSensor } from "@/lib/dnd-sensors";
import { columnsFor, getPhaseConfig } from "@/lib/phases";
import type { Contact, Outcome } from "@/lib/types";

const JACKPOT_PHASES = new Set(["respondio", "demo_agendada"]);

const collisionDetection: CollisionDetection = (args) => {
  const pointer = pointerWithin(args);
  return pointer.length > 0 ? pointer : rectIntersection(args);
};

function phaseFromOver(over: DragEndEvent["over"], contacts: Contact[]): string | null {
  if (!over) return null;
  const data = over.data.current as { phase?: string } | undefined;
  if (typeof data?.phase === "string") return data.phase;
  const id = String(over.id);
  return contacts.find((contact) => contact.id === id)?.phase ?? null;
}

export function KanbanBoard() {
  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [hideClosed, setHideClosed] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hoverPhase, setHoverPhase] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [landed, setLanded] = useState<{ id: string; phase: string; tick: number } | null>(null);
  const [rain, setRain] = useState<{ phase: string; tick: number } | null>(null);
  const ignoreClick = useRef(false);
  const landTimer = useRef<number | null>(null);
  const rainTimer = useRef<number | null>(null);
  const dismissRain = useCallback(() => setRain(null), []);

  useEffect(() => {
    return () => {
      if (landTimer.current) window.clearTimeout(landTimer.current);
      if (rainTimer.current) window.clearTimeout(rainTimer.current);
    };
  }, []);

  const sensors = useSensors(
    useSensor(BoardPointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(BoardTouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );

  useEffect(() => {
    let cancelled = false;
    getContacts()
      .then((data) => {
        if (cancelled) return;
        setContacts(data);
        setStatus("ready");
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        if (reason instanceof ApiError && reason.status === 401) clearGoogleSession();
        setStatus("error");
        setLoadError(reason instanceof Error ? reason.message : "No se pudieron cargar los contactos.");
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const closedCount = contacts?.filter((contact) => contact.outcome !== null).length ?? 0;
  const visible = useMemo(() => {
    if (!contacts) return [];
    if (!hideClosed) return contacts;
    return contacts.filter((contact) => contact.outcome === null);
  }, [contacts, hideClosed]);

  const columns = useMemo(() => columnsFor(visible.map((contact) => contact.phase)), [visible]);
  const openContact = contacts?.find((contact) => contact.id === openId) ?? null;
  const activeContact = contacts?.find((contact) => contact.id === activeId) ?? null;

  function openContactCard(contact: Contact) {
    if (ignoreClick.current) return;
    setOpenId(contact.id);
  }

  function releaseClick() {
    window.setTimeout(() => {
      ignoreClick.current = false;
    }, 0);
  }

  function onDragStart(event: DragStartEvent) {
    ignoreClick.current = true;
    setActiveId(String(event.active.id));
    setActionError(null);
  }

  function onDragOver(event: DragOverEvent) {
    setHoverPhase(phaseFromOver(event.over, contacts ?? []));
  }

  function onDragCancel() {
    setActiveId(null);
    setHoverPhase(null);
    releaseClick();
  }

  async function onDragEnd(event: DragEndEvent) {
    const nextPhase = phaseFromOver(event.over, contacts ?? []);
    const id = String(event.active.id);
    setActiveId(null);
    setHoverPhase(null);
    releaseClick();
    if (!nextPhase) return;
    await moveContact(id, nextPhase);
  }

  async function moveContact(id: string, phase: string) {
    if (!contacts) return;
    const current = contacts.find((contact) => contact.id === id);
    if (!current || current.phase === phase) return;
    const snapshot = contacts;
    const label = getPhaseConfig(phase).label;
    const tick = Date.now();
    setContacts([{ ...current, phase }, ...snapshot.filter((contact) => contact.id !== id)]);
    setLanded({ id, phase, tick });
    if (landTimer.current) window.clearTimeout(landTimer.current);
    landTimer.current = window.setTimeout(() => setLanded(null), 720);
    if (JACKPOT_PHASES.has(phase)) {
      playJackpot();
      setRain({ phase, tick });
      if (rainTimer.current) window.clearTimeout(rainTimer.current);
      rainTimer.current = window.setTimeout(() => setRain(null), 3000);
      setAnnouncement(`Jackpot. ${current.name} está en ${label}.`);
    } else {
      playChip();
      setAnnouncement(`${current.name} está en ${label}.`);
    }
    try {
      const updated = await updateContactPhase(current, phase);
      setContacts((list) => list?.map((contact) => (contact.id === id ? updated : contact)) ?? list);
    } catch (reason) {
      setContacts(snapshot);
      if (reason instanceof ApiError && reason.status === 401) clearGoogleSession();
      if (reason instanceof SheetConflictError) setReloadKey((value) => value + 1);
      setActionError(reason instanceof Error ? reason.message : "No se pudo cambiar la fase.");
      setAnnouncement(`No se pudo mover a ${current.name}.`);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete || !contacts) return;
    const target = pendingDelete;
    const snapshot = contacts;
    playRemove();
    setDeleting(true);
    setContacts(contacts.map((contact) => (contact.id === target.id ? { ...contact, outcome: "descartado" } : contact)));
    setPendingDelete(null);
    try {
      const updated = await deleteContact(target);
      setContacts((list) => list?.map((contact) => (contact.id === target.id ? updated : contact)) ?? list);
      setAnnouncement(`${updated.name} quedó con Stato Descartado. La fila sigue en la hoja.`);
    } catch (reason) {
      setContacts(snapshot);
      if (reason instanceof ApiError && reason.status === 401) clearGoogleSession();
      if (reason instanceof SheetConflictError) setReloadKey((value) => value + 1);
      setActionError(reason instanceof Error ? reason.message : "No se pudo marcar el descarte.");
    } finally {
      setDeleting(false);
    }
  }

  async function changeOutcome(id: string, outcome: Outcome | null) {
    if (!contacts) return;
    if (outcome === "rebotado") throw new Error("Esito es de solo lectura.");
    const current = contacts.find((contact) => contact.id === id);
    if (!current) return;
    const snapshot = contacts;
    setContacts(contacts.map((contact) => (contact.id === id ? { ...contact, outcome } : contact)));
    try {
      const updated = outcome === "descartado" ? await deleteContact(current) : await clearDiscard(current);
      setContacts((list) => list?.map((contact) => (contact.id === id ? updated : contact)) ?? list);
      setAnnouncement(
        outcome === "descartado"
          ? `${updated.name} quedó con Stato Descartado. La fila sigue en la hoja.`
          : `${updated.name} volvió al pipeline activo.`,
      );
    } catch (reason) {
      setContacts(snapshot);
      if (reason instanceof ApiError && reason.status === 401) clearGoogleSession();
      if (reason instanceof SheetConflictError) setReloadKey((value) => value + 1);
      throw reason;
    }
  }

  return (
    <div className="min-w-0">
      <div className="px-4 pt-5 pb-3">
        <h1 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">Pipeline de clínicas</h1>
        <p className="mt-1 max-w-2xl text-sm text-stone-600 sm:text-base">
          Arrastra una tarjeta para cambiar su fase. En el celular, mantén la tarjeta un momento y luego muévela. Un toque abre el correo.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <button
            type="button"
            role="switch"
            aria-checked={hideClosed}
            onClick={() => setHideClosed((value) => !value)}
            className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white px-3 py-1.5 text-sm font-semibold text-ink"
          >
            <span className={`flex h-5 w-9 rounded-full p-0.5 ${hideClosed ? "bg-pine" : "bg-stone-300"}`} aria-hidden>
              <span className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${hideClosed ? "translate-x-4" : "translate-x-0"}`} />
            </span>
            Ocultar descartados/rebotados
          </button>
          {contacts ? (
            <p className="text-sm text-stone-600">
              {hideClosed
                ? `Ocultando ${closedCount} descartados o rebotados.`
                : `${closedCount} descartados o rebotados visibles en su fase.`}
            </p>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-stone-500 md:hidden">Desliza hacia el lado para ver las siete fases.</p>
        {actionError ? (
          <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">
            {actionError}
          </p>
        ) : null}
      </div>

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      {status === "loading" ? <BoardSkeleton /> : null}
      {status === "error" ? (
        <div className="px-4 py-10">
          <p className="font-semibold text-ink">No se pudieron cargar los contactos.</p>
          <p className="mt-1 text-sm text-stone-600">{loadError}</p>
          <button
            type="button"
            className="mt-4 rounded-lg bg-pine px-4 py-2 text-sm font-semibold text-paper"
            onClick={() => {
              setStatus("loading");
              setLoadError(null);
              setReloadKey((value) => value + 1);
            }}
          >
            Reintentar
          </button>
        </div>
      ) : null}

      {status === "ready" && contacts ? (
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragCancel={onDragCancel}
          onDragEnd={(event) => void onDragEnd(event)}
        >
          <div className="min-w-0 overflow-x-auto overscroll-x-contain">
            <div className="flex w-max snap-x snap-mandatory gap-3 px-4 pb-8 md:snap-none">
              {columns.map((phase) => {
                const cards = visible.filter((contact) => contact.phase === phase.id);
                const hiddenHere =
                  hideClosed && (contacts.filter((contact) => contact.phase === phase.id && contact.outcome).length ?? 0) > 0;
                return (
                  <KanbanColumn
                    key={phase.id}
                    phase={phase}
                    contacts={cards}
                    active={hoverPhase === phase.id}
                    hiddenNote={cards.length === 0 && hiddenHere ? "Ocultos por el filtro" : null}
                    landedId={landed?.id ?? null}
                    landTick={landed?.tick ?? 0}
                    jackpot={Boolean(landed && landed.phase === phase.id && JACKPOT_PHASES.has(phase.id))}
                    onOpen={openContactCard}
                    onDelete={setPendingDelete}
                    onMove={(id, phase) => void moveContact(id, phase)}
                  />
                );
              })}
            </div>
          </div>
          <DragOverlay>
            {activeContact ? (
              <div className="w-[min(84vw,19.5rem)]">
                <ContactCard contact={activeContact} color={getPhaseConfig(activeContact.phase).color} overlay />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : null}

      {rain ? (
        <CoinRain
          key={rain.tick}
          title={getPhaseConfig(rain.phase).label}
          onDone={dismissRain}
        />
      ) : null}

      <EmailPanel
        contact={openContact}
        onClose={() => setOpenId(null)}
        onOutcome={(outcome) => (openContact ? changeOutcome(openContact.id, outcome) : Promise.resolve())}
      />
      <DeleteContactDialog
        contact={pendingDelete}
        pending={deleting}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden px-4 pb-8" aria-hidden>
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="h-80 w-[min(84vw,19.5rem)] shrink-0 animate-pulse rounded-2xl bg-stone-200/80" />
      ))}
    </div>
  );
}
