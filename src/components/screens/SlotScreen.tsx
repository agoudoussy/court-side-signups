import { SLOTS } from "@/lib/categories";
import { MapPin, Clock, Users } from "lucide-react";

interface Props {
  category: string;
  selectedSlot: string;
  onChange: (slot: string) => void;
}

const SlotScreen = ({ category, selectedSlot, onChange }: Props) => (
  <div className="px-5 py-6 space-y-5 animate-fade-in-up">
    <div>
      <label className="text-label uppercase text-muted-foreground block mb-1.5">Catégorie assignée</label>
      <div className="h-11 px-3 rounded-lg border-[1.5px] border-border bg-secondary flex items-center text-body gap-2">
        <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-hint font-semibold">
          {category || "—"}
        </span>
        <span className="text-muted-foreground">Saison 2024-2025</span>
      </div>
    </div>

    <div className="space-y-3">
      <label className="text-label uppercase text-muted-foreground block">Choisissez un créneau</label>
      {SLOTS.map((slot) => {
        const full = slot.places === 0;
        const low = slot.places > 0 && slot.places <= 5;
        const selected = selectedSlot === slot.name;

        return (
          <button
            key={slot.name}
            type="button"
            disabled={full}
            onClick={() => onChange(slot.name)}
            className={`w-full text-left p-4 rounded-lg border-[1.5px] transition-all ${
              full
                ? "border-border bg-secondary opacity-60 cursor-not-allowed"
                : selected
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:border-primary/30"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-body font-semibold">{slot.name}</span>
              <span
                className={`text-hint font-semibold px-2 py-0.5 rounded-full ${
                  full
                    ? "bg-destructive/10 text-destructive"
                    : low
                    ? "bg-warning/10 text-warning"
                    : "bg-success/10 text-success"
                }`}
              >
                {full ? "Complet" : `${slot.places} places`}
              </span>
            </div>
            <div className="flex items-center gap-4 text-hint text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{slot.time}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{slot.terrain}</span>
            </div>
          </button>
        );
      })}
    </div>
  </div>
);

export default SlotScreen;
