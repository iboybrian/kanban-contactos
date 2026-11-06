"use client";

import { useDroppable, useDraggable } from "@dnd-kit/core";
import { useState, type DragEvent as ReactDragEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { ContactCard } from "@/components/contact-card";
import type { PhaseConfig } from "@/lib/phases";
import type { Contact } from "@/lib/types";
import { cn } from "@/lib/utils";

let dragJustEnded = false;

function ignoreClickUntilAfterDrag() {
  dragJustEnded = true;
}

export function KanbanColumn({
  phase,
  contacts,
  active,
  hiddenNote,
  landedId,
  landTick,
  jackpot,
  onOpen,
  onDelete,
  onMove,
}: {
  phase: PhaseConfig;
  contacts: Contact[];
  active: boolean;
  hiddenNote: string | null;
  landedId: string | null;
  landTick: number;
  jackpot: boolean;
  onOpen: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
  onMove: (id: string, phase: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: phase.id,
    data: { type: "column", phase: phase.id },
  });
  const [nativeOver, setNativeOver] = useState(false);
  const highlighted = active || isOver || nativeOver;

  function allowNativeDrop(event: ReactDragEvent<HTMLElement>) {
    if (![...event.dataTransfer.types].includes("text/plain")) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setNativeOver(true);
  }

  return (
    <section
      ref={setNodeRef}
      className="flex w-[min(84vw,19.5rem)] shrink-0 snap-start flex-col md:w-80"
      data-phase={phase.id}
      aria-labelledby={`phase-${phase.id}`}
      onDragEnter={allowNativeDrop}
      onDragOver={allowNativeDrop}
      onDragLeave={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
        setNativeOver(false);
      }}
      onDrop={(event) => {
        const id = event.dataTransfer.getData("text/plain");
        setNativeOver(false);
        if (!id) return;
        event.preventDefault();
        onMove(id, phase.id);
      }}
    >
      <header
        className={cn("rounded-t-2xl px-3 py-2.5 text-white", jackpot && "jackpot-column")}
        style={{ backgroundColor: phase.color }}
        title={phase.description}
      >
        <div className="flex items-start justify-between gap-2">
          <h2 id={`phase-${phase.id}`} className="text-sm leading-tight font-semibold">
            {phase.label}
          </h2>
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold tabular-nums">{contacts.length}</span>
        </div>
      </header>
      <div
        className={cn(
          "flex min-h-56 flex-1 flex-col gap-2 rounded-b-2xl p-2 transition-shadow",
          highlighted && "ring-2 ring-ink/70 ring-inset",
        )}
        style={{ backgroundColor: phase.wash }}
      >
        {contacts.map((contact) => (
          <DraggableCard
            key={contact.id}
            contact={contact}
            color={phase.color}
            landing={landedId === contact.id}
            landTick={landTick}
            onOpen={onOpen}
            onDelete={onDelete}
          />
        ))}
        {contacts.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-stone-500">{hiddenNote ?? "Sin contactos"}</p>
        ) : null}
      </div>
    </section>
  );
}

function DraggableCard({
  contact,
  color,
  landing,
  landTick,
  onOpen,
  onDelete,
}: {
  contact: Contact;
  color: string;
  landing: boolean;
  landTick: number;
  onOpen: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: contact.id,
    data: { type: "card", phase: contact.phase },
  });
  const { onKeyDown, ...restListeners } = listeners ?? {};
  const handleKeyDown = onKeyDown as ((event: ReactKeyboardEvent<HTMLDivElement>) => void) | undefined;

  return (
    <div
      ref={setNodeRef}
      className={cn("cursor-grab touch-manipulation select-none active:cursor-grabbing", isDragging && "opacity-35")}
      {...restListeners}
      {...attributes}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", contact.id);
        event.dataTransfer.effectAllowed = "move";
        event.stopPropagation();
        ignoreClickUntilAfterDrag();
      }}
      onDragEnd={() => {
        window.setTimeout(() => {
          dragJustEnded = false;
        }, 0);
      }}
      role="article"
      aria-label={`${contact.name}. Arrastrar para cambiar de fase.`}
      onKeyDown={(event) => {
        handleKeyDown?.(event);
        if (event.key === "Enter" && event.target === event.currentTarget) {
          event.preventDefault();
          onOpen(contact);
        }
      }}
      onClick={(event) => {
        if (dragJustEnded) return;
        if ((event.target as HTMLElement).closest("[data-no-drag]")) return;
        onOpen(contact);
      }}
    >
      <ContactCard
        contact={contact}
        color={color}
        landing={landing}
        landTick={landTick}
        onDelete={() => onDelete(contact)}
      />
    </div>
  );
}
