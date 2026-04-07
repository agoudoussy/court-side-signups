import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Search, Mail, Phone, X, Users, ChevronRight, Send, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import Pagination from "@/components/admin/Pagination";
import Portal from "@/components/admin/Portal";

interface Dossier {
  id: string;
  created_at: string;
  dossier_number: string;
  status: "en_attente" | "valide" | "refuse";
  child_nom: string;
  child_prenom: string;
  parent_email: string;
  parent_nom: string;
  parent_telephone: string;
  payment_method: string;
}

interface ParentGroup {
  email: string;
  nom: string;
  telephone: string;
  dossiers: Dossier[];
}

const STATUS_CONFIG = {
  en_attente: { label: "En attente", className: "bg-warning/15 text-warning" },
  valide:     { label: "Validé",     className: "bg-success/15 text-success" },
  refuse:     { label: "Refusé",     className: "bg-destructive/15 text-destructive" },
};

interface MessageModal {
  parent: ParentGroup;
  subject: string;
  body: string;
}

const Parents = () => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ParentGroup | null>(null);
  const [msgModal, setMsgModal] = useState<MessageModal | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const qc = useQueryClient();

  const { data: dossiers = [], isLoading } = useQuery<Dossier[]>({
    queryKey: ["admin-dossiers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dossiers")
        .select("id, created_at, dossier_number, status, child_nom, child_prenom, parent_email, parent_nom, parent_telephone, payment_method")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const parents = useMemo<ParentGroup[]>(() => {
    const map = new Map<string, ParentGroup>();
    for (const d of dossiers) {
      const key = d.parent_email || d.parent_telephone;
      if (!map.has(key)) {
        map.set(key, {
          email: d.parent_email,
          nom: d.parent_nom,
          telephone: d.parent_telephone,
          dossiers: [],
        });
      }
      map.get(key)!.dossiers.push(d);
    }
    return Array.from(map.values());
  }, [dossiers]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return parents;
    return parents.filter(
      (p) =>
        p.nom.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.telephone.includes(q) ||
        p.dossiers.some(
          (d) =>
            d.child_nom.toLowerCase().includes(q) ||
            d.child_prenom.toLowerCase().includes(q)
        )
    );
  }, [parents, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openMessage = (parent: ParentGroup) => {
    setMsgModal({ parent, subject: "", body: "" });
    setSendError(null);
  };

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!msgModal) return;
      const { error } = await supabase.from("messages").insert({
        subject: msgModal.subject.trim(),
        body: msgModal.body.trim(),
        recipient_emails: [msgModal.parent.email],
        recipient_count: 1,
        type: "individual",
        status: "sent",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-messages"] });
      toast.success(`Message envoyé à ${msgModal?.parent.nom ?? "ce parent"}.`);
      setMsgModal(null);
    },
    onError: (e: Error) => {
      toast.error(e.message || "Erreur lors de l'envoi du message.");
    },
  });

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl tracking-wider">PARENTS & CONTACTS</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {parents.length} parent{parents.length !== 1 ? "s" : ""} · {dossiers.length} dossier{dossiers.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Rechercher par nom, email, téléphone ou enfant..."
          className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-colors"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-12">Aucun parent trouvé</p>
      ) : (
        <div className="bg-card rounded-xl border border-border divide-y divide-border overflow-hidden">
          {paginated.map((p) => {
            const hasEnAttente = p.dossiers.some((d) => d.status === "en_attente");
            const allValides = p.dossiers.every((d) => d.status === "valide");
            return (
              <div key={p.email || p.telephone} className="flex items-center gap-4 px-5 py-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-primary uppercase">
                    {p.nom?.[0] ?? "?"}
                  </span>
                </div>

                {/* Info */}
                <button
                  className="flex-1 min-w-0 text-left"
                  onClick={() => setSelected(p)}
                >
                  <p className="text-sm font-medium truncate">{p.nom}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {p.dossiers.map((d) => (
                      <span
                        key={d.id}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_CONFIG[d.status].className}`}
                      >
                        {d.child_prenom} {d.child_nom}
                      </span>
                    ))}
                  </div>
                </button>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openMessage(p)}
                    className="w-8 h-8 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-secondary hover:border-primary/30 transition-colors"
                    title="Envoyer un message"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-primary" />
                  </button>
                  <div className={`w-2 h-2 rounded-full ${
                    hasEnAttente ? "bg-warning" : allValides ? "bg-success" : "bg-destructive"
                  }`} />
                  <button onClick={() => setSelected(p)}>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={filtered.length}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
      />

      {/* Detail panel */}
      {selected && (
        <Portal>
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <div className="relative ml-auto w-full max-w-md bg-background h-full overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-background border-b border-border px-5 py-4 flex items-center gap-3 z-10">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-semibold text-primary uppercase">
                  {selected.nom?.[0] ?? "?"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{selected.nom}</p>
                <p className="text-xs text-muted-foreground">{selected.dossiers.length} enfant{selected.dossiers.length !== 1 ? "s" : ""} inscrit{selected.dossiers.length !== 1 ? "s" : ""}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Contact actions */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => { setSelected(null); openMessage(selected); }}
                  className="flex items-center justify-center gap-1.5 h-10 rounded-lg border border-border bg-card hover:bg-secondary text-sm font-medium transition-colors"
                >
                  <MessageSquare className="w-4 h-4 text-primary" />
                  Message
                </button>
                <a
                  href={`mailto:${selected.email}`}
                  className="flex items-center justify-center gap-1.5 h-10 rounded-lg border border-border bg-card hover:bg-secondary text-sm font-medium transition-colors"
                >
                  <Mail className="w-4 h-4 text-primary" />
                  Email
                </a>
                <a
                  href={`tel:${selected.telephone}`}
                  className="flex items-center justify-center gap-1.5 h-10 rounded-lg border border-border bg-card hover:bg-secondary text-sm font-medium transition-colors"
                >
                  <Phone className="w-4 h-4 text-primary" />
                  Appeler
                </a>
              </div>

              {/* Contact info */}
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-4 py-2.5 bg-secondary border-b border-border">
                  <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">Coordonnées</p>
                </div>
                <div className="divide-y divide-border">
                  <InfoRow label="Nom" value={selected.nom} />
                  <InfoRow label="Email" value={selected.email} />
                  <InfoRow label="Téléphone" value={selected.telephone} />
                </div>
              </div>

              {/* Dossiers */}
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-4 py-2.5 bg-secondary border-b border-border">
                  <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
                    Dossiers ({selected.dossiers.length})
                  </p>
                </div>
                <div className="divide-y divide-border">
                  {selected.dossiers.map((d) => (
                    <div key={d.id} className="px-4 py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{d.child_prenom} {d.child_nom}</p>
                        <p className="text-xs text-muted-foreground font-mono">{d.dossier_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(d.created_at), "dd MMMM yyyy", { locale: fr })}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 ${STATUS_CONFIG[d.status].className}`}>
                        {STATUS_CONFIG[d.status].label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        </Portal>
      )}

      {/* Message compose modal */}
      {msgModal && (
        <Portal>
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMsgModal(null)} />
          <div className="relative w-full max-w-md bg-background rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">Message à {msgModal.parent.nom}</p>
                <p className="text-xs text-muted-foreground truncate">{msgModal.parent.email}</p>
              </div>
              <button onClick={() => setMsgModal(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground block mb-1.5">Sujet</label>
                <input
                  type="text"
                  value={msgModal.subject}
                  onChange={(e) => setMsgModal((m) => m ? { ...m, subject: e.target.value } : null)}
                  placeholder="Objet du message..."
                  className="w-full h-10 px-3 rounded-lg border-[1.5px] border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground block mb-1.5">Message</label>
                <textarea
                  value={msgModal.body}
                  onChange={(e) => setMsgModal((m) => m ? { ...m, body: e.target.value } : null)}
                  placeholder="Rédigez votre message..."
                  rows={5}
                  className="w-full px-3 py-2.5 rounded-lg border-[1.5px] border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-colors resize-none"
                />
              </div>

              {/* mailto fallback */}
              {msgModal.subject && msgModal.body && (
                <a
                  href={`mailto:${msgModal.parent.email}?subject=${encodeURIComponent(msgModal.subject)}&body=${encodeURIComponent(msgModal.body)}`}
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Ouvrir dans votre client mail
                </a>
              )}

            </div>

            <div className="px-5 pb-5 flex gap-3">
              <button
                onClick={() => setMsgModal(null)}
                className="flex-1 h-11 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => sendMutation.mutate()}
                disabled={!msgModal.subject.trim() || !msgModal.body.trim() || sendMutation.isPending}
                className="flex-1 h-11 bg-primary hover:bg-primary-dark text-primary-foreground font-semibold rounded-xl text-sm tracking-wide transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {sendMutation.isPending ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <><Send className="w-4 h-4" /> Envoyer</>
                )}
              </button>
            </div>
          </div>
        </div>
        </Portal>
      )}
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center px-4 py-2.5 text-sm gap-4">
    <span className="text-muted-foreground shrink-0">{label}</span>
    <span className="font-medium text-right truncate">{value || "—"}</span>
  </div>
);

export default Parents;
