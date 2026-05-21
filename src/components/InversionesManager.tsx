"use client";

import { useState, useMemo } from "react";
import { createInversion, deleteMovement } from "@/lib/api";
import { Loader2, Trash2, TrendingUp, TrendingDown, Coins, Plus, Wallet, PieChart } from "lucide-react";

interface InversionesManagerProps {
  inversiones: any[];
  cotizaciones: any;
  dolarizar: boolean;
  onRefresh: () => void;
}

export default function InversionesManager({
  inversiones = [],
  cotizaciones,
  dolarizar,
  onRefresh,
}: InversionesManagerProps) {
  const [submitting, setSubmitting] = useState(false);
  const [tipoInversion, setTipoInversion] = useState<"crypto" | "manual">("manual");
  
  // Campos del Formulario
  const [label, setLabel] = useState("");
  const [montoManual, setMontoManual] = useState("");
  const [cryptoSymbol, setCryptoSymbol] = useState("BTC");
  const [cryptoQty, setCryptoQty] = useState("");
  const [cryptoBuyPrice, setCryptoBuyPrice] = useState("");

  // Helper de formateo de moneda
  const formatValue = (amount: number) => {
    if (dolarizar && cotizaciones?.dolares?.mep?.venta) {
      const converted = amount / cotizaciones.dolares.mep.venta;
      return `u$s ${converted.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${amount.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;
  };

  // Helper de formateo para USD exactos (usado para precios de compra/venta de crypto)
  const formatUsd = (amount: number) => {
    return `u$s ${amount.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // --- CÁLCULO DE MÉTRICAS GLOBALES DE INVERSIONES ---
  const stats = useMemo(() => {
    let totalActualArs = 0;
    let totalCostoUsd = 0;
    let totalActualUsd = 0;
    let allocation = { manual: 0, btc: 0, eth: 0 };

    inversiones.forEach((inv) => {
      const montoArs = Number(inv.monto || 0);
      totalActualArs += montoArs;

      if (inv.isAdvanced && inv.cryptoDetails) {
        const details = inv.cryptoDetails;
        totalCostoUsd += details.qty * details.buyPrice;
        totalActualUsd += details.montoActualUsd;

        const sym = details.symbol.toLowerCase();
        if (sym === "btc") {
          allocation.btc += details.montoActualArs;
        } else if (sym === "eth") {
          allocation.eth += details.montoActualArs;
        }
      } else {
        // Para manuales, asumimos costo en USD equivalente al MEP actual
        const mepVenta = cotizaciones?.dolares?.mep?.venta || 1000;
        const equivUsd = montoArs / mepVenta;
        totalCostoUsd += equivUsd;
        totalActualUsd += equivUsd;
        allocation.manual += montoArs;
      }
    });

    const totalRoiUsd = totalActualUsd - totalCostoUsd;
    const totalRoiPct = totalCostoUsd > 0 ? (totalRoiUsd / totalCostoUsd) * 100 : 0;

    return {
      totalActualArs,
      totalRoiUsd,
      totalRoiPct,
      allocation,
    };
  }, [inversiones, cotizaciones]);

  // --- MANEJADORES DE ACCIONES ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      if (tipoInversion === "manual") {
        const monto = parseFloat(montoManual);
        if (!monto || !label) throw new Error("Monto y descripción requeridos.");

        await createInversion({
          monto,
          descripcion: label,
        });
      } else {
        const qty = parseFloat(cryptoQty);
        const buyPrice = parseFloat(cryptoBuyPrice);
        if (!qty || !buyPrice || !cryptoSymbol) {
          throw new Error("Cantidad, precio de compra y símbolo requeridos.");
        }

        const symbolLower = cryptoSymbol.toLowerCase();
        const cryptoRate = cotizaciones?.cryptos?.[symbolLower]?.ars || 0;
        const estimatedMontoArs = qty * cryptoRate;

        // Armamos el JSON payload para la columna descripcion
        const payload = JSON.stringify({
          isCrypto: true,
          symbol: cryptoSymbol.toUpperCase(),
          qty,
          buyPrice,
          label: label || `Inversión ${cryptoSymbol.toUpperCase()}`,
        });

        await createInversion({
          monto: estimatedMontoArs || (qty * buyPrice * (cotizaciones?.dolares?.mep?.venta || 1000)),
          descripcion: payload,
        });
      }

      // Resetear campos
      setLabel("");
      setMontoManual("");
      setCryptoQty("");
      setCryptoBuyPrice("");
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Error al crear inversión");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta inversión?")) return;
    try {
      await deleteMovement(id, "inversion");
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Error al eliminar inversión");
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. SECCIÓN DE TARJETAS RESUMEN DE PORTAFOLIO */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        {/* Tarjeta Valuación Total */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-3.5 sm:p-5 flex flex-col justify-between min-h-[95px] sm:min-h-[120px] hover:border-zinc-700/50 hover:bg-zinc-900/60 transition-all duration-150">
          <div className="flex justify-between items-start">
            <span className="text-[10px] sm:text-[11px] font-medium text-zinc-400 block">Valuación Portafolio</span>
            <div className="w-7 h-7 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center flex-shrink-0">
              <Wallet className="h-3.5 w-3.5 text-zinc-400" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2">
            <span className="text-lg sm:text-2xl font-bold tracking-tight text-zinc-100 block">
              {formatValue(stats.totalActualArs)}
            </span>
            <div className="text-[9px] sm:text-[11px] text-zinc-500 font-medium mt-1 truncate">
              Tenencias tradicionales y crypto
            </div>
          </div>
        </div>

        {/* Tarjeta ROI Total */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-3.5 sm:p-5 flex flex-col justify-between min-h-[95px] sm:min-h-[120px] hover:border-zinc-700/50 hover:bg-zinc-900/60 transition-all duration-150">
          <div className="flex justify-between items-start">
            <span className="text-[10px] sm:text-[11px] font-medium text-zinc-400 block">Rendimiento (Cripto)</span>
            <div className="w-7 h-7 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center flex-shrink-0">
              {stats.totalRoiUsd >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
              )}
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2">
            <span className={`text-lg sm:text-2xl font-bold tracking-tight block ${
              stats.totalRoiUsd >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}>
              {stats.totalRoiUsd >= 0 ? "+" : ""}{stats.totalRoiPct.toFixed(2)}%
            </span>
            <div className="text-[9px] sm:text-[11px] text-zinc-500 font-medium mt-1 truncate">
              Acumulado: {stats.totalRoiUsd >= 0 ? "+" : ""}{formatUsd(stats.totalRoiUsd)}
            </div>
          </div>
        </div>

        {/* Tarjeta Distribución Visual */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-3.5 sm:p-5 flex flex-col justify-between min-h-[95px] sm:min-h-[120px] hover:border-zinc-700/50 hover:bg-zinc-900/60 transition-all duration-150">
          <div className="flex justify-between items-start">
            <span className="text-[10px] sm:text-[11px] font-medium text-zinc-400 block">Distribución de Activos</span>
            <div className="w-7 h-7 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center flex-shrink-0">
              <PieChart className="h-3.5 w-3.5 text-zinc-400" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2">
            {stats.totalActualArs > 0 ? (
              <div className="space-y-2">
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                  {stats.allocation.manual > 0 && (
                    <div
                      className="bg-zinc-500 h-full transition-all"
                      style={{ width: `${(stats.allocation.manual / stats.totalActualArs) * 100}%` }}
                      title={`Tradicional: ${Math.round((stats.allocation.manual / stats.totalActualArs) * 100)}%`}
                    />
                  )}
                  {stats.allocation.btc > 0 && (
                    <div
                      className="bg-amber-500 h-full transition-all"
                      style={{ width: `${(stats.allocation.btc / stats.totalActualArs) * 100}%` }}
                      title={`Bitcoin: ${Math.round((stats.allocation.btc / stats.totalActualArs) * 100)}%`}
                    />
                  )}
                  {stats.allocation.eth > 0 && (
                    <div
                      className="bg-indigo-500 h-full transition-all"
                      style={{ width: `${(stats.allocation.eth / stats.totalActualArs) * 100}%` }}
                      title={`Ethereum: ${Math.round((stats.allocation.eth / stats.totalActualArs) * 100)}%`}
                    />
                  )}
                </div>
                <div className="flex gap-2 text-[9px] font-semibold text-zinc-500">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full"></span>
                    <span>FIAT</span>
                  </div>
                  {stats.allocation.btc > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                      <span>BTC</span>
                    </div>
                  )}
                  {stats.allocation.eth > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                      <span>ETH</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-[10px] sm:text-[11px] text-zinc-500 font-medium">
                Sin tenencias registradas
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. GRILLA CENTRAL: AGREGAR Y LISTAR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Formulario para agregar inversión */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-5 h-fit">
          <h4 className="text-xs font-semibold text-zinc-300 mb-4">
            Nueva Inversión
          </h4>

          {/* Selector de Tipo (Crypto vs Manual) */}
          <div className="grid grid-cols-2 gap-1.5 bg-zinc-950/60 p-1 rounded-lg border border-zinc-800 mb-5">
            <button
              type="button"
              onClick={() => setTipoInversion("manual")}
              className={`py-1.5 px-2 text-[10px] font-medium rounded transition-all cursor-pointer ${
                tipoInversion === "manual"
                  ? "bg-zinc-900 text-zinc-100 border border-zinc-800"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Tradicional / FIAT
            </button>
            <button
              type="button"
              onClick={() => setTipoInversion("crypto")}
              className={`py-1.5 px-2 text-[10px] font-medium rounded transition-all cursor-pointer ${
                tipoInversion === "crypto"
                  ? "bg-zinc-900 text-zinc-100 border border-zinc-800"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Criptomonedas
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-medium text-zinc-500 mb-1">
                Etiqueta / Descripción
              </label>
              <input
                type="text"
                placeholder={tipoInversion === "manual" ? "Plazo Fijo Banco, Acciones Galicia..." : "Ahorro Bitcoin, Wallet Fría..."}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full input-banking"
                required
              />
            </div>

            {tipoInversion === "manual" ? (
              <div>
                <label className="block text-[10px] font-medium text-zinc-500 mb-1">
                  Monto Fijo ($ ARS)
                </label>
                <input
                  type="number"
                  placeholder="Monto invertido"
                  value={montoManual}
                  onChange={(e) => setMontoManual(e.target.value)}
                  className="w-full input-banking"
                  required
                />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-medium text-zinc-500 mb-1">
                      Activo Cripto
                    </label>
                    <select
                      value={cryptoSymbol}
                      onChange={(e) => setCryptoSymbol(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-2 outline-none text-xs"
                    >
                      <option value="BTC">BTC (Bitcoin)</option>
                      <option value="ETH">ETH (Ethereum)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-zinc-500 mb-1">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.005"
                      value={cryptoQty}
                      onChange={(e) => setCryptoQty(e.target.value)}
                      className="w-full input-banking"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-zinc-500 mb-1">
                    Precio Compra Promedio (USD/unidad)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="65000"
                    value={cryptoBuyPrice}
                    onChange={(e) => setCryptoBuyPrice(e.target.value)}
                    className="w-full input-banking"
                    required
                  />
                </div>

                {/* Vista previa rápida */}
                {cryptoQty && cryptoBuyPrice && (
                  <div className="bg-zinc-950/40 border border-zinc-800 rounded-lg p-3 text-[10px] space-y-1 text-zinc-500">
                    <div className="flex justify-between">
                      <span>Costo Inicial Invertido:</span>
                      <span className="font-mono text-zinc-300">
                        {formatUsd(Number(cryptoQty) * Number(cryptoBuyPrice))}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full btn-banking-primary flex items-center justify-center gap-2 h-9 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" /> Registrar Activo
                </>
              )}
            </button>
          </form>
        </div>

        {/* Listado de inversiones */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
            <Coins className="h-3.5 w-3.5 text-zinc-500" />
            Detalle de Cartera y Tenencias
          </h3>
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg overflow-hidden">
            {inversiones.length === 0 ? (
              <div className="p-12 text-center text-zinc-550 border border-dashed border-zinc-800/80 rounded-lg bg-zinc-900/10">
                <Coins className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
                <p className="text-xs font-semibold text-zinc-400">No hay inversiones cargadas</p>
                <p className="text-[10px] text-zinc-550 mt-1 max-w-sm mx-auto leading-relaxed">
                  Agrega una inversión tradicional o criptográfica en el panel izquierdo para seguir su valor y retorno.
                </p>
              </div>
            ) : (
              <>
                {/* Vista Desktop - Tabla */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-900/30 border-b border-zinc-800 text-[11px] font-medium text-zinc-400">
                        <th className="py-3 px-6">Inversión / Activo</th>
                        <th className="py-3 px-4">Tipo</th>
                        <th className="py-3 px-4 text-right">Tenencia / Costo</th>
                        <th className="py-3 px-4 text-right">Precio Actual</th>
                        <th className="py-3 px-4 text-right">Valuación</th>
                        <th className="py-3 px-4 text-right">ROI (Rendimiento)</th>
                        <th className="py-3 px-6 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 text-xs text-zinc-300">
                      {inversiones.map((inv) => {
                        const isCrypto = inv.isAdvanced;
                        return (
                          <tr key={inv.id} className="hover:bg-zinc-900/40 transition-colors group">
                            <td className="py-3 px-6">
                              <div className="font-medium text-zinc-200">
                                {inv.descripcion || `Inversión ${inv.id.substring(0, 4)}`}
                              </div>
                              <div className="text-[10px] text-zinc-550 mt-0.5 font-mono">
                                {inv.fecha ? new Date(inv.fecha).toLocaleDateString("es-AR") : ""}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {isCrypto ? (
                                <span className="inline-block px-1.5 py-0.5 text-[9px] font-medium bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded">
                                  {inv.cryptoDetails?.symbol}
                                </span>
                              ) : (
                                <span className="inline-block px-1.5 py-0.5 text-[9px] font-medium bg-zinc-800 border border-zinc-800 text-zinc-400 rounded">
                                  FIAT
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {isCrypto ? (
                                <div>
                                  <span className="font-semibold text-zinc-300 font-mono">
                                    {inv.cryptoDetails?.qty} {inv.cryptoDetails?.symbol}
                                  </span>
                                  <div className="text-[10px] text-zinc-550 font-mono mt-0.5">
                                    Costo: {formatUsd(inv.cryptoDetails?.buyPrice)}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-zinc-650">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-semibold text-zinc-300">
                              {isCrypto ? (
                                formatUsd(inv.cryptoDetails?.currentPriceUsd || 0)
                              ) : (
                                <span className="text-zinc-650">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-semibold text-zinc-200">
                              {formatValue(inv.monto)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono">
                              {isCrypto ? (
                                <div>
                                  <span className={`font-semibold ${inv.cryptoDetails?.roi >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                    {inv.cryptoDetails?.roi >= 0 ? "+" : ""}{inv.cryptoDetails?.roi.toFixed(2)}%
                                  </span>
                                  <div className={`text-[10px] font-semibold ${inv.cryptoDetails?.rendimientoUsd >= 0 ? "text-emerald-400" : "text-rose-400"} mt-0.5`}>
                                    {inv.cryptoDetails?.rendimientoUsd >= 0 ? "+" : ""}{formatUsd(inv.cryptoDetails?.rendimientoUsd)}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-zinc-500 font-medium">N/A</span>
                              )}
                            </td>
                            <td className="py-3 px-6 text-center">
                              <button
                                onClick={() => handleDelete(inv.id)}
                                className="p-1 text-zinc-550 hover:text-red-400 transition-colors cursor-pointer"
                                title="Eliminar Inversión"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Vista Móvil - Tarjetas Flexibles */}
                <div className="block md:hidden divide-y divide-zinc-800/40 text-xs text-zinc-300">
                  {inversiones.map((inv) => {
                    const isCrypto = inv.isAdvanced;
                    return (
                      <div key={inv.id} className="p-4 space-y-3 hover:bg-zinc-900/10 transition-colors">
                        {/* Cabecera de tarjeta */}
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <span className="font-semibold text-zinc-250 block truncate">
                              {inv.descripcion || `Inversión ${inv.id.substring(0, 4)}`}
                            </span>
                            {inv.fecha && (
                              <span className="text-[10px] text-zinc-500 mt-0.5 font-mono block">
                                {new Date(inv.fecha).toLocaleDateString("es-AR")}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex-shrink-0">
                            {isCrypto ? (
                              <span className="inline-block px-1.5 py-0.5 text-[9px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded">
                                {inv.cryptoDetails?.symbol}
                              </span>
                            ) : (
                              <span className="inline-block px-1.5 py-0.5 text-[9px] font-bold bg-zinc-800 border border-zinc-800 text-zinc-400 rounded">
                                FIAT
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Grilla de métricas */}
                        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-zinc-900 text-[10px] text-zinc-400 font-medium">
                          <div>
                            <span className="text-[9px] text-zinc-500 block">Valuación Actual</span>
                            <span className="font-mono text-zinc-100 font-bold text-xs block mt-0.5">
                              {formatValue(inv.monto)}
                            </span>
                          </div>

                          <div>
                            <span className="text-[9px] text-zinc-500 block">Rendimiento (ROI)</span>
                            {isCrypto ? (
                              <div className="mt-0.5">
                                <span className={`font-mono font-bold ${inv.cryptoDetails?.roi >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                  {inv.cryptoDetails?.roi >= 0 ? "+" : ""}{inv.cryptoDetails?.roi.toFixed(2)}%
                                </span>
                                <span className={`font-mono font-semibold block text-[9px] ${inv.cryptoDetails?.rendimientoUsd >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                  ({inv.cryptoDetails?.rendimientoUsd >= 0 ? "+" : ""}{formatUsd(inv.cryptoDetails?.rendimientoUsd)})
                                </span>
                              </div>
                            ) : (
                              <span className="text-zinc-500 block mt-0.5">N/A</span>
                            )}
                          </div>

                          {isCrypto && (
                            <>
                              <div>
                                <span className="text-[9px] text-zinc-500 block">Cantidad original</span>
                                <span className="font-mono text-zinc-300 block mt-0.5">
                                  {inv.cryptoDetails?.qty} {inv.cryptoDetails?.symbol}
                                </span>
                                <span className="text-[9px] text-zinc-500 font-mono block mt-0.5">
                                  Compra: {formatUsd(inv.cryptoDetails?.buyPrice)}
                                </span>
                              </div>

                              <div>
                                <span className="text-[9px] text-zinc-500 block">Precio de mercado</span>
                                <span className="font-mono text-zinc-300 block mt-0.5">
                                  {formatUsd(inv.cryptoDetails?.currentPriceUsd || 0)}
                                </span>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Botón Eliminar */}
                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => handleDelete(inv.id)}
                            className="px-2 py-0.5 rounded border border-zinc-800 hover:bg-red-500/10 hover:border-red-500/20 text-zinc-450 hover:text-red-400 transition-all flex items-center gap-1.5 cursor-pointer text-[10px]"
                          >
                            <Trash2 className="h-3 w-3" />
                            Eliminar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
