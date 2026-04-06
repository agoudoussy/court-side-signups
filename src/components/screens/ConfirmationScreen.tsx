import { CheckCircle, Download } from "lucide-react";
import RaidersHeader from "@/components/RaidersHeader";

interface Props {
  prenom: string;
  dossierNumber: string;
}

const ConfirmationScreen = ({ prenom, dossierNumber }: Props) => (
  <div className="animate-fade-in-up">
    <RaidersHeader />
    <div className="px-5 py-8 space-y-6 text-center">
      <div className="flex justify-center">
        <CheckCircle className="w-20 h-20 text-success animate-scale-check" />
      </div>

      <div>
        <h1 className="font-display text-screen-title tracking-wider">INSCRIPTION ENVOYÉE !</h1>
        <p className="text-screen-subtitle text-muted-foreground mt-2">
          Le dossier de <strong>{prenom || "votre enfant"}</strong> a été soumis avec succès
        </p>
      </div>

      <div className="bg-foreground text-primary-foreground rounded-lg p-4 space-y-2">
        <p className="text-label uppercase tracking-wider opacity-60">Numéro de dossier</p>
        <p className="text-xl font-display tracking-widest">{dossierNumber}</p>
        <p className="text-hint opacity-60">Un SMS de confirmation vous sera envoyé</p>
      </div>

      <div className="bg-card rounded-lg border border-border p-4 text-left space-y-3">
        <p className="text-label uppercase text-primary font-semibold">Prochaines étapes</p>
        <div className="space-y-2 text-body">
          <p>✅ Validation du dossier sous 24-48h</p>
          <p>👕 Remise du maillot au premier entraînement</p>
          <p>🏀 1er entraînement : date communiquée par SMS</p>
        </div>
      </div>

      <button className="w-full h-[52px] bg-primary hover:bg-primary-dark text-primary-foreground font-semibold rounded-lg text-body transition-colors flex items-center justify-center gap-2">
        <Download className="w-5 h-5" />
        Télécharger mon reçu PDF
      </button>
    </div>
  </div>
);

export default ConfirmationScreen;
