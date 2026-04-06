import { Check, Lock } from "lucide-react";
import RaidersHeader from "@/components/RaidersHeader";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
}

const options = [
  { id: "pere", emoji: "👨", label: "Le père" },
  { id: "mere", emoji: "👩", label: "La mère" },
  { id: "tuteur", emoji: "🤝", label: "Le tuteur légal" },
  { id: "autre", emoji: "👴", label: "Grand-parent / autre" },
];

const ParentProfileScreen = ({ value, onChange, onNext }: Props) => (
  <div className="animate-fade-in-up">
    <RaidersHeader />
    <div className="px-5 py-6 space-y-6">
      <div>
        <h1 className="font-display text-screen-title tracking-wider">BONJOUR ! VOUS ÊTES...</h1>
        <p className="text-screen-subtitle text-muted-foreground mt-1">
          Pour commencer, dites-nous qui vous êtes par rapport à l'enfant
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`relative flex flex-col items-center gap-2 p-5 rounded-lg border-[1.5px] transition-all text-center ${
              value === opt.id
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:border-primary/30"
            }`}
          >
            {value === opt.id && (
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-3 h-3 text-primary-foreground" />
              </div>
            )}
            <span className="text-3xl">{opt.emoji}</span>
            <span className="text-body font-medium">{opt.label}</span>
          </button>
        ))}
      </div>

      <button
        onClick={onNext}
        disabled={!value}
        className="w-full h-[52px] bg-primary hover:bg-primary-dark text-primary-foreground font-semibold rounded-lg text-body transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Continuer
      </button>

      <p className="text-hint text-muted-foreground text-center flex items-center justify-center gap-1">
        <Lock className="w-3 h-3" />
        Vos informations sont sécurisées et confidentielles
      </p>
    </div>
  </div>
);

export default ParentProfileScreen;
