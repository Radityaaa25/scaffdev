import React from "react";

interface IntegrationBadgeProps {
  name: string;
}

export function IntegrationBadge({ name }: IntegrationBadgeProps) {
  const badgeColors: Record<string, string> = {
    supabase: "bg-emerald-950/80 text-emerald-400 border-emerald-800/60",
    midtrans: "bg-blue-950/80 text-blue-400 border-blue-800/60",
    xendit: "bg-cyan-950/80 text-cyan-400 border-cyan-800/60",
    rajaongkir: "bg-amber-950/80 text-amber-400 border-amber-800/60",
  };

  const key = name.toLowerCase();
  const colorClass =
    badgeColors[key] || "bg-zinc-800/80 text-zinc-300 border-zinc-700/60";

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colorClass}`}
    >
      {name}
    </span>
  );
}
