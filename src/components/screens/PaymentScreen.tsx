import { useConfig } from "@/hooks/use-config";

interface Props {
  paymentMethod: string;
  paymentOther: string;
  onChangeMethod: (m: string) => void;
  onChangeOther: (v: string) => void;
}

const ALL_METHODS = [
  { id: "virement", label: "Virement bancaire" },
  { id: "especes",  label: "Paiement en espèces" },
  { id: "cheque",   label: "Chèque" },
  { id: "orange",   label: "Orange Money" },
  { id: "autre",    label: "Autre" },
];

const fmt = (n: number) => n.toLocaleString("fr-FR") + " GNF";

const PaymentScreen = ({ paymentMethod, paymentOther, onChangeMethod, onChangeOther }: Props) => {
  const { config, isLoading } = useConfig();
  const methods = ALL_METHODS.filter((m) => config.paymentMethods.includes(m.id));

  return (
    <div className="px-5 py-6 space-y-6 animate-fade-in-up">

      {/* Cost summary */}
      <div className="rounded-xl bg-foreground text-primary-foreground overflow-hidden">
        <div className="px-4 py-2.5 border-b border-white/10">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-white/50">
            Détail des frais
          </p>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            <div className="flex justify-between items-center px-4 py-3 text-sm">
              <span className="text-white/70">Frais d'inscription</span>
              <span className="font-semibold">{fmt(config.fraisInscription)}</span>
            </div>
            <div className="flex justify-between items-center px-4 py-3 text-sm">
              <div>
                <p className="text-white/70">Mensualité</p>
                <p className="text-[11px] text-white/40">Maillot + T-shirt inclus</p>
              </div>
              <span className="font-semibold">{fmt(config.mensualite)}</span>
            </div>
            <div className="flex justify-between items-center px-4 py-3 text-sm bg-white/5">
              <span className="font-semibold">Total à payer</span>
              <span className="font-bold text-base text-primary">{fmt(config.total)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Payment method */}
      <div>
        <label className="text-label uppercase text-muted-foreground block mb-3">
          Méthode de paiement
        </label>
        <div className="space-y-2">
          {methods.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onChangeMethod(m.id)}
              className={`w-full flex items-center gap-3 h-11 px-4 rounded-lg border-[1.5px] text-body text-left transition-all ${
                paymentMethod === m.id
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                paymentMethod === m.id ? "border-primary" : "border-muted-foreground/40"
              }`}>
                {paymentMethod === m.id && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
              <span className={paymentMethod === m.id ? "font-medium" : ""}>{m.label}</span>
            </button>
          ))}
        </div>

        {paymentMethod === "autre" && (
          <div className="mt-3">
            <input
              type="text"
              value={paymentOther}
              onChange={(e) => onChangeOther(e.target.value)}
              placeholder="Précisez la méthode..."
              className="w-full h-11 px-3 rounded-lg border-[1.5px] border-border bg-card text-body focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-colors"
            />
          </div>
        )}
      </div>

    </div>
  );
};

export default PaymentScreen;
