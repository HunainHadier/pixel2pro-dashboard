import { useEffect, useState } from "react";
import { clearSupabaseToken, isSupabaseConfigured, signInWithPassword } from "@/lib/supabase";

const KEY = "p2p_admin_session";

export interface AdminSession {
  id: string;
  name: string;
  email: string;
  role: "admin" | "super_admin";
  avatar: string;
}

export function getSession(): AdminSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AdminSession) : null;
  } catch {
    return null;
  }
}

export function setSession(s: AdminSession) {
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new Event("p2p_auth"));
}

export function clearSession() {
  localStorage.removeItem(KEY);
  clearSupabaseToken();
  window.dispatchEvent(new Event("p2p_auth"));
}

export function useSession() {
  const [session, setLocal] = useState<AdminSession | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setLocal(getSession());
    setReady(true);
    const onChange = () => setLocal(getSession());
    window.addEventListener("p2p_auth", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("p2p_auth", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  return { session, ready };
}

export async function login(email: string, password: string): Promise<AdminSession> {
  if (!email || !password) throw new Error("Enter your email and password.");
  const localEnabled = import.meta.env.VITE_ENABLE_LOCAL_LOGIN === "true";
  const localEmail = import.meta.env.VITE_LOCAL_ADMIN_EMAIL as string | undefined;
  const localPassword = import.meta.env.VITE_LOCAL_ADMIN_PASSWORD as string | undefined;
  let session: AdminSession;
  if (localEnabled && email === localEmail && password === localPassword) {
    session = {
      id: "local-admin",
      name: "Local Admin",
      email,
      role: "super_admin",
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}&backgroundColor=111827`,
    };
  } else {
    if (!isSupabaseConfigured) throw new Error("Supabase configuration is missing.");
    const user = await signInWithPassword(email, password);
    session = {
      id: user.id,
      name: user.user_metadata?.full_name || "Admin",
      email: user.email || email,
      role: "super_admin",
      avatar:
        user.user_metadata?.avatar_url ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}&backgroundColor=111827`,
    };
  }
  setSession(session);
  return session;
}
