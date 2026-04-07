import { Mail, Phone, ChevronRight, Landmark } from "lucide-react";
import raidersLogo from "@/assets/raiders-logo.png";

interface Props {
  onNext: () => void;
}

const INFO_ROWS = [
  { icon: Landmark, text: "Dixinn Stade 28, Conakry" },
  { icon: Phone,    text: "+224 612 20 43 43" },
  { icon: Mail,     text: "raidersacademyschool@gmail.com" },
];

const WelcomeScreen = ({ onNext }: Props) => (
  <div className="h-screen overflow-hidden flex flex-col animate-fade-in-up">

    {/* ── Hero ── */}
    <div className="relative bg-foreground flex-shrink-0 overflow-hidden">
      {/* Diagonal stripes */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg,transparent,transparent 12px,white 12px,white 13px)",
        }}
      />
      {/* Left accent */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />

      <div className="relative flex flex-col items-center text-center px-6 pt-8 pb-7">
        {/* Season badge */}
        <span className="inline-block bg-primary/20 text-primary border border-primary/30 rounded-full text-[11px] font-semibold tracking-widest uppercase px-3 py-1 mb-5">
          Saison 2024–2025
        </span>

        {/* Logo on white card */}
        <div className="bg-white rounded-2xl px-6 py-3 mb-5 shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
          <img
            src={raidersLogo}
            alt="Raiders Academy"
            className="h-20 w-auto object-contain"
          />
        </div>

        {/* Title */}
        <h1 className="font-display text-[2.7rem] leading-none tracking-wider text-white">
          RAIDERS<br />ACADEMY
        </h1>
        <p className="mt-3 text-sm text-white/55 leading-relaxed max-w-[250px]">
          Inscrivez votre enfant et rejoignez la meilleure école de basketball de Conakry
        </p>
      </div>
    </div>

    {/* ── Info rows — edge to edge ── */}
    <div className="flex-1 flex flex-col border-t border-b border-border divide-y divide-border bg-card">
      {INFO_ROWS.map(({ icon: Icon, text }) => (
        <div key={text} className="flex items-center gap-4 px-5 flex-1">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm">{text}</span>
        </div>
      ))}
    </div>

    {/* ── CTA ── */}
    <div className="px-5 py-5 space-y-2 bg-background">
      <button
        onClick={onNext}
        className="w-full h-[54px] bg-primary hover:bg-primary-dark text-primary-foreground font-semibold rounded-xl text-sm tracking-wide transition-colors flex items-center justify-center gap-2 shadow-md shadow-primary/20"
      >
        COMMENCER L'INSCRIPTION
        <ChevronRight className="w-4 h-4" />
      </button>
      <p className="text-center text-[11px] text-muted-foreground">
        Durée estimée : 5 à 8 minutes · Entièrement gratuit
      </p>
    </div>

  </div>
);

export default WelcomeScreen;
