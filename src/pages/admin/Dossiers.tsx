import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { format, parseISO, differenceInYears } from "date-fns";
import { fr } from "date-fns/locale";
import { Search, ChevronDown, X, Plus, AlertTriangle, User } from "lucide-react";
import DossierPayments from "@/components/admin/DossierPayments";
import { toast } from "sonner";
import AddDossierModal from "@/components/admin/AddDossierModal";
import Pagination from "@/components/admin/Pagination";
import Portal from "@/components/admin/Portal";

interface Dossier {
  id: string;
  created_at: string;
  dossier_number: string;
  status: "en_attente" | "valide" | "refuse";
  child_nom: string;
  child_prenom: string;
  child_date_naissance: string;
  child_genre: string;
  child_adresse: string;
  child_telephone: string;
  child_photo: string | null;
  has_allergy: boolean;
  allergy_details: string | null;
  parent_email: string;
  parent_nom: string;
  parent_telephone: string;
  payment_method: string;
  payment_other: string | null;
  signature_nom: string;
  signature_date: string;
}

const STATUS_CONFIG = {
  en_attente: { label: "En attente", className: "bg-warning/15 text-warning" },
  valide: { label: "Validé", className: "bg-success/15 text-success" },
  refuse: { label: "Refusé", className: "bg-destructive/15 text-destructive" },
};

const PAYMENT_LABELS: Record<string, string> = {
  virement: "Virement bancaire",
  especes: "Espèces",
  cheque: "Chèque",
  orange: "Orange Money",
  autre: "Autre",
};

const TABS = [
  { key: "all", label: "Tous" },
  { key: "en_attente", label: "En attente" },
  { key: "valide", label: "Validés" },
  { key: "refuse", label: "Refusés" },
];

const Dossiers = () => {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Dossier | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchParams, setSearchParams] = useSearchParams();

  const qc = useQueryClient();

  const { data: dossiers = [], isLoading } = useQuery<Dossier[]>({
    queryKey: ["admin-dossiers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dossiers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Ouvrir automatiquement le dossier ciblé via ?open=ID
  useEffect(() => {
    const openId = searchParams.get("open");
    if (!openId || dossiers.length === 0) return;
    const target = dossiers.find((d) => d.id === openId);
    if (target) {
      setSelected(target);
      setSearchParams({}, { replace: true }); // nettoyer l'URL
    }
  }, [searchParams, dossiers]);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from("dossiers")
        .update({ status })
        .eq("id", id)
        .select("id, status")
        .single();
      if (error) throw error;
      if (!data) throw new Error("Aucune ligne mise à jour — vérifiez les policies RLS.");
      return data.status as Dossier["status"];
    },
    onSuccess: (newStatus) => {
      const labels: Record<string, string> = { en_attente: "En attente", valide: "Validé", refuse: "Refusé" };
      toast.success(`Statut mis à jour : ${labels[newStatus] ?? newStatus}`);
      qc.invalidateQueries({ queryKey: ["admin-dossiers"] });
      setSelected((d) => d ? { ...d, status: newStatus } : null);
    },
    onError: (e: Error) => {
      toast.error(e.message || "Erreur lors de la mise à jour du statut.");
    },
  });

  const filtered = dossiers?.filter((d) => {
    const matchTab = tab === "all" || d.status === tab;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      d.child_nom.toLowerCase().includes(q) ||
      d.child_prenom.toLowerCase().includes(q) ||
      d.parent_nom.toLowerCase().includes(q) ||
      d.dossier_number.toLowerCase().includes(q);
    return matchTab && matchSearch;
  }) ?? [];

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl tracking-wider">DOSSIERS</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{dossiers.length} dossier{dossiers.length !== 1 ? "s" : ""} au total</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 h-10 px-4 bg-primary hover:bg-primary-dark text-primary-foreground text-sm font-semibold rounded-xl transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nouveau
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Rechercher par nom, dossier..."
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-colors"
          />
        </div>
        <div className="flex rounded-lg border border-border bg-card overflow-hidden">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setPage(1); }}
              className={`px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${tab === t.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-12">Aucun dossier trouvé</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">N° Dossier</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">Enfant</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold tracking-widest uppercase text-muted-foreground hidden sm:table-cell">Genre</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold tracking-widest uppercase text-muted-foreground hidden md:table-cell">Parent</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold tracking-widest uppercase text-muted-foreground hidden lg:table-cell">Paiement</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">Statut</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold tracking-widest uppercase text-muted-foreground hidden sm:table-cell">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginated.map((d) => {
                  const age = d.child_date_naissance
                    ? differenceInYears(new Date(), parseISO(d.child_date_naissance))
                    : null;
                  return (
                    <tr
                      key={d.id}
                      className="hover:bg-secondary/50 transition-colors cursor-pointer"
                      onClick={() => setSelected(d)}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{d.dossier_number}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{d.child_prenom} {d.child_nom}</p>
                        {age !== null && <p className="text-xs text-muted-foreground">{age} ans</p>}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${d.child_genre === "Masculin" ? "bg-blue-50 text-blue-600" : "bg-pink-50 text-pink-600"
                          }`}>
                          {d.child_genre}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{d.parent_nom}</td>
                      <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                        {PAYMENT_LABELS[d.payment_method] ?? d.payment_method}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_CONFIG[d.status].className}`}>
                          {STATUS_CONFIG[d.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-xs text-muted-foreground">
                        {format(parseISO(d.created_at), "dd MMM yy", { locale: fr })}
                      </td>
                      <td className="px-4 py-3">
                        <ChevronDown className="w-4 h-4 text-muted-foreground rotate-[-90deg]" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={filtered.length}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
      />

      {/* Add dossier modal */}
      {addOpen && <AddDossierModal onClose={() => setAddOpen(false)} />}

      {/* Detail panel */}
      {selected && (
        <Portal>
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <div className="relative ml-auto w-full max-w-md bg-background h-full overflow-y-auto shadow-2xl">
            {/* Panel header */}
            <div className="sticky top-0 bg-background border-b border-border px-5 py-4 flex items-center justify-between z-10">
              <div>
                <p className="font-semibold text-sm">{selected.child_prenom} {selected.child_nom}</p>
                <p className="text-xs text-muted-foreground font-mono">{selected.dossier_number}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Photo */}
              {selected.child_photo && (
                <div className="flex items-center gap-4">
                  <img
                    src={selected.child_photo}
                    alt={`${selected.child_prenom} ${selected.child_nom}`}
                    className="w-20 h-20 rounded-xl object-cover border border-border"
                  />
                  <div>
                    <p className="font-semibold text-sm">{selected.child_prenom} {selected.child_nom}</p>
                    <p className="text-xs text-muted-foreground font-mono">{selected.dossier_number}</p>
                  </div>
                </div>
              )}

              {/* Status actions */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  {(["en_attente", "valide", "refuse"] as const).map((s) => {
                    const isActive = selected.status === s;
                    const isPending = updateStatus.isPending && updateStatus.variables?.status === s;
                    return (
                      <button
                        key={s}
                        onClick={() => updateStatus.mutate({ id: selected.id, status: s })}
                        disabled={updateStatus.isPending}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 ${
                          isActive
                            ? STATUS_CONFIG[s].className + " ring-1 ring-inset"
                            : "bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {isPending
                          ? <span className="w-3 h-3 border-[1.5px] border-current/40 border-t-current rounded-full animate-spin" />
                          : STATUS_CONFIG[s].label
                        }
                      </button>
                    );
                  })}
                </div>
              </div>

              <Section title="Informations enfant">
                {!selected.child_photo && (
                  <div className="px-4 py-3 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center border border-border">
                      <User className="w-5 h-5 text-muted-foreground/40" />
                    </div>
                    <span className="text-xs text-muted-foreground">Pas de photo</span>
                  </div>
                )}
                <Row label="Nom" value={selected.child_nom} />
                <Row label="Prénom" value={selected.child_prenom} />
                {selected.child_date_naissance && (
                  <>
                    <Row label="Date de naissance" value={format(parseISO(selected.child_date_naissance), "dd MMMM yyyy", { locale: fr })} />
                    <Row label="Âge" value={`${differenceInYears(new Date(), parseISO(selected.child_date_naissance))} ans`} />
                  </>
                )}
                <Row label="Genre" value={selected.child_genre} />
                <Row label="Adresse" value={selected.child_adresse} />
                <Row label="Téléphone" value={selected.child_telephone} />
              </Section>

              {/* Allergies */}
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className={`px-4 py-2.5 border-b border-border flex items-center gap-2 ${selected.has_allergy ? "bg-warning/8" : "bg-secondary"}`}>
                  <AlertTriangle className={`w-3.5 h-3.5 ${selected.has_allergy ? "text-warning" : "text-muted-foreground"}`} />
                  <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">Informations médicales</p>
                </div>
                <div className="px-4 py-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Allergies / contre-indications</span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${selected.has_allergy ? "bg-warning/15 text-warning" : "bg-success/15 text-success"}`}>
                      {selected.has_allergy ? "Oui" : "Non"}
                    </span>
                  </div>
                  {selected.has_allergy && selected.allergy_details && (
                    <p className="text-sm text-foreground bg-warning/5 border border-warning/20 rounded-lg px-3 py-2 mt-1">
                      {selected.allergy_details}
                    </p>
                  )}
                </div>
              </div>

              <Section title="Parent / Tuteur">
                <Row label="Nom" value={selected.parent_nom} />
                <Row label="Email" value={selected.parent_email} />
                <Row label="Téléphone" value={selected.parent_telephone} />
              </Section>

              {/* Méthode de paiement */}
              <Section title="Méthode de paiement">
                <Row label="Méthode" value={PAYMENT_LABELS[selected.payment_method] ?? selected.payment_method} />
                {selected.payment_other && <Row label="Précision" value={selected.payment_other} />}
              </Section>

              {/* Suivi des paiements */}
              <DossierPayments dossier={selected} />

              <Section title="Signature">
                <Row label="Signataire" value={selected.signature_nom} />
                {selected.signature_date && (
                  <Row label="Date" value={format(parseISO(selected.signature_date), "dd MMMM yyyy", { locale: fr })} />
                )}
              </Section>
            </div>
          </div>
        </div>
        </Portal>
      )}
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-xl border border-border bg-card overflow-hidden">
    <div className="px-4 py-2.5 bg-secondary border-b border-border">
      <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">{title}</p>
    </div>
    <div className="divide-y divide-border">{children}</div>
  </div>
);

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center px-4 py-2.5 text-sm gap-4">
    <span className="text-muted-foreground shrink-0">{label}</span>
    <span className="font-medium text-right truncate">{value}</span>
  </div>
);

export default Dossiers;
