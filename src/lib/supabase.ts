const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && key);

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("p2p_supabase_token");
}

function headers(extra: HeadersInit = {}) {
  if (!url || !key)
    throw new Error(
      "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local.",
    );
  const token = getToken();
  return {
    apikey: key,
    Authorization: `Bearer ${token || key}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

export async function supabaseRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!url) throw new Error("Supabase URL is missing.");
  const response = await fetch(`${url}${path}`, { ...init, headers: headers(init.headers) });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    // Token expired or invalid — clear and redirect to login
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("p2p_supabase_token");
      if (typeof window !== "undefined" && !window.location.pathname.includes("/auth")) {
        window.location.href = "/auth";
      }
    }
    throw new Error(error.message || error.msg || `Supabase request failed (${response.status}).`);
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
