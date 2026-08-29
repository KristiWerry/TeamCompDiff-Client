"use client";

const ENGAGE_COLOR: Record<string, string> = {
  "Low":       "#94A3B8",
  "Medium":    "#FACC15",
  "High":      "#FB923C",
  "Very High": "#F87171",
};

const LEVELS = ["Low", "Medium", "High", "Very High"];

export default function EngageMeter({
  engage,
  size = "sm",
}: {
  engage: string;
  size?: "sm" | "lg";
}) {
  const levelIdx = LEVELS.indexOf(engage);
  const color    = ENGAGE_COLOR[engage] ?? ENGAGE_COLOR["Low"];

  const dot   = size === "lg" ? "h-3.5 w-3.5" : "h-2.5 w-2.5";
  const gap   = size === "lg" ? "gap-2"        : "gap-1.5";
  const title = size === "lg" ? "text-[10px]"  : "text-[8px]";

  return (
    <div className="flex flex-col gap-1.5">
      <span className={`${title} font-bold uppercase tracking-widest text-black/35 dark:text-white/[0.28]`}>
        Engage
      </span>
      <div className={`flex items-center ${gap} py-px`}>
        {LEVELS.map((level, i) => (
          <div
            key={i}
            className={`${dot} rounded-full bg-black/10 dark:bg-white/10`}
            style={i <= levelIdx ? { background: color } : undefined}
            title={level}
          />
        ))}
      </div>
    </div>
  );
}
