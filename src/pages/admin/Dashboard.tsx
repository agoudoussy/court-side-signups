import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Users, Clock, CheckCircle, XCircle, TrendingUp, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { format, parseISO, subMonths, startOfMonth } from "date-fns";
import { fr } from "date-fns/locale";

interface Dossier {
  id: string;
  created_at: string;
  dossier_number: string;
  status: "en_attente" | "valide" | "refuse";
  child_nom: string;
  child_prenom: string;
  child_date_naissance: string;
  child_genre: string;
  parent_nom: string;
  parent_telephone: string;
  payment_method: string;
}

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

const GENRE_COLORS = ["hsl(var(--primary))", "hsl(var(--primary-light))"];

const Dashboard = () => {
  const navigate = useNavigate();
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

  const stats = useMemo(() => ({
    total: dossiers.length,
    enAttente: dossiers.filter((d) => d.status === "en_attente").length,
    valides: dossiers.filter((d) => d.status === "valide").length,
    refuses: dossiers.filter((d) => d.status === "refuse").length,
  }), [dossiers]);

  const genreData = useMemo(() => [
    { name: "Masculin", value: dossiers.filter((d) => d.child_genre === "Masculin").length },
    { name: "Féminin", value: dossiers.filter((d) => d.child_genre === "Féminin").length },
  ], [dossiers]);

  const monthlyData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i);
      const monthStart = startOfMonth(date);
      const monthEnd = startOfMonth(subMonths(date, -1));
      const count = dossiers.filter((d) => {
        const created = parseISO(d.created_at);
        return created >= monthStart && created < monthEnd;
      }).length;
      return { month: format(date, "MMM", { locale: fr }), count };
    });
  }, [dossiers]);

  const recent = dossiers.slice(0, 5);

  const STAT_CARDS = [
    { label: "Total inscrits", value: stats.total, icon: Users, color: "text-primary", bg: "bg-primary/10" },
    { label: "En attente", value: stats.enAttente, icon: Clock, color: "text-warning", bg: "bg-warning/10" },
    { label: "Validés", value: stats.valides, icon: CheckCircle, color: "text-success", bg: "bg-success/10" },
    { label: "Refusés", value: stats.refuses, icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl tracking-wider">DASHBOARD</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Vue d'ensemble des inscriptions</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-card rounded-xl border border-border p-4 space-y-3">
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
              <Icon className={`w-4.5 h-4.5 ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-display tracking-wide">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar chart — inscriptions par mois */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">Inscriptions par mois</h2>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyData} barSize={28}>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                width={24}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                cursor={{ fill: "hsl(var(--muted))" }}
              />
              <Bar
                dataKey="count"
                name="Inscrits"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart — genre */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold mb-4">Répartition genre</h2>
          {genreData.every((d) => d.value === 0) ? (
            <div className="flex items-center justify-center h-[180px] text-sm text-muted-foreground">
              Aucune donnée
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={genreData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {genreData.map((_, i) => (
                    <Cell key={i} fill={GENRE_COLORS[i]} />
                  ))}
                </Pie>
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: "12px" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent registrations */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold">Inscriptions récentes</h2>
          <button
            onClick={() => navigate("/admin/dossiers")}
            className="text-xs text-primary hover:underline"
          >
            Voir tout →
          </button>
        </div>
        {recent.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">Aucun dossier pour l'instant</p>
        ) : (
          <div className="divide-y divide-border">
            {recent.map((d) => (
              <button
                key={d.id}
                onClick={() => navigate(`/admin/dossiers?open=${d.id}`)}
                className="w-full flex items-center gap-4 px-5 py-3 hover:bg-secondary/50 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {d.child_prenom} {d.child_nom}
                  </p>
                  <p className="text-xs text-muted-foreground">{d.parent_nom} · {d.dossier_number}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 ${STATUS_COLORS[d.status]}`}>
                  {STATUS_LABELS[d.status]}
                </span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {format(parseISO(d.created_at), "dd MMM", { locale: fr })}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
