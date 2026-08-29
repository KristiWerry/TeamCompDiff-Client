"use client";

const POWER_SPIKE_COLOR: Record<string, string> = {
  early: "#FB923C",
  mid:   "#FACC15",
  late:  "#60A5FA",
  mixed: "#A78BFA",
};

const SEGMENTS = [
  { key: "early", label: "Early" },
  { key: "mid",   label: "Mid"   },
  { key: "late",  label: "Late"  },
];

export default function PowerSpikeSegment({
  spike,
  size = "sm",
}: {
  spike: string;
  size?: "sm" | "lg";
}) {
  const color    = POWER_SPIKE_COLOR[spike] ?? POWER_SPIKE_COLOR.mixed;
  const isMixed  = spike === "mixed";

  const bar  = size === "lg" ? "h-2 w-10"   : "h-1.5 w-7";
  const lbl  = size === "lg" ? "text-[9px]"  : "text-[7px]";
  const title = size === "lg" ? "text-[10px]" : "text-[8px]";

  return (
    <div className="flex flex-col gap-1.5">
      <span className={`${title} font-bold uppercase tracking-widest text-black/35 dark:text-white/[0.28]`}>
        Power Spike
      </span>
      <div className="flex items-center gap-px">
        {SEGMENTS.map(({ key, label }, i) => {
          const active = isMixed || spike === key;
          return (
            <div key={key} className="flex flex-col items-center gap-0.5">
              <div
                className={`${bar} ${i === 0 ? "rounded-l-full" : i === 2 ? "rounded-r-full" : ""} bg-black/10 dark:bg-white/10`}
                style={active ? { background: color, opacity: isMixed ? 0.55 : 1 } : undefined}
              />
              <span
                className={`${lbl} font-semibold text-black/10 dark:text-white/10`}
                style={active ? { color } : undefined}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
