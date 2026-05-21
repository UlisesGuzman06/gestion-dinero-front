"use client";

import { useState } from "react";
import { processSmartInput, createIngreso, createGasto, createInversion, deleteMovement } from "@/lib/api";
import { Sparkles, Check, X, Loader2, ArrowRight, TrendingDown, TrendingUp, Wallet, Coins, Trash2, AlertTriangle } from "lucide-react";

interface SmartInputBarProps {
  onSuccess: () => void;
  dolarizar?: boolean;
  cotizaciones?: any;
  transactions?: any[];
  inversiones?: any[];
}

// Helper to format local YYYY-MM-DD date timezone-independently
const getLocalDateString = (dateInput: any) => {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch (e) {
    return "";
  }
};

// Helper for scoring and matching items
function findBestMatches(
  parsed: {
    tipo?: 'ingreso' | 'gasto' | 'inversion';
    monto?: number;
    descripcion?: string;
    categoria?: string;
    fecha?: string;
    isCrypto?: boolean;
    cryptoSymbol?: string;
    cryptoQty?: number;
    cryptoBuyPrice?: number;
  },
  transactions: any[],
  inversiones: any[]
): any[] {
  const normalize = (str: string) => {
    if (!str) return "";
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "") // remove punctuation
      .replace(/\s+/g, " ")
      .trim();
  };

  const candidates: any[] = [];

  // Add standard transactions, excluding Mercado Pago (read-only syncs)
  transactions.forEach((t) => {
    if (t.categoria === "Mercado Pago") return;
    candidates.push({
      ...t,
      sourceList: "transactions"
    });
  });

  // Add investments
  inversiones.forEach((inv) => {
    candidates.push({
      ...inv,
      tipo: "inversion",
      sourceList: "inversiones"
    });
  });

  const scored = candidates.map((item) => {
    let score = 0;

    // 1. Type Match
    if (parsed.tipo) {
      if (item.tipo === parsed.tipo) {
        score += 20;
      } else {
        score -= 100; // Strict type mismatch penalty
      }
    }

    // 2. Amount Match (Monto)
    if (parsed.monto !== undefined && parsed.monto !== null && parsed.monto > 0) {
      const itemMonto = Math.abs(item.monto);
      const diff = Math.abs(itemMonto - parsed.monto);
      if (diff === 0) {
        score += 65;
      } else if (diff / itemMonto < 0.05) {
        score += 45;
      } else if (diff / itemMonto < 0.15) {
        score += 25;
      } else {
        score -= 40; // Penalty for amount mismatch
      }
    }

    // 3. Crypto Token & Quantity Match
    if (parsed.isCrypto || parsed.cryptoSymbol || parsed.cryptoQty) {
      if (item.isAdvanced && item.cryptoDetails) {
        score += 30;
        if (parsed.cryptoSymbol && item.cryptoDetails.symbol?.toUpperCase() === parsed.cryptoSymbol.toUpperCase()) {
          score += 55;
        }
        if (parsed.cryptoQty && Math.abs(item.cryptoDetails.qty - parsed.cryptoQty) < 0.001) {
          score += 45;
        }
      } else {
        score -= 80; // Penalty if searching for crypto but item is fiat
      }
    }

    // 4. Description Match (fuzzy matching)
    if (parsed.descripcion) {
      const parsedDesc = normalize(parsed.descripcion);
      const itemDesc = normalize(item.descripcion);

      if (parsedDesc && itemDesc) {
        if (itemDesc === parsedDesc) {
          score += 50;
        } else if (itemDesc.includes(parsedDesc) || parsedDesc.includes(itemDesc)) {
          score += 35;
        } else {
          // Compare matching words
          const parsedWords = parsedDesc.split(" ").filter(w => w.length > 2);
          const itemWords = itemDesc.split(" ").filter(w => w.length > 2);
          let matchCount = 0;
          parsedWords.forEach((pw) => {
            if (itemWords.includes(pw)) matchCount++;
          });
          if (matchCount > 0) {
            score += matchCount * 15;
          }
        }
      }
    }

    // 5. Date Match
    if (parsed.fecha) {
      try {
        const pDate = parsed.fecha.substring(0, 10);
        const itemDateStr = getLocalDateString(item.fecha);
        if (pDate === itemDateStr) {
          score += 40;
        } else {
          const pTime = new Date(pDate + "T12:00:00").getTime();
          const iTime = new Date(itemDateStr + "T12:00:00").getTime();
          if (!isNaN(pTime) && !isNaN(iTime)) {
            const diffDays = Math.round(Math.abs(pTime - iTime) / (1000 * 60 * 60 * 24));
            if (diffDays <= 1) {
              score += 20;
            } else if (diffDays <= 3) {
              score += 10;
            }
          }
        }
      } catch (e) {
        // Date match fail
      }
    }

    // 6. Category Match
    if (parsed.categoria && item.categoria) {
      if (normalize(item.categoria) === normalize(parsed.categoria)) {
        score += 15;
      }
    }

    return { item, score };
  });

  // Return candidates with positive matching score, sorted descending
  return scored
    .filter(candidate => candidate.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(s => s.item);
}

export default function SmartInputBar({ 
  onSuccess, 
  dolarizar = false, 
  cotizaciones,
  transactions = [],
  inversiones = []
}: SmartInputBarProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsedResult, setParsedResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // States for Smart Deletion
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);

  // Helper de formateo de moneda
  const formatAmount = (amount: number) => {
    if (dolarizar && cotizaciones?.dolares?.mep?.venta) {
      const converted = amount / cotizaciones.dolares.mep.venta;
      return `u$s ${converted.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${amount.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;
  };

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || loading) return;

    setLoading(true);
    setError(null);
    setParsedResult(null);
    setMatches([]);
    setSelectedMatch(null);

    try {
      const result = await processSmartInput(text);
      setParsedResult(result);

      if (result.accion === "eliminar") {
        const foundMatches = findBestMatches(result, transactions, inversiones);
        setMatches(foundMatches);
        if (foundMatches.length === 1) {
          setSelectedMatch(foundMatches[0]);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "No se pudo procesar con IA. Verificá que la API Key esté configurada.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!parsedResult || saving) return;
    setSaving(true);
    try {
      const finalDate = new Date(parsedResult.fecha + "T12:00:00");

      if (parsedResult.tipo === "ingreso") {
        await createIngreso({
          descripcion: parsedResult.descripcion,
          monto: Number(parsedResult.monto),
          fecha: finalDate,
        });
      } else if (parsedResult.tipo === "gasto") {
        await createGasto({
          descripcion: parsedResult.descripcion,
          monto: Number(parsedResult.monto),
          categoria: parsedResult.categoria,
          fecha: finalDate,
        });
      } else if (parsedResult.tipo === "inversion") {
        if (parsedResult.isCrypto && parsedResult.cryptoSymbol) {
          const qty = Number(parsedResult.cryptoQty || 0);
          const buyPrice = Number(parsedResult.cryptoBuyPrice || 0);
          const symbol = parsedResult.cryptoSymbol.toUpperCase();
          const label = parsedResult.descripcion || `Inversión ${symbol}`;

          const payloadJson = JSON.stringify({
            isCrypto: true,
            symbol,
            qty,
            buyPrice,
            label,
          });

          const cryptoRate = cotizaciones?.cryptos?.[symbol.toLowerCase()]?.ars || 0;
          const mepVenta = cotizaciones?.dolares?.mep?.venta || 1000;
          const finalMonto = cryptoRate > 0 ? (qty * cryptoRate) : (qty * buyPrice * mepVenta);

          await createInversion({
            monto: finalMonto || Number(parsedResult.monto),
            descripcion: payloadJson,
          });
        } else {
          await createInversion({
            monto: Number(parsedResult.monto),
            descripcion: parsedResult.descripcion,
          });
        }
      }

      // Limpiar estados y refrescar dashboard
      setText("");
      setParsedResult(null);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      alert("Error al registrar el movimiento: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async (itemToDelete: any) => {
    if (!itemToDelete || saving) return;
    setSaving(true);
    try {
      await deleteMovement(itemToDelete.id, itemToDelete.tipo);
      
      // Limpiar estados y refrescar dashboard
      setText("");
      setParsedResult(null);
      setMatches([]);
      setSelectedMatch(null);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      alert("Error al eliminar el movimiento: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDismiss = () => {
    setParsedResult(null);
    setError(null);
    setMatches([]);
    setSelectedMatch(null);
  };

  return (
    <div className="space-y-4">
      {/* Smart Input Card */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-lg p-4">
        <form onSubmit={handleProcess} className="relative flex flex-col sm:flex-row gap-3 items-center">
          {/* Sparkles Floating/Visual */}
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
            <Sparkles className={`h-4 w-4 ${loading ? "text-purple-400 animate-pulse" : "text-zinc-500"}`} />
          </div>
          
          <input
            required
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Registrá o borrá con IA: 'Borrá el gasto de 5000 de hoy', 'Gasté 8500 en carrefour', 'Compré 0.05 BTC'..."
            className="w-full bg-[#09090b] border border-zinc-800 focus:border-zinc-700/80 rounded-lg py-2.5 pl-10 pr-4 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none transition-all flex-1"
            disabled={loading || saving}
          />
          
          <button
            type="submit"
            disabled={loading || !text.trim() || saving}
            className="w-full sm:w-auto px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-zinc-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" />
                Procesando...
              </>
            ) : (
              <>
                Procesar
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Error message */}
        {error && (
          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs">
            {error}
          </div>
        )}

        {/* AI Interpretation Preview Card (CREACIÓN) */}
        {parsedResult && (parsedResult.accion === "crear" || !parsedResult.accion) && (
          <div className="mt-4 p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-lg animate-in fade-in duration-200 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-zinc-900 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-zinc-450 uppercase tracking-wider">Interpretación de IA:</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide flex items-center gap-1 ${
                  parsedResult.tipo === "ingreso"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : parsedResult.tipo === "gasto"
                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                }`}>
                  {parsedResult.tipo === "ingreso" && <TrendingUp className="h-2.5 w-2.5" />}
                  {parsedResult.tipo === "gasto" && <TrendingDown className="h-2.5 w-2.5" />}
                  {parsedResult.tipo === "inversion" && <Wallet className="h-2.5 w-2.5" />}
                  {parsedResult.tipo}
                </span>
              </div>
              
              <div className="text-[10px] text-zinc-550 font-medium">
                Fecha detectada: <span className="font-mono text-zinc-350">{new Date(parsedResult.fecha + "T12:00:00").toLocaleDateString("es-AR", { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-[10px] text-zinc-550 block mb-0.5">Descripción</span>
                <span className="font-medium text-zinc-250 block truncate">{parsedResult.descripcion}</span>
              </div>

              <div>
                <span className="text-[10px] text-zinc-550 block mb-0.5">Categoría</span>
                <span className="font-medium text-zinc-250 block capitalize">{parsedResult.categoria || "N/A"}</span>
              </div>

              <div>
                <span className="text-[10px] text-zinc-550 block mb-0.5">Monto</span>
                <span className={`font-semibold font-mono block ${
                  parsedResult.tipo === "ingreso" ? "text-emerald-400" :
                  parsedResult.tipo === "gasto" ? "text-rose-450" : "text-indigo-400"
                }`}>
                  {parsedResult.tipo === "ingreso" ? "+" : "-"}
                  {parsedResult.isCrypto && parsedResult.cryptoQty && parsedResult.cryptoSymbol
                    ? `${parsedResult.cryptoQty} ${parsedResult.cryptoSymbol.toUpperCase()}`
                    : formatAmount(Number(parsedResult.monto))
                  }
                </span>
              </div>
            </div>

            {/* Crypto Metadata details if applicable */}
            {parsedResult.isCrypto && parsedResult.cryptoSymbol && (
              <div className="p-3 bg-zinc-900/50 border border-zinc-850/80 rounded-lg text-xs space-y-2.5">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                  <Coins className="h-3.5 w-3.5 text-zinc-500" />
                  Metadatos de Inversión Crypto
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-zinc-300">
                  <div>
                    <span className="text-[9px] text-zinc-550 block mb-0.5">Cantidad</span>
                    <span className="font-medium font-mono">{parsedResult.cryptoQty} {parsedResult.cryptoSymbol.toUpperCase()}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-550 block mb-0.5">Precio de Compra</span>
                    <span className="font-medium font-mono">u$s {Number(parsedResult.cryptoBuyPrice).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-550 block mb-0.5">Equiv. Estimado (Pesos)</span>
                    <span className="font-medium font-mono">
                      {formatAmount(
                        Number(parsedResult.cryptoQty || 0) * 
                        Number(parsedResult.cryptoBuyPrice || 0) * 
                        (cotizaciones?.dolares?.mep?.venta || 1000)
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-1 border-t border-zinc-900">
              <button
                type="button"
                onClick={handleDismiss}
                disabled={saving}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 border border-zinc-800"
              >
                <X className="h-3.5 w-3.5" />
                Descartar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={saving}
                className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-950" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5 text-zinc-950" />
                    Confirmar Registro
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* AI Interpretation Deletion UI (ELIMINACIÓN) */}
        {parsedResult && parsedResult.accion === "eliminar" && (
          <div className="mt-4 p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-lg animate-in fade-in duration-200 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-zinc-900 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-zinc-450 uppercase tracking-wider">Intención Detectada:</span>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide flex items-center gap-1 bg-red-500/10 text-red-400 border border-red-500/20">
                  <Trash2 className="h-2.5 w-2.5" />
                  Eliminar Movimiento
                </span>
              </div>
              
              <div className="text-[10px] text-zinc-550 font-medium">
                Acción por IA
              </div>
            </div>

            {/* Case 1: No match found */}
            {matches.length === 0 && (
              <div className="p-4 bg-zinc-900/10 border border-zinc-850 rounded-lg text-center space-y-2">
                <AlertTriangle className="h-6 w-6 text-zinc-550 mx-auto" />
                <p className="text-xs font-semibold text-zinc-350">No se encontraron movimientos coincidentes</p>
                <p className="text-[11px] text-zinc-500 max-w-md mx-auto leading-relaxed">
                  No pudimos encontrar ningún movimiento que coincida con tu solicitud de eliminación. Intenta especificando más detalles como el monto exacto, la descripción o la fecha.
                </p>
                
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 text-xs font-semibold rounded-lg transition-all cursor-pointer border border-zinc-800"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            )}

            {/* Case 2: Multiple matches, choose one */}
            {matches.length > 1 && !selectedMatch && (
              <div className="space-y-3">
                <p className="text-xs font-medium text-zinc-400">
                  Se encontraron múltiples coincidencias. Selecciona el movimiento que deseas eliminar:
                </p>
                
                <div className="divide-y divide-zinc-900 border border-zinc-900 rounded-lg bg-[#09090b]/50 overflow-hidden max-h-60 overflow-y-auto">
                  {matches.map((item) => {
                    const isInv = item.tipo === "inversion";
                    const isCrypto = isInv && item.isAdvanced;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedMatch(item)}
                        className="w-full text-left p-3 hover:bg-zinc-900/50 flex items-center justify-between transition-colors cursor-pointer group"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-zinc-250 text-xs group-hover:text-zinc-100 transition-colors">
                              {item.descripcion}
                            </span>
                            {item.categoria && (
                              <span className="text-[9px] px-1.5 py-0.2 bg-zinc-900 border border-zinc-850 text-zinc-500 rounded">
                                {item.categoria}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono">
                            {new Date(item.fecha).toLocaleDateString("es-AR", { day: 'numeric', month: 'long', year: 'numeric' })}
                            {isInv && <span className="ml-2 text-indigo-400 font-sans font-semibold">• Inversión</span>}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`font-mono text-xs font-semibold ${
                            item.tipo === "ingreso" ? "text-emerald-400" :
                            item.tipo === "gasto" ? "text-rose-455" : "text-indigo-400"
                          }`}>
                            {item.tipo === "ingreso" ? "+" : "-"}
                            {isCrypto && item.cryptoDetails
                              ? `${item.cryptoDetails.qty} ${item.cryptoDetails.symbol}`
                              : formatAmount(Number(item.monto))
                            }
                          </span>
                          <span className="block text-[9px] text-zinc-500 group-hover:text-red-400 transition-colors mt-0.5">
                            Seleccionar
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-end pt-2 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 text-xs font-semibold rounded-lg transition-all cursor-pointer border border-zinc-800"
                  >
                    Descartar
                  </button>
                </div>
              </div>
            )}

            {/* Case 3: Confirmed Match */}
            {selectedMatch && (
              <div className="space-y-4">
                <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-lg text-xs text-red-400 flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="font-semibold">¿Confirmar eliminación?</p>
                    <p className="text-zinc-405 text-[11px] leading-relaxed">
                      Esta acción eliminará de forma permanente el siguiente registro. El balance de tus cuentas se recalculará automáticamente.
                    </p>
                  </div>
                </div>

                {/* Match details display */}
                <div className="p-4 bg-[#09090b]/40 border border-zinc-900 rounded-lg text-xs space-y-3.5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-zinc-550 block mb-0.5">Descripción</span>
                      <span className="font-medium text-zinc-200 block truncate">{selectedMatch.descripcion}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-zinc-550 block mb-0.5">Tipo</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide inline-flex items-center gap-1 ${
                        selectedMatch.tipo === "ingreso"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : selectedMatch.tipo === "gasto"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                      }`}>
                        {selectedMatch.tipo}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-zinc-550 block mb-0.5">Fecha del Movimiento</span>
                      <span className="font-mono text-zinc-300 block">
                        {new Date(selectedMatch.fecha).toLocaleDateString("es-AR", { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-zinc-550 block mb-0.5">Monto</span>
                      <span className={`font-semibold font-mono block ${
                        selectedMatch.tipo === "ingreso" ? "text-emerald-400" :
                        selectedMatch.tipo === "gasto" ? "text-rose-455" : "text-indigo-405"
                      }`}>
                        {selectedMatch.tipo === "ingreso" ? "+" : "-"}
                        {selectedMatch.isAdvanced && selectedMatch.cryptoDetails
                          ? `${selectedMatch.cryptoDetails.qty} ${selectedMatch.cryptoDetails.symbol}`
                          : formatAmount(Number(selectedMatch.monto))
                        }
                      </span>
                    </div>
                  </div>

                  {/* Render crypto details if it's a crypto investment */}
                  {selectedMatch.isAdvanced && selectedMatch.cryptoDetails && (
                    <div className="pt-3 border-t border-zinc-900/60 grid grid-cols-2 gap-4 text-zinc-400">
                      <div>
                        <span className="text-[9px] text-zinc-550 block mb-0.5">Cantidad Crypto</span>
                        <span className="font-medium font-mono text-zinc-300">
                          {selectedMatch.cryptoDetails.qty} {selectedMatch.cryptoDetails.symbol}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-550 block mb-0.5">Precio de Compra</span>
                        <span className="font-medium font-mono text-zinc-300">
                          u$s {Number(selectedMatch.cryptoDetails.buyPrice).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Deletion actions */}
                <div className="flex items-center justify-between pt-1 border-t border-zinc-900">
                  {matches.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => setSelectedMatch(null)}
                      disabled={saving}
                      className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 text-xs font-semibold rounded-lg transition-all cursor-pointer border border-zinc-800 flex items-center gap-1.5"
                    >
                      <ArrowRight className="h-3.5 w-3.5 rotate-180" />
                      Volver a la lista
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleDismiss}
                      disabled={saving}
                      className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 text-xs font-semibold rounded-lg transition-all cursor-pointer border border-zinc-800 flex items-center gap-1.5"
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancelar
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteConfirm(selectedMatch)}
                    disabled={saving}
                    className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                        Eliminando...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-3.5 w-3.5 text-white" />
                        Confirmar Eliminación
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
