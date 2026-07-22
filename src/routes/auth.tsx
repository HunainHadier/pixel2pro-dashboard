import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { getSession, login } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Pixel2Pro Admin" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "forgot">("login");

  useEffect(() => {
    if (getSession()) navigate({ to: "/dashboard", replace: true });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "forgot") {
        await new Promise((r) => setTimeout(r, 700));
        toast.success("OTP sent — check your inbox to reset your password.");
        setMode("login");
      } else {
        await login(email, password);
        toast.success("Welcome back, Admin");
        navigate({ to: "/dashboard", replace: true });
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.15), transparent 40%), radial-gradient(circle at 80% 60%, rgba(255,255,255,0.08), transparent 45%)",
          }}
        />
        <div className="relative flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-white text-primary font-black">
            P2
          </div>
          <div>
            <div className="font-black tracking-tight text-lg">PIXEL2PRO</div>
            <div className="text-[10px] uppercase tracking-[0.25em] opacity-70">
              Pixel Today, Pro Tomorrow
            </div>
          </div>
        </div>

        <div className="relative space-y-6">
          <h2 className="text-4xl font-black leading-tight tracking-tight">
            The admin cockpit for a<br />
            world-class bootcamp.
          </h2>
          <p className="max-w-md text-primary-foreground/70">
            Manage admissions, verify payments, moderate reviews, and ship courses — from a single,
            focused control plane.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-6">
            {[
              { k: "3,800+", v: "Alumni" },
              { k: "24+", v: "Partners" },
              { k: "100%", v: "Verified" },
            ].map((s) => (
              <div
                key={s.k}
                className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur"
              >
                <div className="text-2xl font-black">{s.k}</div>
                <div className="text-xs uppercase tracking-wider text-primary-foreground/60">
                  {s.v}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-2 text-xs text-primary-foreground/60">
          <ShieldCheck className="h-4 w-4" />
          Session-secured, role-based, audit-logged.
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center bg-background p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground font-black">
              P2
            </div>
            <div className="font-black tracking-tight">PIXEL2PRO ADMIN</div>
          </div>

          <h1 className="text-3xl font-black tracking-tight">
            {mode === "login" ? "Welcome back" : "Reset password"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "login"
              ? "Sign in to the Pixel2Pro admin portal."
              : "Enter your email and we'll send you an OTP to reset your password."}
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@pixel2pro.com"
                  className="pl-9 h-11"
                />
              </div>
            </div>

            {mode === "login" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={show ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-10 h-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === "login" && (
              <label className="flex select-none items-center gap-2 text-sm text-muted-foreground">
                <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} /> Remember
                me for 30 days
              </label>
            )}

            <Button
              type="submit"
              className="h-11 w-full rounded-full text-sm font-semibold"
              disabled={loading}
            >
              {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Send reset OTP"}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>

            {mode === "forgot" && (
              <button
                type="button"
                onClick={() => setMode("login")}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
              >
                ← Back to sign in
              </button>
            )}
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Sign in with your Supabase admin account. Local login is only enabled for local
            development.
          </p>
        </div>
      </div>
    </div>
  );
}
