"use client";

import { useState, useMemo } from "react";
import { PieChart } from "lucide-react";

interface FinancialChartsProps {
  transactions: any[];
  dolarizar: boolean;
  cotizaciones: any;
}

export default function FinancialCharts({ transactions, dolarizar, cotizaciones }: FinancialChartsProps) {
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number | null>(null);

  // Helper de formateo de moneda
  const formatValue = (amount: number) => {
    if (dolarizar && cotizaciones?.dolares?.mep?.venta) {
      const converted = amount / cotizaciones.dolares.mep.venta;
      return `u$s ${converted.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${amount.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;
  };

  // --- PROCESAR DATOS PARA EL GRÁFICO DE DONA (GASTOS POR CATEGORÍA DEL MES ACTUAL) ---
  const categoryData = useMemo(() => {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const categoriesMap: { [key: string]: number } = {};
    let totalGastosMes = 0;

    transactions.forEach((t) => {
      if (!t.fecha || t.tipo !== "gasto") return;
      const tDate = new Date(t.fecha);
      const key = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, "0")}`;
      
      // Filtrar por mes actual para la distribución de gastos
      if (key === currentMonthKey) {
        const cat = t.categoria || "Otros";
        const monto = Number(t.monto || 0);
        categoriesMap[cat] = (categoriesMap[cat] || 0) + monto;
        totalGastosMes += monto;
      }
    });

    const items = Object.entries(categoriesMap).map(([name, value]) => ({
      name,
      value,
      percentage: totalGastosMes > 0 ? (value / totalGastosMes) * 100 : 0,
    }));

    // Ordenar de mayor a menor gasto
    items.sort((a, b) => b.value - a.value);

    // Paleta premium
    const colors = [
      "#0f766e", // Teal
      "#6366f1", // Indigo
      "#f43f5e", // Rose
      "#eab308", // Amber
      "#a855f7", // Violet
      "#10b981", // Emerald
      "#ec4899", // Pink
      "#475569", // Slate
    ];

    return {
      items: items.map((item, idx) => ({
        ...item,
        color: colors[idx % colors.length],
      })),
      total: totalGastosMes,
    };
  }, [transactions]);

  // --- CÁLCULO DE LA DONA SVG ---
  const donutRadius = 70;
  const donutCircumference = 2 * Math.PI * donutRadius;
  let accumulatedPercentage = 0;

  const donutSlices = useMemo(() => {
    accumulatedPercentage = 0;
    return categoryData.items.map((item) => {
      const percentage = item.percentage;
      const strokeDasharray = `${(percentage / 100) * donutCircumference} ${donutCircumference}`;
      const strokeDashoffset = -((accumulatedPercentage / 100) * donutCircumference);
      accumulatedPercentage += percentage;
      return {
        ...item,
        strokeDasharray,
        strokeDashoffset,
      };
    });
  }, [categoryData, donutCircumference]);

  const activeCategory = activeCategoryIndex !== null ? categoryData.items[activeCategoryIndex] : null;

  return (
    <div className="w-full">
      {/* CARD: GASTOS POR CATEGORÍA (DONA) */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-lg p-5 flex flex-col justify-between">
        <div>
          <h4 className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5 mb-6">
            <PieChart className="h-3.5 w-3.5 text-zinc-500" />
            Gasto Mensual por Categoría
          </h4>
        </div>

        {categoryData.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-xs font-semibold text-zinc-500">
              Sin gastos registrados este mes
            </p>
            <p className="text-[10px] text-zinc-650 mt-1 max-w-[200px] leading-relaxed">
              Registra un gasto con categoría para ver el análisis de distribución.
            </p>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row items-center gap-6 mt-2">
            {/* Dona SVG */}
            <div className="relative w-40 h-40 flex-shrink-0">
              <svg className="w-full h-full" viewBox="0 0 160 160">
                <g transform="rotate(-90 80 80)">
                  {/* Círculo de fondo */}
                  <circle
                    cx="80"
                    cy="80"
                    r={donutRadius}
                    fill="transparent"
                    stroke="#27272a"
                    strokeWidth="8"
                    strokeOpacity="0.3"
                  />

                  {/* Rodajas */}
                  {donutSlices.map((slice, idx) => {
                    const isActive = activeCategoryIndex === idx;
                    return (
                      <circle
                        key={slice.name}
                        cx="80"
                        cy="80"
                        r={donutRadius}
                        fill="transparent"
                        stroke={slice.color}
                        strokeWidth={isActive ? 12 : 8}
                        strokeDasharray={slice.strokeDasharray}
                        strokeDashoffset={slice.strokeDashoffset}
                        className="transition-all duration-200 cursor-pointer"
                        style={{
                          transformOrigin: "80px 80px",
                          strokeOpacity: isActive ? 1.0 : 0.8,
                        }}
                        onMouseEnter={() => setActiveCategoryIndex(idx)}
                        onMouseLeave={() => setActiveCategoryIndex(null)}
                      />
                    );
                  })}
                </g>
              </svg>

              {/* Contenido en el centro de la dona */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3 pointer-events-none">
                {activeCategory ? (
                  <>
                    <span className="text-[9px] font-medium text-zinc-400 truncate max-w-[90px]">
                      {activeCategory.name}
                    </span>
                    <span className="text-lg font-bold text-zinc-100 tracking-tight mt-0.5">
                      {activeCategory.percentage.toFixed(0)}%
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400 mt-0.5">
                      {formatValue(activeCategory.value)}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[9px] font-medium text-zinc-500">
                      Total Gastos
                    </span>
                    <span className="text-base font-bold text-zinc-100 tracking-tight mt-0.5">
                      {formatValue(categoryData.total)}
                    </span>
                    <span className="text-[9px] font-medium text-zinc-500 mt-0.5">
                      Este Mes
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Leyenda lateral */}
            <div className="flex-1 w-full space-y-1 max-h-52 overflow-y-auto pr-1">
              {categoryData.items.map((item, idx) => {
                const isActive = activeCategoryIndex === idx;
                return (
                  <div
                    key={item.name}
                    className={`flex items-center justify-between p-1.5 transition-all duration-100 rounded-lg cursor-pointer border ${
                      isActive 
                        ? "bg-zinc-900 border-zinc-800 text-zinc-100 shadow-sm" 
                        : "border-transparent hover:bg-zinc-900/40"
                    }`}
                    onMouseEnter={() => setActiveCategoryIndex(idx)}
                    onMouseLeave={() => setActiveCategoryIndex(null)}
                  >
                    <div className="flex items-center gap-2 truncate max-w-[130px]">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      ></span>
                      <span className={`text-[11px] font-medium truncate ${isActive ? "text-zinc-200" : "text-zinc-400"}`}>
                        {item.name}
                      </span>
                    </div>
                    <div className="text-right flex-shrink-0 pl-2">
                      <span className="text-[11px] font-semibold font-mono text-zinc-300 block">
                        {formatValue(item.value)}
                      </span>
                      <span className="text-[9px] text-zinc-500 font-medium block mt-0.5">
                        {item.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
