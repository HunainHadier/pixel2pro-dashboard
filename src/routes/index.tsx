import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { getSession } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  useEffect(() => {
    const s = getSession();
    navigate({ to: s ? "/dashboard" : "/auth", replace: true });
  }, [navigate]);
  return (
    <div className="grid min-h-screen place-items-center bg-background">
      <div className="flex items-center gap-3 text-muted-foreground">
        <div className="h-8 w-8 animate-pulse rounded-xl bg-primary" />
        <span className="text-sm">Loading Pixel2Pro Admin…</span>
      </div>
    </div>
  );
}
