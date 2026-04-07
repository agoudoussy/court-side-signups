interface ParentData {
  email: string;
  nom: string;
  telephone: string;
}

interface Props {
  data: ParentData;
  onChange: (d: Partial<ParentData>) => void;
}

const InputField = ({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div>
    <label className="text-label uppercase text-muted-foreground block mb-1.5">{label}</label>
    <input
      {...props}
      className="w-full h-11 px-3 rounded-lg border-[1.5px] border-border bg-card text-body focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-colors"
    />
  </div>
);

const ParentInfoScreen = ({ data, onChange }: Props) => (
  <div className="px-5 py-6 space-y-5 animate-fade-in-up">
    <InputField
      label="Email des parents / tuteurs"
      type="email"
      value={data.email}
      onChange={(e) => onChange({ email: e.target.value })}
      placeholder="exemple@gmail.com"
    />
    <InputField
      label="Nom du parent / tuteur"
      value={data.nom}
      onChange={(e) => onChange({ nom: e.target.value.toUpperCase() })}
      placeholder="DIALLO"
    />
    <InputField
      label="Téléphone du parent / tuteur"
      type="tel"
      value={data.telephone}
      onChange={(e) => onChange({ telephone: e.target.value })}
      placeholder="+224 6XX XX XX XX"
    />
  </div>
);

export default ParentInfoScreen;
