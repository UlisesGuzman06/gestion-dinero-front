"use client";
import { useEffect, useState } from "react";
import { getCotizaciones } from "@/lib/api";
import { DollarSign, Coins, RefreshCw } from "lucide-react";

interface TickerBarProps {
  isSidebar?: boolean;
}

export default function TickerBar({ isSidebar = false }: TickerBarProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function load() {
    try {
      setError(false);
      const res = await getCotizaciones();
      setData(res);
    } catch (err) {
      console.error("Error al cargar cotizaciones:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30 * 1000); // Refrescar cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className={isSidebar ? "px-3 py-2" : "space-y-3"}>
        {!isSidebar && (
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-normal">
            Cotizaciones de Mercado
          </h3>
        )}
        <div className={`${isSidebar ? "" : "card-banking p-5"} flex justify-center items-center text-zinc-500 text-xs`}>
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-550 mr-2" />
          Sincronizando...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={isSidebar ? "px-3 py-2" : "space-y-3"}>
        {!isSidebar && (
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-normal">
            Cotizaciones de Mercado
          </h3>
        )}
        <div className={`${isSidebar ? "" : "card-banking p-5"} flex flex-col items-center justify-center gap-2 text-zinc-500 text-xs text-center`}>
          <span>Error de conexión</span>
          <button onClick={load} className="text-zinc-350 hover:text-zinc-200 underline text-[11px] cursor-pointer font-medium">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const { dolares, cryptos } = data;

  const items = [
    { name: "Dólar MEP", value: dolares.mep ? `$${Number(dolares.mep.venta).toFixed(0)}` : "N/A", isCrypto: false },
    { name: "Dólar Blue", value: dolares.blue ? `$${Number(dolares.blue.venta).toFixed(0)}` : "N/A", isCrypto: false },
    { name: "Dólar Tarjeta", value: dolares.tarjeta ? `$${Number(dolares.tarjeta.venta).toFixed(0)}` : "N/A", isCrypto: false },
    { name: "Bitcoin", value: cryptos.btc ? `u$s ${cryptos.btc.usd.toLocaleString("es-AR", { maximumFractionDigits: 0 })}` : "N/A", isCrypto: true },
    { name: "Ethereum", value: cryptos.eth ? `u$s ${cryptos.eth.usd.toLocaleString("es-AR", { maximumFractionDigits: 0 })}` : "N/A", isCrypto: true },
  ];

  if (isSidebar) {
    return (
      <div className="space-y-2 px-1">
        <div className="flex justify-between items-center px-2">
          <span className="text-[10px] font-semibold text-zinc-550 uppercase tracking-wider">MERCADO</span>
          <button onClick={load} className="text-zinc-650 hover:text-zinc-400 transition-colors p-0.5">
            <RefreshCw className="w-2.5 h-2.5" />
          </button>
        </div>
        <div className="space-y-1">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between px-2 py-1 hover:bg-zinc-800/30 rounded-md transition-colors">
              <span className="text-[11px] text-zinc-400 font-medium">{item.name}</span>
              <span className="text-[11px] font-mono font-semibold text-zinc-300">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-normal flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          Cotizaciones de Mercado
        </h3>
        <button
          onClick={load}
          className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
          title="Refrescar"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      <div className="card-banking divide-y divide-zinc-800/40 overflow-hidden">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between px-4 py-2.5 hover:bg-zinc-900/40 transition-colors"
          >
            <div className="flex items-center gap-2">
              {item.isCrypto ? (
                <Coins className="w-3.5 h-3.5 text-zinc-500" />
              ) : (
                <DollarSign className="w-3.5 h-3.5 text-zinc-500" />
              )}
              <span className="text-xs text-zinc-300 font-medium">{item.name}</span>
            </div>
            <span className="text-xs font-semibold font-mono text-zinc-100">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
