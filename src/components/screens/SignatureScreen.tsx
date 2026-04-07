import { Check } from "lucide-react";

interface SignatureData {
  nom: string;
  date: string;
  agreed: boolean;
}

interface Props {
  data: SignatureData;
  onChange: (d: Partial<SignatureData>) => void;
  onSubmit: () => void;
  submitting?: boolean;
  error?: string | null;
  parentNom?: string;
}

const ENGAGEMENTS_ACADEMIE = [
  "L'inscription à RAIDERS ACADEMY SCHOOL garantit à votre enfant un accès complet à nos programmes sportifs et éducatifs.",
  "Nous nous engageons à fournir un suivi personnalisé pour assurer le développement académique et sportif de chaque élève.",
];

const ENGAGEMENTS_PARENT = [
  "Le parent/tuteur s'engage à respecter les modalités de paiement mentionnées.",
  "Le parent/tuteur s'engage à soutenir l'enfant dans son développement sportif et scolaire, en collaborant avec l'académie pour garantir une expérience réussie.",
];

const SignatureScreen = ({ data, onChange, onSubmit, submitting = false, error = null, parentNom = "" }: Props) => {
  const today = new Date().toISOString().split("T")[0];
  const canSubmit = data.agreed && !submitting;

  // Auto-fill nom + date from parent info on first render
  if (parentNom && !data.nom) onChange({ nom: parentNom, date: today });

  return (
    <div className="px-5 py-6 space-y-6 animate-fade-in-up">

      {/* Engagement académie */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-2.5 bg-secondary border-b border-border">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
            Engagement de l'académie
          </p>
        </div>
        <ul className="divide-y divide-border">
          {ENGAGEMENTS_ACADEMIE.map((txt) => (
            <li key={txt} className="flex gap-3 px-4 py-3 text-sm text-muted-foreground">
              <span className="text-primary mt-0.5 shrink-0">•</span>
              <span>{txt}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Engagement parent */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-2.5 bg-secondary border-b border-border">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
            Engagement des parents / tuteurs
          </p>
        </div>
        <ul className="divide-y divide-border">
          {ENGAGEMENTS_PARENT.map((txt) => (
            <li key={txt} className="flex gap-3 px-4 py-3 text-sm text-muted-foreground">
              <span className="text-primary mt-0.5 shrink-0">•</span>
              <span>{txt}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Signataire */}
      <div>
        <label className="text-label uppercase text-muted-foreground block mb-1.5">
          Nom du signataire
        </label>
        <input
          type="text"
          value={parentNom || data.nom}
          disabled
          className="w-full h-11 px-3 rounded-lg border-[1.5px] border-border bg-secondary text-body text-muted-foreground cursor-not-allowed select-none"
        />
        <p className="text-xs text-muted-foreground mt-1">Pré-rempli depuis les informations du tuteur</p>
      </div>

      {/* Agreement checkbox */}
      <button
        type="button"
        onClick={() => onChange({ agreed: !data.agreed })}
        className="flex items-start gap-3 w-full text-left"
      >
        <div
          className={`w-5 h-5 rounded border-[1.5px] flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
            data.agreed ? "bg-primary border-primary" : "border-border"
          }`}
        >
          {data.agreed && <Check className="w-3 h-3 text-primary-foreground" />}
        </div>
        <span className="text-hint text-muted-foreground leading-relaxed">
          J'ai lu et j'accepte les engagements ci-dessus. Je m'engage à respecter les modalités de paiement.
        </span>
      </button>

      {/* Date — à la fin, grisée */}
      <div>
        <label className="text-label uppercase text-muted-foreground block mb-1.5">
          Date de signature
        </label>
        <input
          type="date"
          value={data.date || today}
          disabled
          className="w-full h-11 px-3 rounded-lg border-[1.5px] border-border bg-secondary text-body text-muted-foreground cursor-not-allowed select-none"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        className="w-full h-[52px] bg-primary hover:bg-primary-dark text-primary-foreground font-semibold rounded-xl text-sm tracking-wide transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Envoi en cours...
          </>
        ) : (
          "SOUMETTRE LE DOSSIER"
        )}
      </button>
    </div>
  );
};

export default SignatureScreen;
