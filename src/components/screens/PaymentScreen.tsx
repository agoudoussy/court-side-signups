import { useState, useRef } from "react";
import { Check } from "lucide-react";

interface Props {
  paymentMethod: string;
  onChangePayment: (m: string) => void;
  onSubmit: () => void;
}

const methods = [
  { id: "wave", emoji: "📱", label: "Wave" },
  { id: "orange", emoji: "🟠", label: "Orange Money" },
  { id: "carte", emoji: "💳", label: "Carte bancaire" },
  { id: "especes", emoji: "🏦", label: "Espèces" },
];

const PaymentScreen = ({ paymentMethod, onChangePayment, onSubmit }: Props) => {
  const [consents, setConsents] = useState([false, false, false]);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const toggleConsent = (i: number) => {
    const next = [...consents];
    next[i] = !next[i];
    setConsents(next);
  };

  const handleOtp = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 3) otpRefs.current[i + 1]?.focus();
  };

  const allValid = paymentMethod && consents.every(Boolean) && otp.every((d) => d.length === 1);

  return (
    <div className="px-5 py-6 space-y-6 animate-fade-in-up">
      {/* Recap */}
      <div className="bg-foreground text-primary-foreground rounded-lg p-4 space-y-2">
        <p className="text-label uppercase tracking-wider opacity-60">Récapitulatif financier</p>
        <div className="flex justify-between text-body">
          <span>Frais d'inscription</span><span>50 000 GNF</span>
        </div>
        <div className="flex justify-between text-body">
          <span>Mensualité (maillot inclus)</span><span>500 000 GNF</span>
        </div>
        <div className="border-t border-primary-foreground/20 pt-2 flex justify-between font-semibold text-body">
          <span>Total</span><span className="text-primary-light">550 000 GNF</span>
        </div>
      </div>

      {/* Payment method */}
      <div>
        <label className="text-label uppercase text-muted-foreground block mb-2">Mode de paiement</label>
        <div className="grid grid-cols-2 gap-3">
          {methods.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onChangePayment(m.id)}
              className={`flex items-center gap-2 p-3 rounded-lg border-[1.5px] text-body transition-all ${
                paymentMethod === m.id ? "border-primary bg-primary/5" : "border-border bg-card"
              }`}
            >
              <span>{m.emoji}</span>
              <span className="font-medium">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Consents */}
      <div className="space-y-3">
        <label className="text-label uppercase text-muted-foreground block">Consentements</label>
        {[
          "J'accepte le règlement intérieur de l'académie",
          "J'autorise l'utilisation de l'image de mon enfant",
          "Je m'engage à respecter les modalités de paiement",
        ].map((text, i) => (
          <button
            key={i}
            type="button"
            onClick={() => toggleConsent(i)}
            className="flex items-start gap-3 w-full text-left"
          >
            <div
              className={`w-5 h-5 rounded border-[1.5px] flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                consents[i] ? "bg-primary border-primary" : "border-border"
              }`}
            >
              {consents[i] && <Check className="w-3 h-3 text-primary-foreground" />}
            </div>
            <span className="text-hint">{text}</span>
          </button>
        ))}
      </div>

      {/* OTP */}
      <div>
        <label className="text-label uppercase text-muted-foreground block mb-2">Code de vérification</label>
        <p className="text-hint text-muted-foreground mb-3">Entrez le code reçu par SMS</p>
        <div className="flex gap-3 justify-center">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { otpRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtp(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && !digit && i > 0) otpRefs.current[i - 1]?.focus();
              }}
              className="w-14 h-14 text-center text-xl font-semibold rounded-lg border-[1.5px] border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary"
            />
          ))}
        </div>
      </div>

      <button
        onClick={onSubmit}
        disabled={!allValid}
        className="w-full h-[52px] bg-primary hover:bg-primary-dark text-primary-foreground font-semibold rounded-lg text-body transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        SOUMETTRE LE DOSSIER 🏀
      </button>
    </div>
  );
};

export default PaymentScreen;
