import { TrendingUp, TrendingDown, Wallet, Coins } from "lucide-react";

interface SummaryCardProps {
  title: string;
  amount: string;
  subtitle: string;
  color?: "success" | "danger" | "investment" | "neutral";
}

export default function SummaryCard({ title, amount, subtitle, color = "neutral" }: SummaryCardProps) {
  const amountColorMap = {
    neutral: "text-zinc-100",
    success: "text-emerald-400",
    danger: "text-rose-450",
    investment: "text-indigo-400",
  };

  return (
    <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-lg p-3.5 sm:p-5 flex flex-col justify-between min-h-[95px] sm:min-h-[120px] hover:border-zinc-700/50 hover:bg-zinc-900/60 transition-all duration-150">
      <div className="space-y-0.5 sm:space-y-1">
        <span className="text-[10px] sm:text-[11px] font-medium text-zinc-400 block truncate">{title}</span>
        <span className={`text-base sm:text-2xl font-bold tracking-tight block truncate ${amountColorMap[color]}`}>
          {amount}
        </span>
      </div>
      <div className="text-[9px] sm:text-[11px] text-zinc-500 font-medium truncate mt-1">
        {subtitle}
      </div>
    </div>
  );
}
