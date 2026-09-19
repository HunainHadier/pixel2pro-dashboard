import { Plus, Trash2 } from "lucide-react";
import type { FeeInstallment, FeeSettings } from "@/lib/mock-data";
import { formatPKR } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function FeePlansEditor({
  value,
  monthlyFee,
  admissionFee,
  months,
  persistAvailable,
  onChange,
}: {
  value: FeeSettings;
  monthlyFee: number;
  admissionFee: number;
  months: number;
  persistAvailable?: boolean;
  onChange: (s: FeeSettings) => void;
}) {
  const monthlyTotal = monthlyFee * months + admissionFee;
  const lumpSavings = monthlyTotal - (Number(value.lumpSumTotal) || 0);
  const installmentTotal = value.installments.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const installmentSavings = monthlyTotal - installmentTotal;

  const set = (patch: Partial<FeeSettings>) => onChange({ ...value, ...patch });
  const setInstallment = (index: number, patch: Partial<FeeInstallment>) =>
    set({
      installments: value.installments.map((inst, i) =>
        i === index ? { ...inst, ...patch } : inst,
      ),
    });
  const addInstallment = () =>
    set({ installments: [...value.installments, { label: "", amount: 0 }] });
  const removeInstallment = (index: number) =>
    set({ installments: value.installments.filter((_, i) => i !== index) });

  return (
    <div className="space-y-4 rounded-xl border border-border p-4">
      <div>
        <Label className="text-base">Fee &amp; Payment Options</Label>
        <p className="mt-1 text-xs text-muted-foreground">
          Totals auto-calculate. Monthly plan follows the monthly + admission fees; lump-sum and
          installments are editable below.
        </p>
      </div>

      <div className="rounded-lg bg-muted p-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-medium text-muted-foreground">Monthly plan total</span>
          <span className="font-bold text-foreground">
            {formatPKR(monthlyFee)} × {months} + {formatPKR(admissionFee)} reg ={" "}
            {formatPKR(monthlyTotal)}
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-border p-3">
        <Label>One-Time Payment (Lump Sum)</Label>
        <div className="mt-2">
          <Input
            type="number"
            min={0}
            value={value.lumpSumTotal || ""}
            placeholder="0 = not offered"
            onChange={(e) => set({ lumpSumTotal: Number(e.target.value) || 0 })}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Registration</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">Free</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Auto savings vs monthly</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            {Number(value.lumpSumTotal) > 0 ? `${formatPKR(Math.max(0, lumpSavings))} off` : "—"}
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-border p-3">
        <div className="flex items-center justify-between">
          <Label>Installments</Label>
          <Switch
            checked={value.installmentEnabled}
            onCheckedChange={(v) => set({ installmentEnabled: v })}
          />
        </div>
        {value.installmentEnabled && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Registration (included in installments)
              </span>
              <Input
                type="number"
                min={0}
                className="h-8 w-28"
                value={value.installmentRegistration || ""}
                placeholder="0"
                onChange={(e) => set({ installmentRegistration: Number(e.target.value) || 0 })}
              />
            </div>
            {value.installments.map((inst, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-bold text-muted-foreground">
                  {index + 1}
                </span>
                <Input
                  className="h-8 flex-1"
                  placeholder={index === 0 ? "Before course starts" : "Start of 2nd month"}
                  value={inst.label}
                  onChange={(e) => setInstallment(index, { label: e.target.value })}
                />
                <Input
                  type="number"
                  min={0}
                  className="h-8 w-28"
                  value={inst.amount || ""}
                  placeholder="Amount"
                  onChange={(e) => setInstallment(index, { amount: Number(e.target.value) || 0 })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                  onClick={() => removeInstallment(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addInstallment}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Add installment
            </Button>
          </div>
        )}
        {value.installmentEnabled && value.installments.length > 0 && (
          <>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Installment total</span>
              <span className="font-bold text-foreground">{formatPKR(installmentTotal)}</span>
            </div>
            {value.installmentRegistration > 0 && (
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                Registration of {formatPKR(value.installmentRegistration)} is already inside the
                installments above.
              </div>
            )}
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Auto savings vs monthly</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {formatPKR(Math.max(0, installmentSavings))} off
              </span>
            </div>
          </>
        )}
      </div>

      {persistAvailable === false && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Storage disabled: run <span className="font-mono">supabase/migration-fee-plans.sql</span>{" "}
          in Supabase once to enable saving these plans.
        </p>
      )}
    </div>
  );
}
