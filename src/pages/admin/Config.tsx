import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Check, Save } from "lucide-react";
import { toast } from "sonner";

const ALL_METHODS = [
  { id: "virement", label: "Virement bancaire" },
  { id: "especes", label: "Paiement en espèces" },
  { id: "cheque", label: "Chèque" },
  { id: "orange", label: "Orange Money" },
  { id: "autre", label: "Autre (préciser)" },
];

interface ConfigRow { key: string; value: unknown }

const Config = () => {
  const qc = useQueryClient();

  const [fraisInscription, setFraisInscription] = useState("50000");
  const [mensualite, setMensualite] = useState("500000");
  const [activeMethods, setActiveMethods] = useState<string[]>(ALL_METHODS.map((m) => m.id));

  const total = (Number(fraisInscription) || 0) + (Number(mensualite) || 0);

  const { data: configRows } = useQuery<ConfigRow[]>({
    queryKey: ["admin-config"],
    queryFn: async () => {
      const { data, error } = await supabase.from("config").select("*");
      if (error) throw error;
      return data;
    },
  });

  // Populate fields once config is loaded
  useEffect(() => {
    if (!configRows) return;
    const get = (key: string) => configRows.find((r) => r.key === key)?.value;
    const fi = get("frais_inscription");
    const m = get("mensualite");
    const pm = get("payment_methods");
    if (fi) setFraisInscription(String(fi));
    if (m) setMensualite(String(m));
    if (Array.isArray(pm)) setActiveMethods(pm);
  }, [configRows]);

  const upsertConfig = async (key: string, value: unknown) => {
    const { error } = await supabase
      .from("config")
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) throw error;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      await Promise.all([
        upsertConfig("frais_inscription", fraisInscription),
        upsertConfig("mensualite", mensualite),
        upsertConfig("payment_methods", activeMethods),
      ]);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-config"] });
      toast.success("Configuration sauvegardée.");
    },
    onError: (e: Error) => {
      toast.error(e.message || "Erreur lors de la sauvegarde.");
    },
  });

  const toggleMethod = (id: string) => {
    setActiveMethods((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="font-display text-2xl tracking-wider">CONFIGURATION</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gérez les tarifs et les options de paiement</p>
      </div>

      {/* Frais */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3 bg-secondary border-b border-border">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">Frais d'inscription</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-label uppercase text-muted-foreground block mb-1.5">
              Frais d'inscription (GNF)
            </label>
            <input
              type="number"
              value={fraisInscription}
              onChange={(e) => setFraisInscription(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border-[1.5px] border-border bg-background text-body focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-colors"
            />
            <p className="text-xs text-muted-foreground mt-1">Montant payé lors de l'inscription, non remboursable</p>
          </div>
          <div>
            <label className="text-label uppercase text-muted-foreground block mb-1.5">
              Mensualité (GNF)
            </label>
            <input
              type="number"
              value={mensualite}
              onChange={(e) => setMensualite(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border-[1.5px] border-border bg-background text-body focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-colors"
            />
            <p className="text-xs text-muted-foreground mt-1">Maillot + T-shirt inclus</p>
          </div>

          {/* Total preview */}
          <div className="bg-foreground rounded-lg px-4 py-3 flex justify-between items-center">
            <span className="text-sm text-white/60">Total lors de l'inscription</span>
            <span className="font-display text-lg text-primary tracking-wide">
              {total.toLocaleString("fr-FR")} GNF
            </span>
          </div>
        </div>
      </div>

      {/* Payment methods */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3 bg-secondary border-b border-border">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">Méthodes de paiement actives</p>
        </div>
        <div className="divide-y divide-border">
          {ALL_METHODS.map((m) => {
            const active = activeMethods.includes(m.id);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleMethod(m.id)}
                className="flex items-center justify-between w-full px-5 py-3.5 hover:bg-secondary/50 transition-colors"
              >
                <span className={`text-sm ${active ? "font-medium" : "text-muted-foreground"}`}>{m.label}</span>
                <div className={`w-5 h-5 rounded border-[1.5px] flex items-center justify-center transition-colors ${active ? "bg-primary border-primary" : "border-border"
                  }`}>
                  {active && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Save */}
      <button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        className="flex items-center gap-2 h-11 px-6 bg-primary hover:bg-primary-dark text-primary-foreground font-semibold rounded-xl text-sm tracking-wide transition-colors disabled:opacity-50"
      >
        {saveMutation.isPending ? (
          <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Sauvegarde...</>
        ) : (
          <><Save className="w-4 h-4" /> Sauvegarder</>
        )}
      </button>
    </div>
  );
};

export default Config;
//https-proxy = "http://diao.di:8080"
//proxy = "http://diao.di:8080"