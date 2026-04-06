interface ParentData {
  lien: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  adresse: string;
  nomUrgence: string;
  telUrgence: string;
}

interface Props {
  data: ParentData;
  onChange: (d: Partial<ParentData>) => void;
}

const InputField = ({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div>
    <label className="text-label uppercase text-muted-foreground block mb-1.5">{label}</label>
    <input
      {...props}
      className="w-full h-11 px-3 rounded-lg border-[1.5px] border-border bg-card text-body focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-colors"
    />
  </div>
);

const LIEN_LABELS: Record<string, string> = {
  pere: "Père",
  mere: "Mère",
  tuteur: "Tuteur légal",
  autre: "Grand-parent / autre",
};

const ParentInfoScreen = ({ data, onChange }: Props) => (
  <div className="px-5 py-6 space-y-5 animate-fade-in-up">
    <div>
      <label className="text-label uppercase text-muted-foreground block mb-1.5">Lien avec l'enfant</label>
      <div className="h-11 px-3 rounded-lg border-[1.5px] border-border bg-secondary flex items-center text-body text-muted-foreground">
        {LIEN_LABELS[data.lien] || data.lien}
      </div>
    </div>

    <InputField label="Nom" value={data.nom} onChange={(e) => onChange({ nom: e.target.value })} placeholder="DIALLO" />
    <InputField label="Prénom" value={data.prenom} onChange={(e) => onChange({ prenom: e.target.value })} placeholder="Fatoumata" />
    <InputField label="Téléphone" type="tel" value={data.telephone} onChange={(e) => onChange({ telephone: e.target.value })} placeholder="+224 6XX XX XX XX" />
    <InputField label="Email" type="email" value={data.email} onChange={(e) => onChange({ email: e.target.value })} placeholder="email@exemple.com" />
    <InputField label="Adresse / Quartier" value={data.adresse} onChange={(e) => onChange({ adresse: e.target.value })} placeholder="Dixinn, Conakry" />

    <div className="pt-2 border-t border-border">
      <p className="text-label uppercase text-primary font-semibold mb-4">Contact d'urgence</p>
      <div className="space-y-5">
        <InputField label="Nom du contact" value={data.nomUrgence} onChange={(e) => onChange({ nomUrgence: e.target.value })} placeholder="Nom complet" />
        <InputField label="Téléphone urgence" type="tel" value={data.telUrgence} onChange={(e) => onChange({ telUrgence: e.target.value })} placeholder="+224 6XX XX XX XX" />
      </div>
    </div>
  </div>
);

export default ParentInfoScreen;
