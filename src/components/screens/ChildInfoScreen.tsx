import { useRef, useState } from "react";
import { Camera, X, AlertTriangle, CheckCircle } from "lucide-react";

interface ChildData {
  nom: string;
  prenom: string;
  dateNaissance: string;
  genre: string;
  adresse: string;
  telephone: string;
  hasAllergy: boolean;
  allergyDetails: string;
}

interface Props {
  data: ChildData;
  onChange: (d: Partial<ChildData>) => void;
  photo: File | null;
  onPhotoChange: (file: File | null) => void;
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

function calcAge(dateStr: string): number | null {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  const age = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  return age >= 0 ? age : null;
}

const ChildInfoScreen = ({ data, onChange, photo, onPhotoChange }: Props) => {
  const age = calcAge(data.dateNaissance);
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    onPhotoChange(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const removePhoto = () => {
    onPhotoChange(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="px-5 py-6 space-y-5 animate-fade-in-up">

      {/* Photo de l'enfant */}
      <div>
        <label className="text-label uppercase text-muted-foreground block mb-1.5">
          Photo de l'enfant <span className="text-muted-foreground/50 normal-case">(optionnel)</span>
        </label>
        <div className="flex items-center gap-4">
          {preview ? (
            <div className="relative shrink-0">
              <img
                src={preview}
                alt="Photo enfant"
                className="w-20 h-20 rounded-xl object-cover border-2 border-primary/20"
              />
              <button
                type="button"
                onClick={removePhoto}
                className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center shadow-sm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="w-20 h-20 rounded-xl border-[1.5px] border-dashed border-border bg-card flex items-center justify-center shrink-0">
              <Camera className="w-7 h-7 text-muted-foreground/40" />
            </div>
          )}
          <div className="flex-1">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full h-10 rounded-lg border-[1.5px] border-border bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
            >
              {photo ? "Changer la photo" : "Choisir une photo"}
            </button>
            <p className="text-xs text-muted-foreground mt-1.5">JPG, PNG · max 5 Mo</p>
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handlePhoto}
        />
      </div>

      <InputField
        label="Nom de l'enfant"
        value={data.nom}
        onChange={(e) => onChange({ nom: e.target.value.toUpperCase() })}
        placeholder="DIALLO"
      />
      <InputField
        label="Prénom de l'enfant"
        value={data.prenom}
        onChange={(e) => onChange({ prenom: e.target.value })}
        placeholder="Mamadou"
      />

      <div>
        <label className="text-label uppercase text-muted-foreground block mb-1.5">
          Date de naissance
        </label>
        <input
          type="date"
          value={data.dateNaissance}
          onChange={(e) => onChange({ dateNaissance: e.target.value })}
          className="w-full h-11 px-3 rounded-lg border-[1.5px] border-border bg-card text-body focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-colors"
        />
        {age !== null && (
          <p className="mt-2 text-hint text-muted-foreground">
            Âge : <span className="font-semibold text-foreground">{age} ans</span>
          </p>
        )}
      </div>

      <div>
        <label className="text-label uppercase text-muted-foreground block mb-1.5">Genre</label>
        <div className="grid grid-cols-2 gap-3">
          {["Masculin", "Féminin"].map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => onChange({ genre: g })}
              className={`h-11 rounded-lg border-[1.5px] text-body font-medium transition-all ${
                data.genre === g
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <InputField
        label="Adresse"
        value={data.adresse}
        onChange={(e) => onChange({ adresse: e.target.value })}
        placeholder="Quartier, Commune, Conakry"
      />
      <InputField
        label="Téléphone"
        type="tel"
        value={data.telephone}
        onChange={(e) => onChange({ telephone: e.target.value })}
        placeholder="+224 6XX XX XX XX"
      />

      {/* Allergies */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 bg-secondary border-b border-border flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-warning" />
          <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
            Informations médicales
          </p>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            L'enfant est-il sujet à des <strong className="text-foreground">allergies</strong> ou a-t-il des <strong className="text-foreground">contre-indications médicales</strong> ?
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { val: false, label: "Non", icon: CheckCircle, color: "text-success" },
              { val: true,  label: "Oui", icon: AlertTriangle, color: "text-warning" },
            ].map(({ val, label, icon: Icon, color }) => (
              <button
                key={label}
                type="button"
                onClick={() => onChange({ hasAllergy: val, allergyDetails: val ? data.allergyDetails : "" })}
                className={`flex items-center justify-center gap-2 h-10 rounded-lg border-[1.5px] text-sm font-medium transition-all ${
                  data.hasAllergy === val
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                <Icon className={`w-4 h-4 ${data.hasAllergy === val ? "text-primary" : color}`} />
                {label}
              </button>
            ))}
          </div>

          {data.hasAllergy && (
            <div className="animate-fade-in-up">
              <label className="text-label uppercase text-muted-foreground block mb-1.5">
                Précisez les allergies / contre-indications
              </label>
              <textarea
                value={data.allergyDetails}
                onChange={(e) => onChange({ allergyDetails: e.target.value })}
                placeholder="Ex: allergie aux arachides, asthme, intolérance au lactose..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-lg border-[1.5px] border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-colors resize-none"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChildInfoScreen;
