import { useState, useCallback } from "react";
import WelcomeScreen from "@/components/screens/WelcomeScreen";
import ChildInfoScreen from "@/components/screens/ChildInfoScreen";
import ParentInfoScreen from "@/components/screens/ParentInfoScreen";
import PaymentScreen from "@/components/screens/PaymentScreen";
import SignatureScreen from "@/components/screens/SignatureScreen";
import ConfirmationScreen from "@/components/screens/ConfirmationScreen";
import RaidersHeader from "@/components/RaidersHeader";
import StepIndicator from "@/components/StepIndicator";
import { supabase } from "@/lib/supabase";
import { ArrowLeft } from "lucide-react";

const STEP_TITLES = [
  "INFORMATIONS ENFANT",
  "INFORMATIONS PARENT",
  "PAIEMENT",
  "ENGAGEMENT & SIGNATURE",
];

const Index = () => {
  const [screen, setScreen] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [child, setChild] = useState({
    nom: "", prenom: "", dateNaissance: "", genre: "", adresse: "", telephone: "",
    hasAllergy: false, allergyDetails: "",
  });
  const [childPhoto, setChildPhoto] = useState<File | null>(null);

  const [parent, setParent] = useState({
    email: "", nom: "", telephone: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentOther, setPaymentOther] = useState("");

  const [signature, setSignature] = useState({
    nom: "", date: "", agreed: false,
  });

  const [dossierNumber, setDossierNumber] = useState("");

  const isStepperScreen = screen >= 1 && screen <= 4;
  const stepIndex = screen - 1;

  const canContinue = () => {
    switch (stepIndex) {
      case 0:
        return !!(
          child.nom && child.prenom && child.dateNaissance &&
          child.genre && child.adresse && child.telephone &&
          (!child.hasAllergy || child.allergyDetails.trim())
        );
      case 1:
        return !!(parent.email && parent.nom && parent.telephone);
      case 2:
        return !!(paymentMethod && (paymentMethod !== "autre" || paymentOther.trim()));
      default:
        return true;
    }
  };

  const goNext = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setScreen((s) => s + 1);
  }, []);

  const goBack = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setScreen((s) => Math.max(0, s - 1));
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);

    // Upload photo d'abord avec un nom temporaire (uuid)
    let photoUrl: string | null = null;
    if (childPhoto) {
      const ext = childPhoto.name.split(".").pop();
      const tmpPath = `tmp_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("dossier-photos")
        .upload(tmpPath, childPhoto, { upsert: true });
      if (!uploadError) {
        const { data } = supabase.storage.from("dossier-photos").getPublicUrl(tmpPath);
        photoUrl = data.publicUrl;
      }
    }

    // Le numéro est généré automatiquement par le trigger Supabase (LRAS01, LRAS02…)
    const { data: inserted, error } = await supabase
      .from("dossiers")
      .insert({
        status: "en_attente",
        child_nom: child.nom,
        child_prenom: child.prenom,
        child_date_naissance: child.dateNaissance,
        child_genre: child.genre,
        child_adresse: child.adresse,
        child_telephone: child.telephone,
        child_photo: photoUrl,
        has_allergy: child.hasAllergy,
        allergy_details: child.allergyDetails || null,
        parent_email: parent.email,
        parent_nom: parent.nom,
        parent_telephone: parent.telephone,
        payment_method: paymentMethod,
        payment_other: paymentOther || null,
        signature_nom: signature.nom,
        signature_date: signature.date || new Date().toISOString().split("T")[0],
      })
      .select("dossier_number")
      .single();

    if (error) {
      setSubmitError("Une erreur est survenue. Veuillez réessayer.");
      setSubmitting(false);
      return;
    }

    setDossierNumber(inserted?.dossier_number ?? "");
    setScreen(5);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-secondary flex justify-center">
      <div className="w-full max-w-[480px] bg-background min-h-screen shadow-lg">

        {screen === 0 && <WelcomeScreen onNext={goNext} />}

        {isStepperScreen && (
          <>
            <RaidersHeader />
            <StepIndicator
              currentStep={stepIndex + 1}
              totalSteps={4}
              title={STEP_TITLES[stepIndex]}
            />

            {stepIndex > 0 && (
              <button
                onClick={goBack}
                className="flex items-center gap-1 px-5 pt-4 text-hint text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
            )}

            {stepIndex === 0 && (
              <ChildInfoScreen
                data={child}
                onChange={(d) => setChild((c) => ({ ...c, ...d }))}
                photo={childPhoto}
                onPhotoChange={setChildPhoto}
              />
            )}
            {stepIndex === 1 && (
              <ParentInfoScreen
                data={parent}
                onChange={(d) => setParent((p) => ({ ...p, ...d }))}
              />
            )}
            {stepIndex === 2 && (
              <PaymentScreen
                paymentMethod={paymentMethod}
                paymentOther={paymentOther}
                onChangeMethod={setPaymentMethod}
                onChangeOther={setPaymentOther}
              />
            )}
            {stepIndex === 3 && (
              <SignatureScreen
                data={signature}
                onChange={(d) => setSignature((s) => ({ ...s, ...d }))}
                onSubmit={handleSubmit}
                submitting={submitting}
                error={submitError}
                parentNom={parent.nom}
              />
            )}

            {stepIndex < 3 && (
              <div className="px-5 pb-8">
                <button
                  onClick={goNext}
                  disabled={!canContinue()}
                  className="w-full h-[52px] bg-primary hover:bg-primary-dark text-primary-foreground font-semibold rounded-xl text-sm tracking-wide transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continuer
                </button>
              </div>
            )}
          </>
        )}

        {screen === 5 && (
          <ConfirmationScreen prenom={child.prenom} dossierNumber={dossierNumber} />
        )}
      </div>
    </div>
  );
};

export default Index;
