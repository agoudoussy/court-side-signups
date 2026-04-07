import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Send, Users, MessageSquare, ChevronDown, Plus, X, Search, Check } from "lucide-react";
import { toast } from "sonner";
import Pagination from "@/components/admin/Pagination";
import Portal from "@/components/admin/Portal";

interface Message {
  id: string;
  created_at: string;
  subject: string;
  body: string;
  recipient_emails: string[];
  recipient_count: number;
  type: string;
  status: string;
}

interface Parent {
  email: string;
  nom: string;
  status: string; // statut du dernier dossier connu
}

type RecipientMode = "all" | "group" | "custom";

const GROUP_OPTIONS = [
  { id: "en_attente", label: "Dossiers en attente" },
  { id: "valide",     label: "Dossiers validés" },
  { id: "refuse",     label: "Dossiers refusés" },
];

const Messages = () => {
  const [composing, setComposing] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  // recipient mode
  const [mode, setMode] = useState<RecipientMode>("all");
  const [groupFilter, setGroupFilter] = useState("en_attente");
  const [customSelected, setCustomSelected] = useState<Set<string>>(new Set());
  const [parentSearch, setParentSearch] = useState("");

  const qc = useQueryClient();

  /* ── data ── */
  const { data: rawDossiers = [] } = useQuery<{ parent_email: string; parent_nom: string; status: string }[]>({
    queryKey: ["admin-dossiers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dossiers")
        .select("parent_email, parent_nom, status")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["admin-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  /* ── unique parents (dedup by email) ── */
  const allParents = useMemo<Parent[]>(() => {
    const map = new Map<string, Parent>();
    for (const d of rawDossiers) {
      if (!d.parent_email || map.has(d.parent_email)) continue;
      map.set(d.parent_email, { email: d.parent_email, nom: d.parent_nom, status: d.status });
    }
    return Array.from(map.values());
  }, [rawDossiers]);

  /* ── parents filtered for "group" mode ── */
  const groupParents = useMemo(
    () => allParents.filter((p) => p.status === groupFilter),
    [allParents, groupFilter]
  );

  /* ── parents shown in custom list (with search) ── */
  const filteredForList = useMemo(() => {
    const q = parentSearch.toLowerCase();
    if (!q) return allParents;
    return allParents.filter(
      (p) => p.nom.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
    );
  }, [allParents, parentSearch]);

  /* ── final recipients depending on mode ── */
  const recipients = useMemo<Parent[]>(() => {
    if (mode === "all") return allParents;
    if (mode === "group") return groupParents;
    return allParents.filter((p) => customSelected.has(p.email));
  }, [mode, allParents, groupParents, customSelected]);

  /* ── toggle individual parent in custom mode ── */
  const toggleParent = (email: string) => {
    setCustomSelected((prev) => {
      const next = new Set(prev);
      next.has(email) ? next.delete(email) : next.add(email);
      return next;
    });
  };

  const toggleAllVisible = () => {
    const allSelected = filteredForList.every((p) => customSelected.has(p.email));
    setCustomSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) filteredForList.forEach((p) => next.delete(p.email));
      else filteredForList.forEach((p) => next.add(p.email));
      return next;
    });
  };

  /* ── send ── */
  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!subject.trim() || !body.trim()) throw new Error("Champs requis");
      const emails = recipients.map((r) => r.email);
      const { error } = await supabase.from("messages").insert({
        subject: subject.trim(),
        body: body.trim(),
        recipient_emails: emails,
        recipient_count: emails.length,
        type: "bulk",
        status: "sent",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-messages"] });
      toast.success(`Message envoyé à ${recipients.length} destinataire${recipients.length !== 1 ? "s" : ""}.`);
      resetCompose();
    },
    onError: (e: Error) => {
      toast.error(e.message || "Erreur lors de l'envoi du message.");
    },
  });

  const resetCompose = () => {
    setComposing(false);
    setSubject("");
    setBody("");
    setMode("all");
    setGroupFilter("en_attente");
    setCustomSelected(new Set());
    setParentSearch("");
  };

  const totalMsgPages = Math.max(1, Math.ceil(messages.length / pageSize));
  const paginatedMessages = messages.slice((page - 1) * pageSize, page * pageSize);

  /* ── STATUS labels ── */
  const STATUS_LABELS: Record<string, string> = {
    en_attente: "En attente",
    valide: "Validé",
    refuse: "Refusé",
  };
  const STATUS_COLORS: Record<string, string> = {
    en_attente: "bg-warning/15 text-warning",
    valide: "bg-success/15 text-success",
    refuse: "bg-destructive/15 text-destructive",
  };

  /* ── render ── */
  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl tracking-wider">COMMUNICATIONS</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Envoyez des messages groupés aux parents</p>
        </div>
        <button
          onClick={() => setComposing(true)}
          className="flex items-center gap-2 h-10 px-4 bg-primary hover:bg-primary-dark text-primary-foreground text-sm font-semibold rounded-xl transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nouveau message
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Messages envoyés</span>
          </div>
          <p className="text-2xl font-display tracking-wide">{messages.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Parents contactés</span>
          </div>
          <p className="text-2xl font-display tracking-wide">
            {new Set(messages.flatMap((m) => m.recipient_emails)).size}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 sm:col-span-1 col-span-2">
          <div className="flex items-center gap-2 mb-1">
            <Send className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Total destinataires</span>
          </div>
          <p className="text-2xl font-display tracking-wide">
            {messages.reduce((acc, m) => acc + m.recipient_count, 0)}
          </p>
        </div>
      </div>

      {/* Message history */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h2 className="text-sm font-semibold">Historique des envois</h2>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto" />
            <p className="text-sm text-muted-foreground">Aucun message envoyé pour l'instant</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {paginatedMessages.map((m) => (
              <div key={m.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{m.subject}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{m.body}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(m.created_at), "dd MMM yyyy", { locale: fr })}
                    </p>
                    <div className="flex items-center gap-1 justify-end mt-1">
                      <Users className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {m.recipient_count} destinataire{m.recipient_count !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination historique */}
      <Pagination
        page={page}
        totalPages={totalMsgPages}
        totalItems={messages.length}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
      />

      {/* ── Compose panel ── */}
      {composing && (
        <Portal>
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={resetCompose} />
          <div className="relative ml-auto w-full max-w-lg bg-background h-full flex flex-col shadow-2xl">

            {/* Header */}
            <div className="sticky top-0 bg-background border-b border-border px-5 py-4 flex items-center justify-between z-10 shrink-0">
              <div>
                <p className="font-semibold text-sm">Nouveau message groupé</p>
                <p className="text-xs text-muted-foreground">Notification aux parents sélectionnés</p>
              </div>
              <button onClick={resetCompose} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">

              {/* ── Section destinataires ── */}
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="px-4 py-2.5 bg-secondary border-b border-border">
                  <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
                    Destinataires
                  </p>
                </div>

                {/* Mode tabs */}
                <div className="flex border-b border-border">
                  {([
                    { id: "all",    label: "Tous" },
                    { id: "group",  label: "Par groupe" },
                    { id: "custom", label: "Sélection" },
                  ] as { id: RecipientMode; label: string }[]).map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMode(m.id)}
                      className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                        mode === m.id
                          ? "bg-primary/8 text-primary border-b-2 border-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                <div className="p-4 space-y-3">
                  {/* ALL mode */}
                  {mode === "all" && (
                    <div className="flex items-center gap-2 py-1">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Tous les parents inscrits</p>
                        <p className="text-xs text-muted-foreground">
                          {allParents.length} parent{allParents.length !== 1 ? "s" : ""} · tous statuts confondus
                        </p>
                      </div>
                    </div>
                  )}

                  {/* GROUP mode */}
                  {mode === "group" && (
                    <div className="space-y-3">
                      <div className="relative">
                        <select
                          value={groupFilter}
                          onChange={(e) => setGroupFilter(e.target.value)}
                          className="w-full h-10 pl-3 pr-8 rounded-lg border-[1.5px] border-border bg-background text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-colors"
                        >
                          {GROUP_OPTIONS.map((o) => (
                            <option key={o.id} value={o.id}>{o.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      </div>
                      {groupParents.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-2">Aucun parent dans ce groupe</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                          {groupParents.map((p) => (
                            <span
                              key={p.email}
                              className="flex items-center gap-1 px-2 py-1 bg-primary/8 text-primary text-[11px] rounded-full"
                            >
                              {p.nom}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* CUSTOM mode */}
                  {mode === "custom" && (
                    <div className="space-y-2">
                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <input
                          type="text"
                          value={parentSearch}
                          onChange={(e) => setParentSearch(e.target.value)}
                          placeholder="Rechercher un parent..."
                          className="w-full h-9 pl-8 pr-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-colors"
                        />
                      </div>

                      {/* Select / deselect all visible */}
                      {filteredForList.length > 0 && (
                        <button
                          onClick={toggleAllVisible}
                          className="text-xs text-primary hover:underline"
                        >
                          {filteredForList.every((p) => customSelected.has(p.email))
                            ? "Tout désélectionner"
                            : `Sélectionner les ${filteredForList.length} affichés`}
                        </button>
                      )}

                      {/* Parent checklist */}
                      <div className="max-h-52 overflow-y-auto rounded-lg border border-border divide-y divide-border">
                        {filteredForList.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-4">Aucun résultat</p>
                        ) : (
                          filteredForList.map((p) => {
                            const checked = customSelected.has(p.email);
                            return (
                              <button
                                key={p.email}
                                onClick={() => toggleParent(p.email)}
                                className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-secondary/50 transition-colors text-left"
                              >
                                <div className={`w-4.5 h-4.5 rounded border-[1.5px] flex items-center justify-center shrink-0 transition-colors ${
                                  checked ? "bg-primary border-primary" : "border-border"
                                }`}>
                                  {checked && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{p.nom}</p>
                                  <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                                </div>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${STATUS_COLORS[p.status] ?? "bg-secondary text-muted-foreground"}`}>
                                  {STATUS_LABELS[p.status] ?? p.status}
                                </span>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* Recipients count badge */}
                  <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
                    recipients.length > 0 ? "bg-primary/8 text-primary" : "bg-secondary text-muted-foreground"
                  }`}>
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    {recipients.length === 0
                      ? "Aucun destinataire sélectionné"
                      : `${recipients.length} destinataire${recipients.length !== 1 ? "s" : ""} · ${recipients.map((r) => r.nom).slice(0, 3).join(", ")}${recipients.length > 3 ? ` +${recipients.length - 3}` : ""}`
                    }
                  </div>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground block mb-1.5">
                  Sujet
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Objet du message..."
                  className="w-full h-10 px-3 rounded-lg border-[1.5px] border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-colors"
                />
              </div>

              {/* Body */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground block mb-1.5">
                  Message
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Rédigez votre message ici..."
                  rows={7}
                  className="w-full px-3 py-2.5 rounded-lg border-[1.5px] border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-colors resize-none"
                />
              </div>

              <p className="text-xs text-muted-foreground bg-secondary rounded-lg px-4 py-3 border border-border">
                Le message sera enregistré dans l'historique. Pour l'envoi email automatique, configurez un service d'emailing (ex: Resend via Supabase Edge Functions).
              </p>
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-border px-5 py-4 flex gap-3">
              <button
                onClick={resetCompose}
                className="flex-1 h-11 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => sendMutation.mutate()}
                disabled={!subject.trim() || !body.trim() || recipients.length === 0 || sendMutation.isPending}
                className="flex-1 h-11 bg-primary hover:bg-primary-dark text-primary-foreground font-semibold rounded-xl text-sm tracking-wide transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {sendMutation.isPending ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <><Send className="w-4 h-4" /> Envoyer à {recipients.length}</>
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

export default Messages;
