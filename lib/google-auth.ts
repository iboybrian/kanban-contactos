"use client";

import { GOOGLE_OAUTH_SCOPES, assertAllowedAccount, googleClientId } from "@/lib/config";
import { clearGoogleSession, getGoogleSession, setGoogleSession } from "@/lib/google-session";

type TokenResponse = {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

type TokenClient = {
  requestAccessToken: (override?: { prompt?: string }) => void;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: TokenResponse) => void;
            error_callback?: (error: { type?: string; message?: string }) => void;
          }) => TokenClient;
          revoke: (token: string, done?: () => void) => void;
        };
      };
    };
  }
}

let gisPromise: Promise<void> | null = null;

function loadGis(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Google Identity Services solo corre en el navegador"));
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  gisPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar Google Identity Services"));
    document.head.appendChild(script);
  });
  return gisPromise;
}

async function emailForToken(accessToken: string): Promise<string> {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("No pude leer la cuenta de Google de esta sesión");
  const profile = (await response.json()) as { email?: string };
  const email = profile.email?.trim().toLowerCase() ?? "";
  if (!email) throw new Error("Google no entregó el correo de la cuenta");
  return email;
}

export async function signInWithGoogle(): Promise<void> {
  const clientId = googleClientId();
  if (!clientId) throw new Error("Falta NEXT_PUBLIC_GOOGLE_CLIENT_ID");
  await loadGis();
  const oauth = window.google?.accounts.oauth2;
  if (!oauth) throw new Error("Google Identity Services no quedó listo");

  const token = await new Promise<TokenResponse>((resolve, reject) => {
    const client = oauth.initTokenClient({
      client_id: clientId,
      scope: GOOGLE_OAUTH_SCOPES,
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error_description || response.error || "Google no entregó un token"));
          return;
        }
        resolve(response);
      },
      error_callback: (error) => reject(new Error(error.message || error.type || "Se canceló el acceso de Google")),
    });
    client.requestAccessToken({ prompt: "select_account" });
  });

  const email = await emailForToken(token.access_token!);
  try {
    assertAllowedAccount(email);
  } catch (error) {
    oauth.revoke(token.access_token!);
    throw error;
  }
  setGoogleSession(token.access_token!, token.expires_in ?? 3600, email);
}

export function signOutGoogle(): Promise<void> {
  const current = getGoogleSession();
  clearGoogleSession();
  const revoke = window.google?.accounts.oauth2.revoke;
  if (!current || !revoke) return Promise.resolve();
  return new Promise((resolve) => revoke(current.accessToken, () => resolve()));
}
