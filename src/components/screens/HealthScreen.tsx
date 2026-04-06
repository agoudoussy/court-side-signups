import { ShieldCheck, Upload } from "lucide-react";

interface HealthData {
  hasHealthIssues: boolean;
  healthDetails: string;
  hasTreatment: boolean;
  treatmentDetails: string;
  certificat: File | null;
  telMedecin: string;
}

interface Props {
  data: HealthData;
  onChange: (d: Partial<HealthData>) => void;
}

const Toggle = ({ label, value, onToggle }: { label: string; value: boolean; onToggle: () => void }) => (
  <button
    type="button"
    onClick={onToggle}
    className="w-full flex items-center justify-between h-12 px-4 rounded-lg border-[1.5px] border-border bg-card"
  >
    <span className="text-body">{label}</span>
    <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${value ? 'bg-primary' : 'bg-border'}`}>
      <div className={`w-5 h-5 rounded-full bg-card shadow transition-transform ${value ? 'translate-x-5' : ''}`} />
    </div>
  </button>
);

const HealthScreen = ({ data, onChange }: Props) => (
  <div className="px-5 py-6 space-y-5 animate-fade-in-up">
    <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
      <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
      <p className="text-hint text-muted-foreground">
        Ces informations sont strictement confidentielles et utilisées uniquement pour la sécurité de votre enfant.
      </p>
    </div>

    <Toggle
      label="Problèmes de santé connus ?"
      value={data.hasHealthIssues}
      onToggle={() => onChange({ hasHealthIssues: !data.hasHealthIssues })}
    />
    {data.hasHealthIssues && (
      <textarea
        value={data.healthDetails}
        onChange={(e) => onChange({ healthDetails: e.target.value })}
        placeholder="Décrivez les problèmes de santé..."
        rows={3}
        className="w-full px-3 py-2 rounded-lg border-[1.5px] border-border bg-card text-body focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary resize-none"
      />
    )}

    <Toggle
      label="Traitement en cours ?"
      value={data.hasTreatment}
      onToggle={() => onChange({ hasTreatment: !data.hasTreatment })}
    />
    {data.hasTreatment && (
      <input
        value={data.treatmentDetails}
        onChange={(e) => onChange({ treatmentDetails: e.target.value })}
        placeholder="Nom du traitement"
        className="w-full h-11 px-3 rounded-lg border-[1.5px] border-border bg-card text-body focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary"
      />
    )}

    <div>
      <label className="text-label uppercase text-muted-foreground block mb-1.5">
        Certificat médical (obligatoire)
      </label>
      <label className="flex items-center justify-center gap-2 h-14 rounded-lg border-[1.5px] border-dashed border-border bg-card cursor-pointer hover:border-primary/40 transition-colors text-body text-muted-foreground">
        <Upload className="w-4 h-4" />
        {data.certificat ? data.certificat.name : "PDF ou photo, moins de 3 mois"}
        <input
          type="file"
          accept=".pdf,image/*"
          className="hidden"
          onChange={(e) => onChange({ certificat: e.target.files?.[0] || null })}
        />
      </label>
    </div>

    <div>
      <label className="text-label uppercase text-muted-foreground block mb-1.5">
        Téléphone médecin (optionnel)
      </label>
      <input
        type="tel"
        value={data.telMedecin}
        onChange={(e) => onChange({ telMedecin: e.target.value })}
        placeholder="+224 6XX XX XX XX"
        className="w-full h-11 px-3 rounded-lg border-[1.5px] border-border bg-card text-body focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary"
      />
    </div>
  </div>
);

export default HealthScreen;
