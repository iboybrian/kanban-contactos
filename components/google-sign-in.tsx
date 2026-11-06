"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { isUsingMockData } from "@/lib/config";
import { signInWithGoogle } from "@/lib/google-auth";
import { googleSessionEmail, subscribeGoogleSession } from "@/lib/google-session";

function useSignedInEmail() {
  return useSyncExternalStore(subscribeGoogleSession, googleSessionEmail, () => "");
}

export function GoogleSignInGate({ children }: { children: ReactNode }) {
  const email = useSignedInEmail();
  if (isUsingMockData() || email) return children;
  return <SignInScreen />;
}

function SignInScreen() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function enter() {
    setPending(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo entrar con Google.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mx-auto max-w-lg px-4 py-16">
      <h1 className="font-display text-4xl text-ink">Entrar con Google</h1>
      <p className="mt-3 text-sm leading-relaxed text-stone-600">
        El acceso usa la cuenta de Google autorizada. El token queda solo en la memoria de esta pestaña: al recargar hay que entrar de nuevo. No hay clave compartida ni secreto en el sitio.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-stone-600">
        Google pedirá permiso para ver y editar las hojas de cálculo de esa cuenta. La app, por su código, solo lee Master2 y escribe la celda Stato.
      </p>
      {error ? (
        <p className="mt-4 text-sm text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
      <Button className="mt-6" disabled={pending} onClick={() => void enter()}>
        {pending ? "Esperando a Google…" : "Entrar con Google"}
      </Button>
    </section>
  );
}
