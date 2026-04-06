import { useState, useCallback } from "react";
import WelcomeScreen from "@/components/screens/WelcomeScreen";
import ParentProfileScreen from "@/components/screens/ParentProfileScreen";
import ChildInfoScreen from "@/components/screens/ChildInfoScreen";
import HealthScreen from "@/components/screens/HealthScreen";
import ParentInfoScreen from "@/components/screens/ParentInfoScreen";
import SlotScreen from "@/components/screens/SlotScreen";
import PaymentScreen from "@/components/screens/PaymentScreen";
import ConfirmationScreen from "@/components/screens/ConfirmationScreen";
import RaidersHeader from "@/components/RaidersHeader";
import StepIndicator from "@/components/StepIndicator";
import { getAgeCategory } from "@/lib/categories";
import { ArrowLeft } from "lucide-react";

const STEP_TITLES = ["INFORMATIONS ENFANT", "SANTÉ & MÉDICAL", "INFORMATIONS PARENT", "CHOIX DU CRÉNEAU", "PAIEMENT & SIGNATURE"];

const Index = () => {
  const [screen, setScreen] = useState(0);
  const [parentRole, setParentRole] = useState("");

  const [child, setChild] = useState({
    nom: "", prenom: "", dateNaissance: "", genre: "", photo: null as File | null,
    ecole: "", tailleMaillot: "", niveau: "",
  });

  const [health, setHealth] = useState({
    hasHealthIssues: false, healthDetails: "", hasTreatment: false,
    treatmentDetails: "", certificat: null as File | null, telMedecin: "",
  });

  const [parent, setParent] = useState({
    lien: "", nom: "", prenom: "", telephone: "", email: "",
    adresse: "", nomUrgence: "", telUrgence: "",
  });

  const [selectedSlot, setSelectedSlot] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [dossierNumber, setDossierNumber] = useState("");

  const catInfo = getAgeCategory(child.dateNaissance);

  const goNext = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (screen === 1) {
      setParent((p) => ({ ...p, lien: parentRole }));
    }
    if (screen === 7) return;
    setScreen((s) => s + 1);
  }, [screen, parentRole]);

  const goBack = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setScreen((s) => Math.max(0, s - 1));
  }, []);

  const handleSubmit = () => {
    const num = `RAS-2025-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;
    setDossierNumber(num);
    setScreen(7);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Stepper screens (2-6 → steps 1-5)
  const stepIndex = screen - 2; // 0-4
  const isStepperScreen = screen >= 2 && screen <= 6;

  const canContinueStep = () => {
    switch (stepIndex) {
      case 0: return child.nom && child.prenom && child.dateNaissance && child.genre && child.tailleMaillot && child.niveau;
      case 1: return !!health.certificat || true; // relaxed for demo
      case 2: return parent.nom && parent.prenom && parent.telephone;
      case 3: return !!selectedSlot;
      default: return true;
    }
  };

  return (
    <div className="min-h-screen bg-secondary flex justify-center">
      <div className="w-full max-w-[480px] bg-background min-h-screen shadow-lg">
        {screen === 0 && <WelcomeScreen onNext={goNext} />}

        {screen === 1 && (
          <ParentProfileScreen value={parentRole} onChange={setParentRole} onNext={goNext} />
        )}

        {isStepperScreen && (
          <>
            <RaidersHeader />
            <StepIndicator currentStep={stepIndex + 1} totalSteps={5} title={STEP_TITLES[stepIndex]} />

            {stepIndex > 0 && (
              <button onClick={goBack} className="flex items-center gap-1 px-5 pt-4 text-hint text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
            )}

            {stepIndex === 0 && <ChildInfoScreen data={child} onChange={(d) => setChild((c) => ({ ...c, ...d }))} />}
            {stepIndex === 1 && <HealthScreen data={health} onChange={(d) => setHealth((h) => ({ ...h, ...d }))} />}
            {stepIndex === 2 && <ParentInfoScreen data={parent} onChange={(d) => setParent((p) => ({ ...p, ...d }))} />}
            {stepIndex === 3 && <SlotScreen category={catInfo?.category || ""} selectedSlot={selectedSlot} onChange={setSelectedSlot} />}
            {stepIndex === 4 && <PaymentScreen paymentMethod={paymentMethod} onChangePayment={setPaymentMethod} onSubmit={handleSubmit} />}

            {stepIndex < 4 && (
              <div className="px-5 pb-8">
                <button
                  onClick={goNext}
                  disabled={!canContinueStep()}
                  className="w-full h-[52px] bg-primary hover:bg-primary-dark text-primary-foreground font-semibold rounded-lg text-body transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continuer
                </button>
              </div>
            )}
          </>
        )}

        {screen === 7 && <ConfirmationScreen prenom={child.prenom} dossierNumber={dossierNumber} />}
      </div>
    </div>
  );
};

export default Index;
