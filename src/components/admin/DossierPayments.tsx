import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { format, parseISO, addMonths, startOfMonth, isAfter } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { Check, Plus, Pencil, X, ChevronDown, AlertCircle } from "lucide-react";
import { useConfig } from "@/hooks/use-config";

interface Payment {
  id: string;
  dossier_id: string;
  type: "inscription" | "mensualite";
  month_year: string | null;
  amount: number;
  payment_date: string | null;
  method: string | null;
  note: string | null;
  status: "pending" | "paid";
}

interface Dossier {
  id: string;
  dossier_number: string;
  created_at: string;
}

const PAYMENT_METHODS = [
  { id: "virement", label: "Virement bancaire" },
  { id: "especes",  label: "Espèces" },
  { id: "cheque",   label: "Chèque" },
  { id: "orange",   label: "Orange Money" },
  { id: "autre",    label: "Autre" },
];

const fmt = (n: number) => n.toLocaleString("fr-FR") + " GNF";

const EMPTY_FORM = {
  amount: 0,
  payment_date: new Date().toISOString().split("T")[0],
  method: "especes",
  note: "",
};

interface Props {
  dossier: Dossier;
}

const DossierPayments = ({ dossier }: Props) => {
  const qc = useQueryClient();
  const { config } = useConfig();
  const [editId, setEditId] = useState<string | null>(null);
  const [addMonth, setAddMonth] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  /* ── Fetch payments ── */
  const { data: payments = [] } = useQuery<Payment[]>({
    queryKey: ["payments", dossier.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("dossier_id", dossier.id)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  /* ── Generate months from inscription to now+1 ── */
  const months = (() => {
    const start = startOfMonth(parseISO(dossier.created_at));
    const end = addMonths(startOfMonth(new Date()), 1);
    const list: string[] = [];
    let cur = start;
    while (!isAfter(cur, end)) {
      list.push(format(cur, "yyyy-MM"));
      cur = addMonths(cur, 1);
    }
    return list;
  })();

  /* ── Helpers ── */
  const getPayment = (type: string, monthYear?: string) =>
    payments.find((p) =>
      type === "inscription"
        ? p.type === "inscription"
        : p.type === "mensualite" && p.month_year === monthYear
    );

  const totalPaid = payments
    .filter((p) => p.status === "paid")
    .reduce((acc, p) => acc + p.amount, 0);

  const totalDue = config.fraisInscription + config.mensualite * months.length;

  /* ── Mutations ── */
  const saveMutation = useMutation({
    mutationFn: async ({
      id, type, monthYear,
    }: { id?: string; type: string; monthYear?: string }) => {
      const payload = {
        dossier_id: dossier.id,
        type,
        month_year: monthYear ?? null,
        amount: form.amount,
        payment_date: form.payment_date || null,
        method: form.method || null,
        note: form.note || null,
        status: "paid",
      };
      if (id) {
        const { error } = await supabase.from("payments").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("payments").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments", dossier.id] });
      qc.invalidateQueries({ queryKey: ["all-payments"] });
      toast.success("Paiement enregistré.");
      setAddMonth(null);
      setEditId(null);
      setForm(EMPTY_FORM);
    },
    onError: (e: Error) => toast.error(e.message || "Erreur lors de l'enregistrement."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments", dossier.id] });
      qc.invalidateQueries({ queryKey: ["all-payments"] });
      toast.success("Paiement supprimé.");
    },
    onError: (e: Error) => toast.error(e.message || "Erreur."),
  });

  /* ── Open add/edit ── */
  const openAdd = (key: string, defaultAmount: number) => {
    setAddMonth(key);
    setEditId(null);
    setForm({ ...EMPTY_FORM, amount: defaultAmount });
  };

  const openEdit = (p: Payment) => {
    setEditId(p.id);
    setAddMonth(null);
    setForm({
      amount: p.amount,
      payment_date: p.payment_date ?? new Date().toISOString().split("T")[0],
      method: p.method ?? "especes",
      note: p.note ?? "",
    });
  };

  const activeKey = editId
    ? payments.find((p) => p.id === editId)?.type === "inscription"
      ? "inscription"
      : payments.find((p) => p.id === editId)?.month_year ?? null
    : addMonth;

  /* ── Inline payment form ── */
  const PayForm = ({
    type, monthYear, expectedAmount,
  }: { type: string; monthYear?: string; expectedAmount: number }) => {
    const remaining = expectedAmount - form.amount;
    const isComplete = form.amount >= expectedAmount;
    const isPartial = form.amount > 0 && !isComplete;

    return (
      <div className="bg-secondary/60 rounded-lg border border-border p-3 space-y-3 mt-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              Montant versé (GNF)
            </p>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
              className="w-full h-9 px-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
            {/* Amount hint */}
            {form.amount > 0 && (
              <p className={`text-[10px] mt-1 font-medium ${isComplete ? "text-success" : "text-warning"}`}>
                {isComplete
                  ? `✓ Complet (${fmt(expectedAmount)})`
                  : `Partiel — reste ${fmt(remaining)}`}
              </p>
            )}
            {form.amount === 0 && (
              <p className="text-[10px] mt-1 text-muted-foreground">
                Attendu : {fmt(expectedAmount)}
              </p>
            )}
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              Date
            </p>
            <input
              type="date"
              value={form.payment_date}
              onChange={(e) => setForm((f) => ({ ...f, payment_date: e.target.value }))}
              className="w-full h-9 px-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            Méthode
          </p>
          <div className="relative">
            <select
              value={form.method}
              onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}
              className="w-full h-9 pl-2 pr-7 rounded-lg border border-border bg-background text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-primary/30"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            Note (optionnel)
          </p>
          <input
            type="text"
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            placeholder="N° reçu, remarque..."
            className="w-full h-9 px-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setAddMonth(null); setEditId(null); }}
            className="flex-1 h-8 rounded-lg border border-border text-xs font-medium hover:bg-secondary transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => saveMutation.mutate({ id: editId ?? undefined, type, monthYear })}
            disabled={!form.amount || !form.payment_date || saveMutation.isPending}
            className={`flex-1 h-8 rounded-lg text-xs font-semibold disabled:opacity-40 flex items-center justify-center gap-1.5 transition-colors text-white ${
              isPartial
                ? "bg-warning hover:bg-warning/90"
                : "bg-primary hover:bg-primary-dark"
            }`}
          >
            {saveMutation.isPending
              ? <span className="w-3 h-3 border-[1.5px] border-white/40 border-t-white rounded-full animate-spin" />
              : isPartial
                ? <><AlertCircle className="w-3 h-3" /> Enregistrer partiel</>
                : <><Check className="w-3 h-3" /> Enregistrer</>
            }
          </button>
        </div>
      </div>
    );
  };

  /* ── Payment row ── */
  const PaymentRow = ({
    label, type, monthYear, expectedAmount,
  }: {
    label: string;
    type: string;
    monthYear?: string;
    expectedAmount: number;
  }) => {
    const p = getPayment(type, monthYear);
    const rowKey = type === "inscription" ? "inscription" : monthYear;
    const isOpen = activeKey === rowKey;

    // Determine display state
    const isPartial = p?.status === "paid" && p.amount < expectedAmount;
    const isPaidFull = p?.status === "paid" && p.amount >= expectedAmount;

    return (
      <div>
        <div className="flex items-center gap-3 py-2.5 px-1">
          {/* Status icon */}
          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
            isPaidFull
              ? "bg-success/15"
              : isPartial
                ? "bg-warning/15"
                : "bg-secondary border border-border"
          }`}>
            {isPaidFull
              ? <Check className="w-3 h-3 text-success" />
              : isPartial
                ? <AlertCircle className="w-3 h-3 text-warning" />
                : <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
            }
          </div>

          {/* Label + detail */}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${
              isPaidFull ? "text-foreground"
              : isPartial ? "text-warning"
              : "text-muted-foreground"
            }`}>
              {label}
            </p>
            {p?.status === "paid" && (
              <p className="text-xs text-muted-foreground">
                {fmt(p.amount)}
                {isPartial && (
                  <span className="text-warning font-medium">
                    {" "}· reste {fmt(expectedAmount - p.amount)}
                  </span>
                )}
                {p.payment_date && ` · ${format(parseISO(p.payment_date), "dd MMM yyyy", { locale: fr })}`}
                {p.method && ` · ${PAYMENT_METHODS.find((m) => m.id === p.method)?.label ?? p.method}`}
              </p>
            )}
          </div>

          {/* Expected amount chip */}
          <span className="text-xs text-muted-foreground shrink-0">{fmt(expectedAmount)}</span>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {p?.status === "paid" ? (
              <>
                <button
                  onClick={() => openEdit(p)}
                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  onClick={() => deleteMutation.mutate(p.id)}
                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </>
            ) : (
              <button
                onClick={() =>
                  isOpen
                    ? (setAddMonth(null), setEditId(null))
                    : openAdd(type === "inscription" ? "inscription" : monthYear!, expectedAmount)
                }
                className="flex items-center gap-1 h-6 px-2 rounded-md bg-primary/10 text-primary text-[11px] font-semibold hover:bg-primary/20 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Enregistrer
              </button>
            )}
          </div>
        </div>

        {/* Inline form */}
        {isOpen && !editId && (
          <PayForm type={type} monthYear={monthYear} expectedAmount={expectedAmount} />
        )}
        {editId && p && editId === p.id && (
          <PayForm type={type} monthYear={monthYear} expectedAmount={expectedAmount} />
        )}
      </div>
    );
  };

  /* ── Render ── */
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-2.5 bg-secondary border-b border-border">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
          Suivi des paiements
        </p>
      </div>

      {/* Summary bar */}
      <div className="px-4 py-3 border-b border-border grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xs text-muted-foreground">Total payé</p>
          <p className="text-sm font-bold text-success">{fmt(totalPaid)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Total dû</p>
          <p className="text-sm font-bold">{fmt(totalDue)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Reste</p>
          <p className={`text-sm font-bold ${totalDue - totalPaid > 0 ? "text-warning" : "text-success"}`}>
            {fmt(Math.max(0, totalDue - totalPaid))}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 py-2 border-b border-border">
        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-success rounded-full transition-all"
            style={{ width: `${Math.min(100, (totalPaid / (totalDue || 1)) * 100)}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 text-right">
          {Math.round((totalPaid / (totalDue || 1)) * 100)}% payé
        </p>
      </div>

      {/* Rows */}
      <div className="px-4 divide-y divide-border/50">
        {/* Frais d'inscription — une seule fois */}
        <PaymentRow
          label="Frais d'inscription"
          type="inscription"
          expectedAmount={config.fraisInscription}
        />

        {/* Mensualités — un row par mois depuis l'inscription */}
        {months.map((m) => (
          <PaymentRow
            key={m}
            label={format(parseISO(`${m}-01`), "MMMM yyyy", { locale: fr })}
            type="mensualite"
            monthYear={m}
            expectedAmount={config.mensualite}
          />
        ))}
      </div>
    </div>
  );
};

export default DossierPayments;
