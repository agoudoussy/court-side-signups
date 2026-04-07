import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { X, Camera, AlertTriangle, CheckCircle, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import Portal from "./Portal";

interface DossierForm {
  // Enfant
  child_nom: string;
  child_prenom: string;
  child_date_naissance: string;
  child_genre: string;
  child_adresse: string;
  child_telephone: string;
  has_allergy: boolean;
  allergy_details: string;
  // Parent
  parent_nom: string;
  parent_email: string;
  parent_telephone: string;
  // Paiement
  payment_method: string;
  payment_other: string;
  // Statut
  status: "en_attente" | "valide" | "refuse";
}

const PAYMENT_OPTIONS = [
  { id: "virement", label: "Virement bancaire" },
  { id: "especes", label: "Espèces" },
  { id: "cheque", label: "Chèque" },
  { id: "orange", label: "Orange Money" },
  { id: "autre", label: "Autre (préciser)" },
];

const STATUS_OPTIONS = [
  { id: "en_attente", label: "En attente" },
  { id: "valide", label: "Validé" },
  { id: "refuse", label: "Refusé" },
];

const EMPTY: DossierForm = {
  child_nom: "", child_prenom: "", child_date_naissance: "", child_genre: "",
  child_adresse: "", child_telephone: "", has_allergy: false, allergy_details: "",
  parent_nom: "", parent_email: "", parent_telephone: "",
  payment_method: "", payment_other: "", status: "en_attente",
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground block mb-1.5">
      {label}
    </label>
    {children}
  </div>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className="w-full h-10 px-3 rounded-lg border-[1.5px] border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-colors"
  />
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-xl border border-border overflow-hidden">
    <div className="px-4 py-2.5 bg-secondary border-b border-border">
      <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">{title}</p>
    </div>
    <div className="p-4 space-y-4">{children}</div>
  </div>
);

interface Props {
  onClose: () => void;
}

const AddDossierModal = ({ onClose }: Props) => {
  const [form, setForm] = useState<DossierForm>(EMPTY);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const set = (patch: Partial<DossierForm>) => setForm((f) => ({ ...f, ...patch }));

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const canSubmit =
    form.child_nom && form.child_prenom && form.child_date_naissance &&
    form.child_genre && form.child_adresse && form.child_telephone &&
    form.parent_nom && form.parent_email && form.parent_telephone &&
    form.payment_method && (!form.has_allergy || form.allergy_details.trim());

  const mutation = useMutation({
    mutationFn: async () => {
      let photoUrl: string | null = null;
      if (photo) {
        const ext = photo.name.split(".").pop();
        const tmpPath = `tmp_${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("dossier-photos")
          .upload(tmpPath, photo, { upsert: true });
        if (!uploadError) {
          const { data } = supabase.storage.from("dossier-photos").getPublicUrl(tmpPath);
          photoUrl = data.publicUrl;
        }
      }

      const today = new Date().toISOString().split("T")[0];
      const { error } = await supabase.from("dossiers").insert({
        status: form.status,
        child_nom: form.child_nom,
        child_prenom: form.child_prenom,
        child_date_naissance: form.child_date_naissance,
        child_genre: form.child_genre,
        child_adresse: form.child_adresse,
        child_telephone: form.child_telephone,
        child_photo: photoUrl,
        has_allergy: form.has_allergy,
        allergy_details: form.allergy_details || null,
        parent_nom: form.parent_nom,
        parent_email: form.parent_email,
        parent_telephone: form.parent_telephone,
        payment_method: form.payment_method,
        payment_other: form.payment_other || null,
        signature_nom: form.parent_nom,
        signature_date: today,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-dossiers"] });
      toast.success("Dossier créé avec succès.");
      onClose();
    },
    onError: (e: Error) => {
      toast.error(e.message || "Erreur lors de la création du dossier.");
    },
  });

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative ml-auto w-full max-w-lg bg-background h-full flex flex-col shadow-2xl">
          <div className="sticky top-0 bg-background border-b border-border px-5 py-4 flex items-center justify-between z-10 shrink-0">
            <div>
              <p className="font-semibold text-sm">Nouveau dossier</p>
              <p className="text-xs text-muted-foreground">Créer manuellement un dossier d'inscription</p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">

            {/* Statut */}
            <Section title="Statut du dossier">
              <div className="grid grid-cols-3 gap-2">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => set({ status: s.id as DossierForm["status"] })}
                    className={`py-2 rounded-lg text-xs font-semibold border-[1.5px] transition-all ${form.status === s.id
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground"
                      }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </Section>

            <Section title="Informations enfant">
              {/* Photo */}
              <Field label="Photo (optionnel)">
                <div className="flex items-center gap-3">
                  {photoPreview ? (
                    <div className="relative shrink-0">
                      <img src={photoPreview} className="w-16 h-16 rounded-lg object-cover border border-border" />
                      <button
                        type="button"
                        onClick={() => { setPhoto(null); setPhotoPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg border-[1.5px] border-dashed border-border bg-secondary flex items-center justify-center shrink-0">
                      <Camera className="w-5 h-5 text-muted-foreground/40" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="h-10 px-4 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                  >
                    {photo ? "Changer" : "Choisir une photo"}
                  </button>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Nom">
                  <Input value={form.child_nom} onChange={(e) => set({ child_nom: e.target.value.toUpperCase() })} placeholder="DIALLO" />
                </Field>
                <Field label="Prénom">
                  <Input value={form.child_prenom} onChange={(e) => set({ child_prenom: e.target.value })} placeholder="Mamadou" />
                </Field>
              </div>
              <Field label="Date de naissance">
                <Input type="date" value={form.child_date_naissance} onChange={(e) => set({ child_date_naissance: e.target.value })} />
              </Field>
              <Field label="Genre">
                <div className="grid grid-cols-2 gap-2">
                  {["Masculin", "Féminin"].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => set({ child_genre: g })}
                      className={`h-10 rounded-lg border-[1.5px] text-sm font-medium transition-all ${form.child_genre === g ? "border-primary bg-primary/5" : "border-border"
                        }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Adresse">
                <Input value={form.child_adresse} onChange={(e) => set({ child_adresse: e.target.value })} placeholder="Quartier, Commune" />
              </Field>
              <Field label="Téléphone">
                <Input type="tel" value={form.child_telephone} onChange={(e) => set({ child_telephone: e.target.value })} placeholder="+224 6XX XX XX XX" />
              </Field>

              {/* Allergies */}
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="px-3 py-2 bg-secondary/60 border-b border-border flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Allergies / Contre-indications</span>
                </div>
                <div className="p-3 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { val: false, label: "Non", icon: CheckCircle },
                      { val: true, label: "Oui", icon: AlertTriangle },
                    ].map(({ val, label, icon: Icon }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => set({ has_allergy: val, allergy_details: val ? form.allergy_details : "" })}
                        className={`flex items-center justify-center gap-1.5 h-9 rounded-lg border-[1.5px] text-sm font-medium transition-all ${form.has_allergy === val ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"
                          }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                      </button>
                    ))}
                  </div>
                  {form.has_allergy && (
                    <textarea
                      value={form.allergy_details}
                      onChange={(e) => set({ allergy_details: e.target.value })}
                      placeholder="Précisez les allergies / contre-indications..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border-[1.5px] border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-colors resize-none"
                    />
                  )}
                </div>
              </div>
            </Section>

            {/* Parent */}
            <Section title="Parent / Tuteur">
              <Field label="Nom complet">
                <Input value={form.parent_nom} onChange={(e) => set({ parent_nom: e.target.value })} placeholder="Nom du parent" />
              </Field>
              <Field label="Email">
                <Input type="email" value={form.parent_email} onChange={(e) => set({ parent_email: e.target.value })} placeholder="parent@email.com" />
              </Field>
              <Field label="Téléphone">
                <Input type="tel" value={form.parent_telephone} onChange={(e) => set({ parent_telephone: e.target.value })} placeholder="+224 6XX XX XX XX" />
              </Field>
            </Section>

            {/* Paiement */}
            <Section title="Paiement">
              <Field label="Méthode de paiement">
                <div className="relative">
                  <select
                    value={form.payment_method}
                    onChange={(e) => set({ payment_method: e.target.value })}
                    className="w-full h-10 pl-3 pr-8 rounded-lg border-[1.5px] border-border bg-background text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-colors"
                  >
                    <option value="">Sélectionner...</option>
                    {PAYMENT_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </Field>
              {form.payment_method === "autre" && (
                <Field label="Précision">
                  <Input value={form.payment_other} onChange={(e) => set({ payment_other: e.target.value })} placeholder="Précisez le mode de paiement" />
                </Field>
              )}
            </Section>

          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-border px-5 py-4 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 h-11 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={() => mutation.mutate()}
              disabled={!canSubmit || mutation.isPending}
              className="flex-1 h-11 bg-primary hover:bg-primary-dark text-primary-foreground font-semibold rounded-xl text-sm tracking-wide transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {mutation.isPending ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                "Créer le dossier"
              )}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default AddDossierModal;
