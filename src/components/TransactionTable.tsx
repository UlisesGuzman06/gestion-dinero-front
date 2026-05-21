import { deleteMovement } from "@/lib/api";
import { Edit2, Trash2 } from "lucide-react";

interface Transaction {
  id: string;
  fecha: string;
  descripcion: string;
  monto: number;
  tipo: "ingreso" | "gasto" | "inversion";
  categoria?: string;
}

interface TransactionTableProps {
  transactions: Transaction[];
  onRefresh: () => void;
  onEdit: (transaction: Transaction) => void;
  dolarizar?: boolean;
  cotizaciones?: any;
}

export default function TransactionTable({
  transactions,
  onRefresh,
  onEdit,
  dolarizar = false,
  cotizaciones
}: TransactionTableProps) {

  const handleDelete = async (id: string, type: "ingreso" | "gasto" | "inversion") => {
    if (confirm("¿Estás seguro de que quieres borrar este movimiento?")) {
      try {
        await deleteMovement(id, type);
        onRefresh();
      } catch (error) {
        console.error("Error al borrar:", error);
        alert("Ocurrió un error al intentar borrar.");
      }
    }
  };

  // Helper de formateo de moneda
  const formatAmount = (amount: number) => {
    if (dolarizar && cotizaciones?.dolares?.mep?.venta) {
      const converted = amount / cotizaciones.dolares.mep.venta;
      return `u$s ${converted.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${amount.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-lg overflow-hidden">
      {/* Vista Desktop - Tabla Clásica */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-900/30 border-b border-zinc-800/80 text-[11px] font-medium text-zinc-450">
              <th className="px-6 py-3">Fecha</th>
              <th className="px-6 py-3">Descripción</th>
              <th className="px-6 py-3 text-right">Monto</th>
              <th className="px-6 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/40 text-xs text-zinc-300">
            {transactions.map((t) => (
              <tr key={t.id} className="hover:bg-zinc-900/30 transition-colors group">
                {/* Date */}
                <td className="px-6 py-3 text-zinc-500 font-medium">
                  {new Date(t.fecha).toLocaleDateString("es-AR", { day: 'numeric', month: 'short' })}
                </td>
 
                {/* Description & Category */}
                <td className="px-6 py-3">
                  <div className="flex flex-col">
                    <span className="font-medium text-zinc-200">{t.descripcion}</span>
                    {t.categoria && (
                      <span className="text-[10px] text-zinc-500 mt-0.5">
                        {t.categoria}
                      </span>
                    )}
                  </div>
                </td>
 
                {/* Amount */}
                <td className={`px-6 py-3 text-right font-medium font-mono ${t.tipo === "ingreso" ? "text-emerald-400" :
                    t.tipo === "gasto" ? "text-rose-400" : "text-indigo-400"
                  }`}>
                  {t.tipo === "ingreso" ? "+" : "-"}{formatAmount(Math.abs(t.monto))}
                </td>
 
                <td className="px-6 py-3 text-center">
                  <div className="flex items-center justify-center gap-3">
                    {t.categoria !== "Mercado Pago" && (
                      <div className="flex items-center gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => onEdit(t)}
                          className="p-1 rounded text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id, t.tipo)}
                          className="p-1 rounded text-zinc-550 hover:text-red-400 transition-colors cursor-pointer"
                          title="Borrar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-zinc-500 text-xs">
                  No hay movimientos registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Vista Móvil - Tarjetas Flexibles */}
      <div className="block md:hidden divide-y divide-zinc-800/40 text-xs text-zinc-300">
        {transactions.map((t) => {
          const dateObj = new Date(t.fecha);
          const dayNumeric = dateObj.toLocaleDateString("es-AR", { day: 'numeric' });
          const monthShort = dateObj.toLocaleDateString("es-AR", { month: 'short' }).replace('.', '').toUpperCase();

          return (
            <div key={t.id} className="p-4 flex items-center justify-between gap-3 hover:bg-zinc-900/10 transition-colors">
              {/* Badge de fecha tipo Calendario */}
              <div className="w-10 h-10 rounded bg-[#121215] border border-zinc-850 flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-[9px] text-zinc-500 font-bold uppercase leading-none">{monthShort}</span>
                <span className="text-xs text-zinc-200 font-bold font-mono mt-0.5 leading-none">{dayNumeric}</span>
              </div>

              {/* Descripción y Categoría */}
              <div className="flex-1 min-w-0">
                <span className="font-medium text-zinc-200 block truncate">{t.descripcion}</span>
                {t.categoria && (
                  <span className="inline-block px-1.5 py-0.5 text-[9px] font-medium bg-zinc-900/60 border border-zinc-850 text-zinc-450 rounded mt-1 truncate max-w-[130px]">
                    {t.categoria}
                  </span>
                )}
              </div>

              {/* Monto y Acciones */}
              <div className="text-right flex flex-col items-end gap-1.5">
                <span className={`font-mono text-xs font-semibold ${
                  t.tipo === "ingreso" ? "text-emerald-400" :
                  t.tipo === "gasto" ? "text-rose-400" : "text-indigo-400"
                }`}>
                  {t.tipo === "ingreso" ? "+" : "-"}{formatAmount(Math.abs(t.monto))}
                </span>
                
                {t.categoria !== "Mercado Pago" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit(t)}
                      className="p-1 rounded text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                      title="Editar"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id, t.tipo)}
                      className="p-1 rounded text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                      title="Borrar"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {transactions.length === 0 && (
          <div className="p-8 text-center text-zinc-500 text-xs">
            No hay movimientos registrados
          </div>
        )}
      </div>
    </div>
  );
}
