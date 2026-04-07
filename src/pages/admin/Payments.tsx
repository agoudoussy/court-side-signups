import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  format, parseISO, addMonths, startOfMonth, isAfter,
} from "date-fns";
import { fr } from "date-fns/locale";
import { Search, TrendingUp, AlertCircle, Users, ChevronDown, ChevronUp } from "lucide-react";
import DossierPayments from "@/components/admin/DossierPayments";
import { useConfig } from "@/hooks/use-config";

interface Dossier {
  id: string;
  created_at: string;
  dossier_number: string;
  status: "en_attente" | "valide" | "refuse";
  child_nom: string;
  child_prenom: string;
  parent_nom: string;
}

interface Payment {
  id: string;
  dossier_id: string;
  type: "inscription" | "mensualite";
  month_year: string | null;
  amount: number;
  status: "paid" | "pending";
}

const fmt = (n: number) => n.toLocaleString("fr-FR") + " GNF";

const Payments = () => {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { config } = useConfig();

  const { data: dossiers = [], isLoading } = useQuery<Dossier[]>({
    queryKey: ["admin-dossiers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dossiers")
        .select("id, created_at, dossier_number, status, child_nom, child_prenom, parent_nom")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: allPayments = [] } = useQuery<Payment[]>({
    queryKey: ["all-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("id, dossier_id, type, month_year, amount, status");
      if (error) throw error;
      return data;
    },
  });

  /* ── Stats ── */
  const stats = useMemo(() => {
    const totalPaid = allPayments
      .filter((p) => p.status === "paid")
      .reduce((s, p) => s + p.amount, 0);

    // Total expected across all children (inscription + all months up to now)
    const now = startOfMonth(new Date());
    let totalExpected = 0;
    let unpaidThisMonth = 0;
    const thisMonth = format(now, "yyyy-MM");

    for (const d of dossiers) {
      const start = startOfMonth(parseISO(d.created_at));
      let cur = start;
      let monthCount = 0;
      while (!isAfter(cur, now)) {
        monthCount++;
        cur = addMonths(cur, 1);
      }
      totalExpected += config.fraisInscription + config.mensualite * monthCount;

      const hasPaidThisMonth = allPayments.some(
        (p) =>
          p.dossier_id === d.id &&
          p.type === "mensualite" &&
          p.month_year === thisMonth &&
          p.status === "paid" &&
          p.amount >= config.mensualite
      );
      if (!hasPaidThisMonth) unpaidThisMonth++;
    }

    return { totalPaid, totalExpected, unpaidThisMonth };
  }, [allPayments, dossiers, config]);

  /* ── Filtered list ── */
  const filtered = useMemo(
    () =>
      dossiers.filter((d) => {
        const q = search.toLowerCase();
        return (
          !q ||
          d.child_nom.toLowerCase().includes(q) ||
          d.child_prenom.toLowerCase().includes(q) ||
          d.dossier_number.toLowerCase().includes(q) ||
          d.parent_nom.toLowerCase().includes(q)
        );
      }),
    [dossiers, search]
  );

  /* ── Per-child paid total ── */
  const paidByDossier = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of allPayments) {
      if (p.status === "paid") {
        map[p.dossier_id] = (map[p.dossier_id] ?? 0) + p.amount;
      }
    }
    return map;
  }, [allPayments]);

  /* ── Per-child: has partial payment this month? ── */
  const partialThisMonth = useMemo(() => {
    const thisMonth = format(startOfMonth(new Date()), "yyyy-MM");
    const set = new Set<string>();
    for (const p of allPayments) {
      if (
        p.type === "mensualite" &&
        p.month_year === thisMonth &&
        p.status === "paid" &&
        p.amount > 0 &&
        p.amount < config.mensualite
      ) {
        set.add(p.dossier_id);
      }
    }
    return set;
  }, [allPayments, config.mensualite]);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl tracking-wider">PAIEMENTS</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Inscription (une fois) + mensualités par enfant
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={TrendingUp}
          color="text-success"
          bg="bg-success/10"
          label="Total encaissé"
          value={fmt(stats.totalPaid)}
        />
        <StatCard
          icon={Users}
          color="text-primary"
          bg="bg-primary/10"
          label="Total attendu"
          value={fmt(stats.totalExpected)}
        />
        <StatCard
          icon={AlertCircle}
          color="text-warning"
          bg="bg-warning/10"
          label="Mensualité impayée ce mois"
          value={`${stats.unpaidThisMonth} enfant${stats.unpaidThisMonth !== 1 ? "s" : ""}`}
        />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom, dossier..."
          className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-colors"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-10">
          Aucun dossier trouvé
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((d) => {
            const paid = paidByDossier[d.id] ?? 0;
            const hasPartial = partialThisMonth.has(d.id);
            const isOpen = expandedId === d.id;

            return (
              <div
                key={d.id}
                className="bg-card rounded-xl border border-border overflow-hidden"
              >
                {/* Row header */}
                <button
                  onClick={() => setExpandedId(isOpen ? null : d.id)}
                  className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-secondary/50 transition-colors text-left"
                >
                  {/* Indicator dot */}
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    hasPartial ? "bg-warning" : paid > 0 ? "bg-success" : "bg-muted-foreground/30"
                  }`} />

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">
                      {d.child_prenom} {d.child_nom}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {d.dossier_number}
                      <span className="font-sans"> · {d.parent_nom}</span>
                      <span className="font-sans"> · inscrit le {format(parseISO(d.created_at), "dd MMM yyyy", { locale: fr })}</span>
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-success">{fmt(paid)}</p>
                    <p className="text-[11px] text-muted-foreground">encaissé</p>
                  </div>

                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                </button>

                {/* Expanded: full DossierPayments */}
                {isOpen && (
                  <div className="border-t border-border p-4">
                    <DossierPayments dossier={d} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ── Sub-components ── */

const StatCard = ({
  icon: Icon,
  color,
  bg,
  label,
  value,
}: {
  icon: React.ElementType;
  color: string;
  bg: string;
  label: string;
  value: string;
}) => (
  <div className="bg-card rounded-xl border border-border p-4 space-y-3">
    <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
      <Icon className={`w-4 h-4 ${color}`} />
    </div>
    <div>
      <p className="text-lg font-display tracking-wide">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  </div>
);

export default Payments;
