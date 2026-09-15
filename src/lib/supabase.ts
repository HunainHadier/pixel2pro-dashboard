const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && key);

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("p2p_supabase_token");
}

// Auth header value: prefer the signed session token, otherwise the full publishable
// key (WITH its "sb_publishable_" prefix) — Supabase's gateway recognizes publishable
// keys by that prefix and maps them to the anon role.
function authToken(): string {
  return getToken() || String(key || "");
}

function headers(extra: HeadersInit = {}) {
  if (!url || !key)
    throw new Error(
      "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local.",
    );
  return {
    apikey: key,
    Authorization: `Bearer ${authToken()}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

export async function supabaseRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!url) throw new Error("Supabase URL is missing.");
  const response = await fetch(`${url}${path}`, { ...init, headers: headers(init.headers) });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const msg = error.message || error.msg || `Supabase request failed (${response.status}).`;
    // Only treat as an expired/invalid session when the request actually carried a
    // stored Supabase token AND returned 401. 403 here is usually an RLS / storage
    // policy problem, not an auth problem — bouncing to /auth would wrongly kick out
    // a logged-in admin (local or stored session).
    if (response.status === 401 && typeof window !== "undefined") {
      const hadToken = Boolean(localStorage.getItem("p2p_supabase_token"));
      if (hadToken) {
        localStorage.removeItem("p2p_supabase_token");
        if (window.location.pathname !== "/auth") {
          window.location.href = "/auth";
        }
      }
    }
    throw new Error(msg);
  }

  if (response.status === 204) return undefined as T;

  const data = await response.json() as T;

  // Supabase PATCH with Prefer:return=representation returns [] when RLS blocks the update.
  // Detect this and throw a meaningful error.
  if (
    init.method === "PATCH" &&
    Array.isArray(data) &&
    data.length === 0
  ) {
    throw new Error("Update blocked. The row may not exist or you may not have permission. Check your RLS policies in Supabase Dashboard.");
  }

  return data;
}

export async function signInWithPassword(email: string, password: string) {
  const result = await supabaseRequest<{
    access_token: string;
    user: {
      id: string;
      email?: string;
      user_metadata?: { full_name?: string; avatar_url?: string };
    };
  }>("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem("p2p_supabase_token", result.access_token);
  return result.user;
}

export function clearSupabaseToken() {
  localStorage.removeItem("p2p_supabase_token");
}

export async function uploadToStorage(file: File, path: string, bucket = "payment-slips") {
  if (!isSupabaseConfigured) {
    console.warn("Supabase not configured — skipping slip upload.");
    return null;
  }
  const response = await fetch(`${url}/storage/v1/object/${bucket}/${path}`, {
    method: "POST",
    headers: {
      apikey: String(key),
      Authorization: `Bearer ${authToken()}`,
      "x-upsert": "true",
    },
    body: file,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Storage upload failed (${response.status})`);
  }
  return `${url}/storage/v1/object/public/${bucket}/${path}`;
}
