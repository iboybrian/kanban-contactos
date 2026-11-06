"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Contact } from "@/lib/types";

export function DeleteContactDialog({
  contact,
  pending,
  onClose,
  onConfirm,
}: {
  contact: Contact | null;
  pending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog
      open={Boolean(contact)}
      onOpenChange={(open) => {
        if (!open && !pending) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Marcar a {contact?.name ?? "este contacto"} como descartado?</AlertDialogTitle>
          <AlertDialogDescription>
            Esto no borra la fila de la hoja. Solo escribe Stato = Descartado. La tarjeta sigue en el tablero, con el badge, hasta que ocultes los descartados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction disabled={pending} onClick={onConfirm}>
            {pending ? "Guardando…" : "Marcar descartado"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
