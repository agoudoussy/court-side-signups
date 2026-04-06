import { getAgeCategory } from "@/lib/categories";
import { Camera } from "lucide-react";

interface ChildData {
  nom: string;
  prenom: string;
  dateNaissance: string;
  genre: string;
  photo: File | null;
  ecole: string;
  tailleMaillot: string;
  niveau: string;
}

interface Props {
  data: ChildData;
  onChange: (d: Partial<ChildData>) => void;
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

const ChildInfoScreen = ({ data, onChange }: Props) => {
  const catInfo = getAgeCategory(data.dateNaissance);

  return (
    <div className="px-5 py-6 space-y-5 animate-fade-in-up">
      <InputField
        label="Nom de famille"
        value={data.nom}
        onChange={(e) => onChange({ nom: e.target.value.toUpperCase() })}
        placeholder="DIALLO"
      />
      <InputField
        label="Prénom"
        value={data.prenom}
        onChange={(e) => onChange({ prenom: e.target.value })}
        placeholder="Mamadou"
      />
      <div>
        <label className="text-label uppercase text-muted-foreground block mb-1.5">Date de naissance</label>
        <input
          type="date"
          value={data.dateNaissance}
          onChange={(e) => onChange({ dateNaissance: e.target.value })}
          className="w-full h-11 px-3 rounded-lg border-[1.5px] border-border bg-card text-body focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-colors"
        />
        {catInfo && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-hint text-muted-foreground">{catInfo.age} ans</span>
            <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-hint font-semibold">
              {catInfo.category}
            </span>
          </div>
        )}
      </div>

      <div>
        <label className="text-label uppercase text-muted-foreground block mb-1.5">Genre</label>
        <div className="grid grid-cols-2 gap-3">
          {["Garçon", "Fille"].map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => onChange({ genre: g })}
              className={`h-11 rounded-lg border-[1.5px] text-body font-medium transition-all ${
                data.genre === g ? "border-primary bg-primary/5" : "border-border bg-card"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-label uppercase text-muted-foreground block mb-1.5">Photo de l'enfant</label>
        <label className="flex items-center justify-center gap-2 h-11 rounded-lg border-[1.5px] border-dashed border-border bg-card cursor-pointer hover:border-primary/40 transition-colors text-body text-muted-foreground">
          <Camera className="w-4 h-4" />
          {data.photo ? data.photo.name : "Ajouter une photo"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onChange({ photo: e.target.files?.[0] || null })}
          />
        </label>
      </div>

      <InputField
        label="École (optionnel)"
        value={data.ecole}
        onChange={(e) => onChange({ ecole: e.target.value })}
        placeholder="Nom de l'école"
      />

      <div>
        <label className="text-label uppercase text-muted-foreground block mb-1.5">Taille maillot</label>
        <div className="flex gap-2">
          {["XS", "S", "M", "L", "XL"].map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => onChange({ tailleMaillot: size })}
              className={`flex-1 h-10 rounded-lg border-[1.5px] text-hint font-semibold transition-all ${
                data.tailleMaillot === size ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-label uppercase text-muted-foreground block mb-1.5">Niveau basket</label>
        <div className="space-y-2">
          {["Débutant", "Intermédiaire", "Compétition"].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange({ niveau: n })}
              className={`w-full h-11 rounded-lg border-[1.5px] text-body font-medium transition-all text-left px-4 ${
                data.niveau === n ? "border-primary bg-primary/5" : "border-border bg-card"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChildInfoScreen;
