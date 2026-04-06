import { MapPin, Phone, Calendar } from "lucide-react";
import RaidersHeader from "@/components/RaidersHeader";

interface Props {
  onNext: () => void;
}

const WelcomeScreen = ({ onNext }: Props) => (
  <div className="animate-fade-in-up">
    <RaidersHeader />
    <div className="px-5 py-8 space-y-8 text-center">
      <div>
        <h1 className="font-display text-screen-title tracking-wider leading-tight">
          BIENVENUE À<br />RAIDERS ACADEMY
        </h1>
        <p className="text-screen-subtitle text-muted-foreground mt-2">
          Inscrivez votre enfant et rejoignez la famille Raiders
        </p>
      </div>

      {/* Basketball illustration */}
      <div className="flex justify-center">
        <div className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center text-6xl">
          🏀
        </div>
      </div>

      {/* Info bloc */}
      <div className="bg-card rounded-lg border border-border p-4 space-y-3 text-left text-body">
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-primary shrink-0" />
          <span>Saison 2024-2025</span>
        </div>
        <div className="flex items-center gap-3">
          <MapPin className="w-4 h-4 text-primary shrink-0" />
          <span>Dixinn Stade 28, Conakry</span>
        </div>
        <div className="flex items-center gap-3">
          <Phone className="w-4 h-4 text-primary shrink-0" />
          <span>+224 612 20 43 43</span>
        </div>
      </div>

      <button
        onClick={onNext}
        className="w-full h-[52px] bg-primary hover:bg-primary-dark text-primary-foreground font-semibold rounded-lg text-body transition-colors"
      >
        COMMENCER L'INSCRIPTION →
      </button>

      <p className="text-hint text-muted-foreground">
        Durée estimée : 5 à 8 minutes · Gratuit
      </p>
    </div>
  </div>
);

export default WelcomeScreen;
