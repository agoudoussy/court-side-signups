import raidersLogo from "@/assets/raiders-logo.jpg";

const RaidersHeader = () => (
  <div className="relative bg-foreground overflow-hidden px-4 py-6">
    {/* Diagonal parquet pattern */}
    <div
      className="absolute inset-0 opacity-[0.06]"
      style={{
        backgroundImage:
          "repeating-linear-gradient(45deg, transparent, transparent 10px, white 10px, white 11px)",
      }}
    />
    <div className="relative flex justify-center">
      <img src={raidersLogo} alt="Raiders Academy School" className="h-16 object-contain brightness-0 invert" />
    </div>
  </div>
);

export default RaidersHeader;
