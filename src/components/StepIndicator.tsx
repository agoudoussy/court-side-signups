interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  title: string;
}

const StepIndicator = ({ currentStep, totalSteps, title }: StepIndicatorProps) => (
  <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3">
    <div className="flex items-center justify-between mb-2">
      <h2 className="font-display text-lg tracking-wider">{title}</h2>
      <span className="text-hint text-muted-foreground font-body">{currentStep} / {totalSteps}</span>
    </div>
    <div className="flex gap-2">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all ${
            i + 1 === currentStep
              ? "bg-primary flex-[2]"
              : i + 1 < currentStep
              ? "bg-primary/40 flex-1"
              : "bg-border flex-1"
          }`}
        />
      ))}
    </div>
  </div>
);

export default StepIndicator;
