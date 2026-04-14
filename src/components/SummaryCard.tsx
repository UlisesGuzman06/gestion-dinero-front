interface SummaryCardProps {
  title: string;
  amount: string;
  subtitle: string;
  color?: "success" | "danger" | "investment" | "neutral";
}

export default function SummaryCard({ title, amount, subtitle, color = "neutral" }: SummaryCardProps) {
  const borderColors = {
    success: "border-l-bank-success",
    danger: "border-l-bank-danger",
    investment: "border-l-bank-investment",
    neutral: "border-l-transparent",
  };

  const textColors = {
    success: "text-bank-success",
    danger: "text-bank-danger",
    investment: "text-bank-investment",
    neutral: "text-gray-900",
  };

  return (
    <div className={`card-banking p-5 flex flex-col justify-between min-h-[140px] border-l-4 ${borderColors[color]}`}>
      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{title}</span>
      <div>
        <span className={`text-3xl font-bold ${textColors[color]}`}>{amount}</span>
        <div className="text-[10px] text-gray-400 mt-1 uppercase font-medium">{subtitle}</div>
      </div>
    </div>
  );
}
