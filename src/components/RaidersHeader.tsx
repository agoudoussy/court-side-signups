import raidersLogo from "@/assets/raiders-logo.png";

const RaidersHeader = () => (
  <div className="relative bg-white overflow-hidden shadow-sm">

    <div className="h-2 bg-primary" />

    <div
      className="absolute inset-0 opacity-[0.045]"
      style={{
        backgroundImage:
          "repeating-linear-gradient(45deg, transparent, transparent 10px, black 10px, black 11px)",
      }}
    />

    <div className="relative flex justify-center px-4 py-4">
      <img
        src={raidersLogo}
        alt="Raiders Academy School"
        className="w-[35%] max-w-[280px] object-contain"
      />
    </div>

    <div className="h-1 bg-primary/60" />
  </div>
);

export default RaidersHeader;
