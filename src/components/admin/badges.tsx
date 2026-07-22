export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    confirmed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    completed: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20",
    rejected: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
    suspended: "bg-muted text-muted-foreground border-border",
    approved: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    verified: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    paid: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    partial: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    unpaid: "bg-muted text-muted-foreground border-border",
    overdue: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
    published: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    draft: "bg-muted text-muted-foreground border-border",
  };
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize ${map[status] ?? "bg-muted text-muted-foreground border-border"}`}>{status}</span>;
}